import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Alert } from '@mui/material';
import api, { setJwt, setApiBaseUrl, authenticate } from './api';
import { LoginRequest, LoginResponse } from './apiModels';
import logo from './logo.svg';

const ensureApiUrl = (url: string) => {
  let u = url.trim();
  if (!u.endsWith('/api/v1')) {
    u = u.replace(/\/+$/, '') + '/api/v1';
  }
  return u;
};

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('serverUrl') || '';
    setServerUrl(savedUrl);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const apiUrl = ensureApiUrl(serverUrl);
      localStorage.setItem('serverUrl', apiUrl);
      setApiBaseUrl(apiUrl);
      const res = await authenticate({ email, password } as LoginRequest);
      const loginData: LoginResponse = res.data;
      const token = loginData.token;
      if (!token) throw new Error('Invalid response from authentication');
      setJwt(token);
      // Save user object and serverVersion in sessionStorage
      sessionStorage.setItem('user', JSON.stringify(loginData.user));
      if (loginData.serverVersion !== undefined && loginData.serverVersion !== null) {
        sessionStorage.setItem('apiVersion', loginData.serverVersion.toString());
      } else {
        sessionStorage.removeItem('apiVersion');
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
          label="Server URL"
          type="url"
          value={serverUrl}
          onChange={e => setServerUrl(e.target.value)}
          fullWidth
          margin="normal"
          required
          helperText="Your Melodee API (e.g. https://myhost.com or https://myhost.com/api/v1)"
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </Box>
  );
}
