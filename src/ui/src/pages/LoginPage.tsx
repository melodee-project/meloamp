import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Alert } from '@mui/material';
import { setJwt, setApiBaseUrl, authenticate } from '../api';
import { LoginRequest, LoginResponse } from '../apiModels';
import logo from '../logo.svg';
import { useTranslation } from 'react-i18next';

const MIN_SERVER_MAJOR = 1;
const MIN_SERVER_MINOR = 1;

const ensureApiUrl = (url: string) => {
  let u = url.trim();
  if (!u.endsWith('/api/v1')) {
    u = u.replace(/\/+$/, '') + '/api/v1';
  }
  return u;
};

async function checkServerVersion(apiUrl: string): Promise<{ supported: boolean; info?: any; error?: string }> {
  try {
    const res = await fetch(apiUrl + '/system/info');
    if (!res.ok) throw new Error('Failed to fetch server info');
    const info = await res.json();
    if (
      typeof info.majorVersion !== 'number' ||
      typeof info.minorVersion !== 'number'
    ) {
      return { supported: false, error: 'Invalid server info response' };
    }
    if (
      info.majorVersion < MIN_SERVER_MAJOR ||
      (info.majorVersion === MIN_SERVER_MAJOR && info.minorVersion < MIN_SERVER_MINOR)
    ) {
      return { supported: false, info, error: 'login.serverVersionTooOld' };
    }
    return { supported: true, info };
  } catch (e: any) {
    return { supported: false, error: e.message };
  }
}

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverCheck, setServerCheck] = useState<{ checked: boolean; supported: boolean; error?: string }>({ checked: false, supported: true });
  const { t } = useTranslation();

  useEffect(() => {
    const savedUrl = localStorage.getItem('serverUrl') || '';
    setServerUrl(savedUrl);
  }, []);

  useEffect(() => {
    if (!serverUrl) return;
    const apiUrl = ensureApiUrl(serverUrl);
    checkServerVersion(apiUrl).then(result => {
      setServerCheck({ checked: true, supported: result.supported, error: result.error });
    });
  }, [serverUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const apiUrl = ensureApiUrl(serverUrl);
      // Check server version before login
      const versionCheck = await checkServerVersion(apiUrl);
      if (!versionCheck.supported) {
        setError(versionCheck.error || 'Server version not supported');
        setLoading(false);
        return;
      }
      localStorage.setItem('serverUrl', apiUrl);
      setApiBaseUrl(apiUrl);
      const res = await authenticate({ email, password } as LoginRequest);
      const loginData: LoginResponse = res.data;
      const token = loginData.token;
      if (!token) throw new Error('Invalid response from authentication');
      setJwt(token);
      // Save user object and serverVersion in localStorage
      sessionStorage.setItem('user', JSON.stringify(loginData.user));
      if (loginData.serverVersion !== undefined && loginData.serverVersion !== null) {
        localStorage.setItem('apiVersion', loginData.serverVersion.toString());
      } else {
        localStorage.removeItem('apiVersion');
      }
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto' }}>
      <img src={logo} alt="MeloAmp Logo" style={{ height: 400 }} />
      <form onSubmit={handleSubmit}>
        <TextField
          label={t('login.serverUrl') !== 'login.serverUrl' ? t('login.serverUrl') : 'Server URL'}
          type="url"
          value={serverUrl}
          onChange={e => setServerUrl(e.target.value)}
          fullWidth
          margin="normal"
          required
          helperText={t('login.serverUrlHelper') !== 'login.serverUrlHelper' ? t('login.serverUrlHelper') : 'Enter the URL of your MeloAmp server'}
          error={serverCheck.checked && !serverCheck.supported}
        />
        {serverCheck.checked && !serverCheck.supported && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {serverCheck.error && serverCheck.error.startsWith('login.')
              ? t(serverCheck.error) !== serverCheck.error ? t(serverCheck.error) : 'Server version too old'
              : serverCheck.error || t('login.unsupportedServer') || 'Unsupported server version'}
          </Alert>
        )}
        <TextField
          label={t('login.email') || 'Email'}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label={t('login.password') || 'Password'}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={loading}>
          {loading ? (t('login.loggingIn') || 'Logging in...') : (t('login.login') || 'Login')}
        </Button>
      </form>
    </Box>
  );
}
