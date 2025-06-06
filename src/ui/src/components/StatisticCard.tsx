import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Statistic } from '../apiModels';

export default function StatisticCard({ stat }: { stat: Statistic }) {
  // If you add a thumbnailUrl to Statistic in the future, you can use CardMedia here.
  return (
    <Card sx={{ width: 160, minWidth: 160, display: 'flex', alignItems: 'center', p: 1, m: 1 }}>
      <CardContent sx={{ flex: 1, p: 1 }}>
        <Typography variant="h6">{stat.title}</Typography>
        <Typography variant="subtitle2" color="text.secondary">{stat.data}</Typography>
      </CardContent>
    </Card>
  );
}
