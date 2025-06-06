import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia } from '@mui/material';
import { Statistic } from '../apiModels';

export default function StatisticCard({ stat }: { stat: Statistic }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{stat.title}</Typography>
        <Typography variant="subtitle2" color="text.secondary">{stat.data}</Typography>
      </CardContent>
    </Card>
  );
}
