import React from 'react';
import {
  Alert,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import apiRequest, { unwrapApiResponse } from '../api';
import { API_ROUTES } from '../apiRoutes';
import { AdminUser } from '../apiModels';

function normalizeUsers(value: unknown): AdminUser[] {
  const payload = unwrapApiResponse<unknown>(value);
  if (Array.isArray(payload)) return payload as AdminUser[];
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested as AdminUser[];
  }
  return [];
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest<AdminUser[]>(API_ROUTES.admin.users);
      setUsers(normalizeUsers(response.data));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('error.generic', 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('adminUsers.title', 'Admin Users')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {t('adminUsers.subtitle', 'User accounts with admin-level visibility')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('adminUsers.username', 'Username')}</TableCell>
                  <TableCell>{t('adminUsers.email', 'Email')}</TableCell>
                  <TableCell>{t('adminUsers.role', 'Role')}</TableCell>
                  <TableCell>{t('adminUsers.status', 'Status')}</TableCell>
                  <TableCell>{t('adminUsers.createdAt', 'Created')}</TableCell>
                  <TableCell>{t('adminUsers.lastLoginAt', 'Last login')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!users.length ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center' }}>
                      <Typography color="text.secondary" sx={{ py: 2 }}>
                        {t('adminUsers.noUsers', 'No users found')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email || t('adminUsers.noEmail', 'No email')}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={user.isAdmin ? 'primary' : 'default'}
                          label={user.isAdmin ? t('adminUsers.roleAdmin', 'Admin') : t('adminUsers.roleUser', 'User')}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={user.isEnabled ? 'success' : 'warning'}
                          label={user.isEnabled ? t('adminUsers.enabled', 'Enabled') : t('adminUsers.disabled', 'Disabled')}
                        />
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : t('adminUsers.never', 'Never')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
