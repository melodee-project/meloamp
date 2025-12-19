import React from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import { ErrorOutline, Refresh, WifiOff, LockOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export type ErrorType = 'generic' | 'network' | 'notFound' | 'unauthorized' | 'forbidden';

export interface ErrorStateProps {
  /** Type of error to determine icon and default message */
  type?: ErrorType;
  /** Custom error message */
  message?: string;
  /** Full error details (shown in dev mode or expandable) */
  details?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Custom retry button text */
  retryLabel?: string;
  /** Whether to show as a full-page error or inline alert */
  fullPage?: boolean;
  /** Alert severity when in inline mode */
  severity?: 'error' | 'warning' | 'info';
}

const iconMap: Record<ErrorType, React.ReactNode> = {
  generic: <ErrorOutline sx={{ fontSize: 64 }} />,
  network: <WifiOff sx={{ fontSize: 64 }} />,
  notFound: <ErrorOutline sx={{ fontSize: 64 }} />,
  unauthorized: <LockOutlined sx={{ fontSize: 64 }} />,
  forbidden: <LockOutlined sx={{ fontSize: 64 }} />,
};

/**
 * Standard error state component for consistent error UX across the app.
 */
export default function ErrorState({ 
  type = 'generic',
  message,
  details,
  onRetry,
  retryLabel,
  fullPage = true,
  severity = 'error',
}: ErrorStateProps) {
  const { t } = useTranslation();

  // Default messages based on type
  const defaultMessages: Record<ErrorType, { title: string; description: string }> = {
    generic: { 
      title: t('error.generic', 'Something went wrong'), 
      description: t('error.genericDesc', 'An unexpected error occurred. Please try again.') 
    },
    network: { 
      title: t('error.network', 'Connection error'), 
      description: t('error.networkDesc', 'Unable to connect to the server. Check your network connection.') 
    },
    notFound: { 
      title: t('error.notFound', 'Not found'), 
      description: t('error.notFoundDesc', 'The requested resource could not be found.') 
    },
    unauthorized: { 
      title: t('error.unauthorized', 'Session expired'), 
      description: t('error.unauthorizedDesc', 'Please log in again to continue.') 
    },
    forbidden: { 
      title: t('error.forbidden', 'Access denied'), 
      description: t('error.forbiddenDesc', 'You do not have permission to access this resource.') 
    },
  };

  const displayTitle = defaultMessages[type].title;
  const displayMessage = message ?? defaultMessages[type].description;
  const displayRetryLabel = retryLabel ?? t('common.retry', 'Try Again');

  // Inline alert mode
  if (!fullPage) {
    return (
      <Alert 
        severity={severity} 
        sx={{ my: 2 }}
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry} startIcon={<Refresh />}>
              {displayRetryLabel}
            </Button>
          ) : undefined
        }
      >
        <AlertTitle>{displayTitle}</AlertTitle>
        {displayMessage}
        {details && process.env.NODE_ENV === 'development' && (
          <Typography variant="caption" display="block" sx={{ mt: 1, fontFamily: 'monospace' }}>
            {details}
          </Typography>
        )}
      </Alert>
    );
  }

  // Full page error
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
      role="alert"
    >
      <Box sx={{ color: 'error.main', mb: 2 }}>
        {iconMap[type]}
      </Box>
      <Typography variant="h6" color="error" gutterBottom>
        {displayTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
        {displayMessage}
      </Typography>
      {details && process.env.NODE_ENV === 'development' && (
        <Typography 
          variant="caption" 
          color="text.disabled" 
          sx={{ mt: 1, fontFamily: 'monospace', maxWidth: 500, wordBreak: 'break-word' }}
        >
          {details}
        </Typography>
      )}
      {onRetry && (
        <Button 
          variant="contained" 
          onClick={onRetry}
          startIcon={<Refresh />}
          sx={{ mt: 3 }}
        >
          {displayRetryLabel}
        </Button>
      )}
    </Box>
  );
}
