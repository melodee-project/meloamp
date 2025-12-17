import React, { useRef, ReactElement } from 'react';
import { Box, Typography, IconButton, List, ListItem, ListItemAvatar, Avatar, ListItemText, Button } from '@mui/material';
import { Delete, DragIndicator } from '@mui/icons-material';
import { useQueueStore, QueueState, Song } from '../queueStore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { List as VirtualList, RowComponentProps } from 'react-window';
import './QueueView.css'; // <-- Add this import for custom CSS
import { useTranslation } from 'react-i18next';

// Threshold for enabling virtualization (for smaller lists, regular rendering is fine)
const VIRTUALIZATION_THRESHOLD = 50;
const ITEM_HEIGHT = 72; // Height of each queue item in pixels

// Custom props passed to the virtualized row component via react-window v2 rowProps
interface CustomRowProps {
  queue: Song[];
  playerCurrent: number;
  playing: boolean;
  removeFromQueue: (index: number) => void;
  t: (key: string) => string;
}

// Virtualized row component for react-window v2
// Uses RowComponentProps<CustomRowProps> which includes ariaAttributes, index, style + custom props
function VirtualizedRow({ 
  ariaAttributes, 
  index, 
  style, 
  queue, 
  playerCurrent, 
  playing, 
  removeFromQueue, 
  t 
}: RowComponentProps<CustomRowProps>): ReactElement {
  const song = queue[index];
  
  // Return empty div if no song (should not happen, but satisfies type requirement)
  if (!song) {
    return <div style={style} {...ariaAttributes} />;
  }
  
  return (
    <div style={style} {...ariaAttributes}>
      <ListItem
        secondaryAction={
          <IconButton edge="end" onClick={() => removeFromQueue(index)}><Delete /></IconButton>
        }
        className={song.played ? 'played-song' : 'unplayed-song'}
        sx={{
          mb: 0.5,
          borderRadius: 2,
          border: index === playerCurrent && playing ? '3px solid transparent' : '2px solid',
          borderColor: index === playerCurrent && playing ? 'transparent' : song.played ? 'grey.300' : 'primary.main',
          fontWeight: song.played ? 400 : 700,
          opacity: song.played ? 0.5 : 1,
          background: index === playerCurrent ? 'rgba(0,0,0,0.04)' : 'none',
          height: ITEM_HEIGHT - 8,
          transition: 'background 0.2s, opacity 0.2s',
        }}
      >
        <ListItemAvatar>
          <Avatar src={song.imageUrl} alt={song.title} />
        </ListItemAvatar>
        <ListItemText
          primary={song.title}
          secondary={song.artist?.name || t('queue.unknownArtist')}
          primaryTypographyProps={{ fontWeight: song.played ? 'normal' : 'bold' }}
        />
      </ListItem>
    </div>
  );
}

