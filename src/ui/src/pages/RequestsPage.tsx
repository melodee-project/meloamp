import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  ChatBubble,
  CheckCircle,
  FilterList,
  Refresh,
  Send,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { API_ROUTES } from '../apiRoutes';
import apiRequest from '../api';
import {
  ActivityCheckResponse,
  CommentPagedResponse,
  CreateCommentRequest,
  CreateRequestRequest,
  PagedResponseOfUnreadRequestSummary,
  RequestCommentDto,
  RequestDetail,
  RequestPagedResponse,
  RequestSummary,
  UpdateRequestRequest,
} from '../apiModels';

function unwrapPayload<T>(value: unknown): T | null {
  if (!value || typeof value !== 'object') return null;
  const hasPayload = (value as { data?: unknown; meta?: unknown; items?: unknown }).data !== undefined;
  if (hasPayload) return value as T;
  const nested = (value as { data?: unknown }).data;
  if (
    nested &&
    typeof nested === 'object' &&
    ((nested as { data?: unknown }).data !== undefined || (nested as { results?: unknown }).results !== undefined)
  ) {
    return nested as T;
  }
  return null;
}

export default function RequestsPage() {
  const { requestApiKey } = useParams<{ requestApiKey: string }>();
  const { t } = useTranslation();
  const requestDetailMode = Boolean(requestApiKey);
  const [list, setList] = React.useState<RequestSummary[]>([]);
  const [detail, setDetail] = React.useState<RequestDetail | null>(null);
  const [comments, setComments] = React.useState<RequestCommentDto[]>([]);
  const [meta, setMeta] = React.useState({ totalPages: 1, totalCount: 0, currentPage: 1 });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [queryText, setQueryText] = React.useState('');
  const [mineOnly, setMineOnly] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [artistApiKey, setArtistApiKey] = React.useState('');
  const [albumApiKey, setAlbumApiKey] = React.useState('');
  const [songApiKey, setSongApiKey] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [showUnreadOnly, setShowUnreadOnly] = React.useState(false);
  const [hasUnread, setHasUnread] = React.useState(false);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [commentError, setCommentError] = React.useState<string | null>(null);

  const [newRequest, setNewRequest] = React.useState<CreateRequestRequest>({
    category: '',
    description: '',
  });

  const [inlineDescription, setInlineDescription] = React.useState('');

  const loadRequests = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (showUnreadOnly) {
        const res = await apiRequest<PagedResponseOfUnreadRequestSummary>(API_ROUTES.requests.unreadActivity, {
          params: { page, pageSize },
        });
        const payload = unwrapPayload<PagedResponseOfUnreadRequestSummary>(res.data);
        if (payload) {
          setList((payload as unknown as { data: RequestSummary[] }).data || []);
          const responseMeta = (payload as { meta?: { totalPages?: number; totalCount?: number; currentPage?: number } }).meta || {};
          setMeta({
            totalPages: responseMeta.totalPages ?? 1,
            totalCount: responseMeta.totalCount ?? 0,
            currentPage: responseMeta.currentPage ?? 1,
          });
        }
        return;
      }
      const response = await apiRequest<RequestPagedResponse>(API_ROUTES.requests.list, {
        params: {
          page,
          pageSize,
          query: queryText || undefined,
          mine: mineOnly || undefined,
          status: status || undefined,
          artistApiKey: artistApiKey || undefined,
          albumApiKey: albumApiKey || undefined,
          songApiKey: songApiKey || undefined,
        },
      });
      const payload = unwrapPayload<RequestPagedResponse>(response.data);
      if (payload) {
        setList((payload as RequestPagedResponse).data || []);
        setMeta((payload as RequestPagedResponse).meta || meta);
      } else {
        setList([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoading(false);
    }
  }, [albumApiKey, artistApiKey, mineOnly, page, pageSize, queryText, showUnreadOnly, songApiKey, status, t, meta]);

  const loadActivity = React.useCallback(async () => {
    try {
      const response = await apiRequest<ActivityCheckResponse>(API_ROUTES.requests.activity);
      const payload = unwrapPayload<ActivityCheckResponse>(response.data) || { hasUnread: false };
      setHasUnread(payload.hasUnread);
    } catch {
      // non-blocking
    }
  }, []);

  const loadRequestDetail = React.useCallback(async (apiKey: string) => {
    try {
      setLoading(true);
      const res = await apiRequest<RequestDetail>(API_ROUTES.requests.detail.replace('{apiKey}', apiKey));
      const payload = unwrapPayload<RequestDetail>(res.data);
      setDetail(payload || null);
      setInlineDescription((payload as RequestDetail | null)?.description || '');
      await apiRequest(API_ROUTES.requests.seen.replace('{requestApiKey}', apiKey), { method: 'POST' });
      const commentResponse = await apiRequest<CommentPagedResponse>(API_ROUTES.requests.comments.replace('{requestApiKey}', apiKey));
      const commentPayload = unwrapPayload<CommentPagedResponse>(commentResponse.data);
      setComments((commentPayload as CommentPagedResponse)?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const submitComment = async () => {
    if (!requestApiKey || !commentText.trim()) return;
    try {
      const body: CreateCommentRequest = { body: commentText.trim() };
      await apiRequest(API_ROUTES.requests.comments.replace('{requestApiKey}', requestApiKey), {
        method: 'POST',
        data: body,
      });
      setCommentText('');
      await loadRequestDetail(requestApiKey);
    } catch (err: any) {
      setCommentError(err?.response?.data?.message || err?.message || t('error.generic', 'Something went wrong'));
    }
  };

  const markComplete = async () => {
    if (!requestApiKey) return;
    try {
      await apiRequest(API_ROUTES.requests.complete.replace('{requestApiKey}', requestApiKey), { method: 'POST' });
      await loadRequestDetail(requestApiKey);
      await loadRequests();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    }
  };

  const saveRequestUpdate = async () => {
    if (!requestApiKey || !detail) return;
    try {
      const payload: UpdateRequestRequest = {
        description: inlineDescription || undefined,
      };
      await apiRequest(API_ROUTES.requests.detail.replace('{apiKey}', requestApiKey), {
        method: 'PUT',
        data: payload,
      });
      await loadRequestDetail(requestApiKey);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    }
  };

  const createRequest = async () => {
    try {
      const normalized: CreateRequestRequest = {
        ...newRequest,
        category: newRequest.category || 'Song',
      };
      await apiRequest(API_ROUTES.requests.list, { method: 'POST', data: normalized });
      setCreateOpen(false);
      setNewRequest({ category: '', description: '' });
      loadRequests();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.error', 'An error occurred'));
    }
  };

  React.useEffect(() => {
    loadActivity();
    loadRequests();
  }, [loadActivity, loadRequests]);

  React.useEffect(() => {
    if (requestApiKey) {
      loadRequestDetail(requestApiKey);
    }
  }, [requestApiKey, loadRequestDetail]);

  const detailMeta = detail ? [
    detail.status,
    detail.category,
    detail.artistName || t('requests.unknown', 'Unknown artist'),
    detail.createdAt,
  ].join(' / ') : '';

  if (requestDetailMode) {
    return (
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            component={Link}
            to="/requests"
          >
            {t('requests.backToList', 'Back to list')}
          </Button>
          <Button startIcon={<Refresh />} onClick={() => requestApiKey && loadRequestDetail(requestApiKey)}>
            {t('common.refresh', 'Refresh')}
          </Button>
          <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={markComplete}>
            {t('requests.markComplete', 'Mark complete')}
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />}

        {!loading && detail && (
          <>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 1 }}>{detail.description}</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>{detailMeta}</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>{t('requests.comments', 'Comments')}: {detail.commentCount}</Typography>
                <TextField
                  multiline
                  minRows={3}
                  maxRows={6}
                  fullWidth
                  label={t('requests.updateDescription', 'Update description')}
                  value={inlineDescription}
                  onChange={(event) => setInlineDescription(event.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button variant="outlined" onClick={saveRequestUpdate}>{t('requests.save', 'Save')}</Button>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>{t('requests.comments', 'Comments')}</Typography>
                {comments.length === 0 && (
                  <Typography color="text.secondary">{t('requests.noComments', 'No comments yet')}</Typography>
                )}
                <List>
                  {comments.map((comment, index) => (
                    <React.Fragment key={comment.apiKey}>
                      <ListItem
                        alignItems="flex-start"
                        secondaryAction={
                          <ChatBubble fontSize="small" color="action" />
                        }
                      >
                        <ListItemText
                          primary={comment.createdByUser?.userName || t('requests.anon', 'System')}
                          secondary={`${comment.body} · ${comment.createdAt}`}
                        />
                      </ListItem>
                      {index < comments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
                {commentError && <Alert severity="error" sx={{ mt: 2 }}>{commentError}</Alert>}
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  label={t('requests.newComment', 'New comment')}
                  sx={{ mt: 2 }}
                />
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  sx={{ mt: 2 }}
                  onClick={submitComment}
                  disabled={!commentText.trim()}
                >
                  {t('requests.postComment', 'Post comment')}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-end' }} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label={t('requests.query', 'Search')}
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              loadRequests();
            }
          }}
        />
        <TextField select value={status || ''} onChange={(event) => setStatus(event.target.value)} label={t('requests.status', 'Status')} sx={{ minWidth: 160 }}>
          <MenuItem value="">{t('requests.allStatuses', 'All')}</MenuItem>
          <MenuItem value="Open">Open</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
          <MenuItem value="Closed">Closed</MenuItem>
          <MenuItem value="InProgress">In Progress</MenuItem>
        </TextField>
        <TextField value={artistApiKey} onChange={(event) => setArtistApiKey(event.target.value)} label={t('requests.artistFilter', 'Artist API key')} />
        <TextField value={albumApiKey} onChange={(event) => setAlbumApiKey(event.target.value)} label={t('requests.albumFilter', 'Album API key')} />
        <TextField value={songApiKey} onChange={(event) => setSongApiKey(event.target.value)} label={t('requests.songFilter', 'Song API key')} />
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
        <Button variant={mineOnly ? 'contained' : 'outlined'} onClick={() => setMineOnly((value) => !value)}>
          {t('requests.mineOnly', 'Mine only')}
        </Button>
        <Button
          variant={showUnreadOnly ? 'contained' : 'outlined'}
          startIcon={<FilterList />}
          onClick={() => setShowUnreadOnly((value) => !value)}
        >
          {t('requests.showUnread', 'Unread activity')}
        </Button>
        <Chip
          label={t('requests.hasUnread', {
            defaultValue: 'Unread Activity',
            count: 0,
            hasUnread,
          })}
          color={hasUnread ? 'warning' : 'default'}
          sx={{ height: 36 }}
        />
        <Button variant="contained" onClick={loadRequests}>
          {t('common.refresh', 'Refresh')}
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => setCreateOpen((open) => !open)}>
          {createOpen ? t('requests.cancel', 'Cancel') : t('requests.create', 'Create request')}
        </Button>
        <Typography color="text.secondary">{t('requests.total', { count: meta.totalCount })}</Typography>
      </Stack>

      {createOpen && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{t('requests.createNew', 'Create request')}</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              select
              fullWidth
              value={newRequest.category || ''}
              onChange={(event) => setNewRequest((current) => ({ ...current, category: event.target.value }))}
              label={t('requests.category', 'Category')}
            >
              <MenuItem value="Song">Song</MenuItem>
              <MenuItem value="Album">Album</MenuItem>
              <MenuItem value="Artist">Artist</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            <TextField
              fullWidth
              value={newRequest.artistName || ''}
              onChange={(event) => setNewRequest((current) => ({ ...current, artistName: event.target.value || undefined }))}
              label={t('requests.artistName', 'Artist name')}
            />
          </Stack>
          <TextField
            fullWidth
            multiline
            value={newRequest.description}
            onChange={(event) => setNewRequest((current) => ({ ...current, description: event.target.value }))}
            label={t('requests.description', 'Description')}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              value={newRequest.externalUrl || ''}
              onChange={(event) => setNewRequest((current) => ({ ...current, externalUrl: event.target.value || undefined }))}
              label={t('requests.externalUrl', 'External URL')}
              fullWidth
            />
            <TextField
              value={newRequest.releaseYear || ''}
              onChange={(event) => setNewRequest((current) => ({ ...current, releaseYear: event.target.value ? Number(event.target.value) : undefined }))}
              label={t('requests.releaseYear', 'Release year')}
              type="number"
            />
          </Stack>
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={createRequest}
            disabled={!newRequest.description.trim()}
          >
            {t('requests.create', 'Create request')}
          </Button>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />}

      <Paper>
        <List>
          {!loading && list.length === 0 && (
            <ListItem>
              <ListItemText primary={t('requests.empty', 'No requests found')} />
            </ListItem>
          )}
          {list.map((item, index) => (
            <React.Fragment key={item.apiKey}>
              <ListItem
                disablePadding
              >
                <ListItemButton
                component={Link}
                to={`/requests/${item.apiKey}`}
                alignItems="flex-start"
              >
                <ListItemText
                  primary={`${item.artistName || t('requests.unknown', 'Unknown')} · ${item.category}`}
                  secondary={`${item.description} · ${item.createdAt} · ${t('requests.status', 'Status')}: ${item.status}`}
                  />
                <Chip
                  label={String(item.commentCount || 0)}
                  size="small"
                  color="secondary"
                  sx={{ mr: 1 }}
                />
                </ListItemButton>
              </ListItem>
              {index < list.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }} alignItems="center">
        <TextField
          label={t('common.page', 'Page')}
          type="number"
          value={page}
          onChange={(event) => setPage(Number(event.target.value) || 1)}
          sx={{ width: 120 }}
        />
        <TextField
          label={t('common.pageSize', 'Page size')}
          type="number"
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value) || 25)}
          sx={{ width: 120 }}
        />
        <Typography color="text.secondary">
          {t('common.pageXofY', 'Page {{current}} of {{total}}', {
            current: Math.max(meta.currentPage, 1),
            total: Math.max(meta.totalPages, 1),
          })}
        </Typography>
      </Stack>
    </Box>
  );
}
