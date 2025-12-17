import { useNavigate } from 'react-router-dom';
import { Artist } from '../apiModels';
import { Card, CardMedia, Typography, Box } from '@mui/material';

export default function MiniArtistCard({ artist }: { artist: Artist }) {
  const navigate = useNavigate();
  return (
    <Card
      sx={{
        width: 135,
        minWidth: 0,
        m: 1,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        boxShadow: 2,
        borderRadius: 2,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 6 },
      }}
      onClick={() => navigate(`/artists/${artist.id}`)}
      title={artist.name}
    >
      <Box sx={{ width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
        <CardMedia
          component="img"
          sx={{ width: 84, height: 84, objectFit: 'cover', borderRadius: '50%' }}
          image={artist.imageUrl || artist.thumbnailUrl}
          alt={artist.name}
        />
      </Box>
      <Typography
        variant="body2"
        sx={{
          width: '100%',
          textAlign: 'center',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {artist.name}
      </Typography>
    </Card>
  );
}