export default function QueueView() {
  const queue = useQueueStore((state: QueueState) => state.queue);
  const removeFromQueue = useQueueStore((state: QueueState) => state.removeFromQueue);
  const reorderQueue = useQueueStore((state: QueueState) => state.reorderQueue);
  const clearQueue = useQueueStore((state: QueueState) => state.clearQueue);
  // Get playing state from Player (global store or context)
  const [playing, setPlaying] = React.useState(false);
  const [playerCurrent, setPlayerCurrent] = React.useState<number>(-1);
  const { t } = useTranslation();

  React.useEffect(() => {
    // Listen for playing state and current index from Player via window event
    function handlePlayerState(e: any) {
      if (e?.detail) {
        if (typeof e.detail.playing === 'boolean') setPlaying(e.detail.playing);
        if (typeof e.detail.current === 'number') setPlayerCurrent(e.detail.current);
      }
    }
    window.addEventListener('meloamp-player-state', handlePlayerState);
    return () => window.removeEventListener('meloamp-player-state', handlePlayerState);
  }, []);

  const shuffleQueue = () => {
    const shuffled = [...queue];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Reorder queue to match shuffled order
    shuffled.forEach((song, idx) => {
      const origIdx = queue.findIndex((s: typeof song) => s.id === song.id);
      if (origIdx !== idx) reorderQueue(origIdx, idx);
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderQueue(result.source.index, result.destination.index);
  };

  const handleSaveAsPlaylist = async () => {
    // Example: POST to /users/playlists with queue as songs
    await fetch('/users/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Queue Playlist', songs: queue }),
    });
    // Optionally show a snackbar or feedback
  };

  // Helper to sum total duration in seconds using song.durationMs (guaranteed present and always a number)
  const totalDuration = queue.reduce((sum, song) => sum + song.durationMs, 0);
  // Helper to format ms as mm:ss or h:mm:ss
  function formatMs(ms: number) {
    if (typeof ms !== 'number' || isNaN(ms) || ms <= 0) return '';
    const sec = Math.round(ms / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Use virtualization for large lists (50+ songs)
  const useVirtualization = queue.length >= VIRTUALIZATION_THRESHOLD;
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Props for the virtualized row component (react-window v2 uses rowProps)
  const rowProps: CustomRowProps = {
    queue,
    playerCurrent,
    playing,
    removeFromQueue,
    t
  };

  // Regular draggable row for smaller lists
  const DraggableRow = ({ song, idx, provided }: { song: Song; idx: number; provided: any }) => (
    <ListItem 
      ref={provided.innerRef} 
      {...provided.draggableProps} 
      secondaryAction={
        <IconButton edge="end" onClick={() => removeFromQueue(idx)}><Delete /></IconButton>
      }
      className={song.played ? 'played-song' : 'unplayed-song'}
      sx={{
        mb: 1,
        borderRadius: 2,
        border: idx === playerCurrent && playing ? '3px solid transparent' : '2px solid',
        borderColor: idx === playerCurrent && playing ? 'transparent' : song.played ? 'grey.300' : 'primary.main',
        fontWeight: song.played ? 400 : 700,
        opacity: song.played ? 0.5 : 1,
        background: idx === playerCurrent ? 'rgba(0,0,0,0.04)' : 'none',
        position: 'relative',
        zIndex: idx === playerCurrent ? 1 : 'auto',
        bgcolor: song.played ? 'background.paper' : (idx > 0 && !queue[idx-1].played ? 'background.default' : 'background.paper'),
        transition: 'background 0.2s, opacity 0.2s',
      }}
    >
      <span {...provided.dragHandleProps}><DragIndicator /></span>
      <ListItemAvatar>
        <Avatar src={song.imageUrl} alt={song.title} />
      </ListItemAvatar>
      <ListItemText 
        primary={song.title} 
        secondary={song.artist?.name || t('queue.unknownArtist')} 
        primaryTypographyProps={{ fontWeight: song.played ? 'normal' : 'bold' }}
      />
    </ListItem>
  );

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>{t('queue.title')}</Typography>
      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
        {queue.length} song{queue.length === 1 ? '' : 's'}
        {queue.length > 0 ? ` • ${formatMs(totalDuration)}` : ''}
        {useVirtualization && <span> • Virtualized for performance</span>}
      </Typography>
      <Button onClick={clearQueue} color="error" sx={{ mr: 2 }}>{t('queue.clear')}</Button>
      <Button onClick={shuffleQueue} sx={{ mr: 2 }}>{t('queue.shuffle')}</Button>
      <Button onClick={handleSaveAsPlaylist} sx={{ mr: 2 }}>{t('queue.save')}</Button>
      <Button onClick={() => {}} color="primary">{t('queue.playAll')}</Button>
      {queue.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary', fontSize: 24 }}>
          No Songs
        </Box>
      ) : useVirtualization ? (
        // Virtualized list for large queues (50+ songs) - no drag-drop for performance
        <Box 
          ref={listContainerRef} 
          sx={{ 
            mt: 2, 
            height: Math.min(600, queue.length * ITEM_HEIGHT), 
            minHeight: 400,
            overflow: 'hidden'
          }}
        >
          <VirtualList<CustomRowProps>
            style={{ height: '100%', width: '100%' }}
            defaultHeight={600}
            rowCount={queue.length}
            rowHeight={ITEM_HEIGHT}
            overscanCount={5}
            rowComponent={VirtualizedRow}
            rowProps={rowProps}
          />
        </Box>
      ) : (
        // Regular drag-drop list for smaller queues
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="queue">
            {(provided: any) => (
              <List ref={provided.innerRef} {...provided.droppableProps}>
                {queue.map((song: Song, idx: number) => (
                  <Draggable key={song.id} draggableId={song.id.toString()} index={idx}>
                    {(provided: any) => <DraggableRow song={song} idx={idx} provided={provided} />}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </Box>
  );
}
