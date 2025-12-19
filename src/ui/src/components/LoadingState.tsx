import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface LoadingStateProps {
  /** Custom message to display below the spinner */
  message?: string;
  /** Size of the spinner: 'small' (24px), 'medium' (40px), 'large' (56px) */
  size?: 'small' | 'medium' | 'large';
  /** Whether to display fullscreen/centered or inline */
  fullPage?: boolean;
}

const sizeMap = {
  small: 24,
  medium: 40,
  large: 56,
};

/**
 * Standard loading state component for consistent loading UX across the app.
 */
export default function LoadingState({ 
  message, 
  size = 'medium', 
  fullPage = true 
}: LoadingStateProps) {
  const { t } = useTranslation();
  const displayMessage = message ?? t('common.loading');

  if (!fullPage) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <CircularProgress size={sizeMap[size]} />
        {displayMessage && (
          <Typography variant="body2" color="text.secondary">
            {displayMessage}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        p: 4,
        textAlign: 'center',
      }}
      role="status"
      aria-busy="true"
      aria-label={displayMessage}
    >
      <CircularProgress size={sizeMap[size]} />
      {displayMessage && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          {displayMessage}
        </Typography>
      )}
    </Box>
  );
}
