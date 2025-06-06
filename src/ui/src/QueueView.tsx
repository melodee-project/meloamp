import React from 'react';
import { Box, Typography, IconButton, List, ListItem, ListItemAvatar, Avatar, ListItemText, Button } from '@mui/material';
import { Delete, DragIndicator, Shuffle, Save } from '@mui/icons-material';
import { useQueueStore, QueueState } from './queueStore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function QueueView() {
  const queue = useQueueStore((state: QueueState) => state.queue);
  const removeFromQueue = useQueueStore((state: QueueState) => state.removeFromQueue);
  const reorderQueue = useQueueStore((state: QueueState) => state.reorderQueue);
  const clearQueue = useQueueStore((state: QueueState) => state.clearQueue);
  const setCurrent = useQueueStore((state: QueueState) => state.setCurrent);
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

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h6">Playback Queue</Typography>
      <Button onClick={shuffleQueue} startIcon={<Shuffle />}>Shuffle</Button>
      <Button onClick={handleSaveAsPlaylist} startIcon={<Save />} sx={{ ml: 1 }}>Save as Playlist</Button>
      <Button onClick={clearQueue} sx={{ ml: 1 }}>Clear</Button>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="queue">
          {(provided: any) => (
            <List ref={provided.innerRef} {...provided.droppableProps}>
              {queue.map((song: any, idx: number) => (
                <Draggable key={song.id} draggableId={song.id.toString()} index={idx}>
                  {(provided: any) => (
                    <ListItem ref={provided.innerRef} {...provided.draggableProps} secondaryAction={
                      <IconButton edge="end" onClick={() => removeFromQueue(idx)}><Delete /></IconButton>
                    }>
                      <span {...provided.dragHandleProps}><DragIndicator /></span>
                      <ListItemAvatar>
                        <Avatar src={song.imageUrl} alt={song.title} />
                      </ListItemAvatar>
                      <ListItemText primary={song.title} secondary={song.artist?.name} />
                    </ListItem>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>
    </Box>
  );
}
