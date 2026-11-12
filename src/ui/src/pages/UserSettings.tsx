import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Typography, Box, Switch, FormControlLabel, Slider, Button, TextField, Divider, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MediaKeyConfig } from '../types/global.d';
import { UserSettings as UserSettingsType, DEFAULT_SETTINGS } from '../types/settings';
import { THEME_CATALOG } from '../themes/registry';
import { SUPPORTED_LANGUAGES } from '../i18n';

interface UserSettingsProps {
  settings: UserSettingsType;
  onChange: (settings: UserSettingsType) => void;
}

const sortedThemes = THEME_CATALOG
  .map(({ id }) => ({ label: id, value: id }))
  .sort((a, b) => a.label.localeCompare(b.label));

// Default media key shortcuts
const defaultMediaKeys: MediaKeyConfig = {
  playPause: 'MediaPlayPause',
  next: 'MediaNextTrack',
  previous: 'MediaPreviousTrack',
  stop: 'MediaStop'
};

export default function UserSettings({ settings, onChange }: UserSettingsProps) {
  const { t, i18n } = useTranslation();
  const [mediaKeys, setMediaKeys] = useState<MediaKeyConfig>(defaultMediaKeys);
  const [mediaKeysLoading, setMediaKeysLoading] = useState(false);
  const isElectron = !!window.meloampAPI;

  // Load media key configuration on mount
  useEffect(() => {
    if (window.meloampAPI?.getMediaKeys) {
      window.meloampAPI.getMediaKeys().then(config => {
        setMediaKeys(config);
      }).catch(err => {
        console.error('Failed to load media key config:', err);
      });
    }
  }, []);

  const handleMediaKeyChange = (key: keyof MediaKeyConfig, value: string) => {
    const updated = { ...mediaKeys, [key]: value };
    setMediaKeys(updated);
  };

  const handleSaveMediaKeys = () => {
    if (window.meloampAPI?.updateMediaKeys) {
      setMediaKeysLoading(true);
      window.meloampAPI.updateMediaKeys(mediaKeys);
      setTimeout(() => setMediaKeysLoading(false), 500);
    }
  };

  const handleRestoreDefaultMediaKeys = () => {
    setMediaKeys(defaultMediaKeys);
    if (window.meloampAPI?.updateMediaKeys) {
      window.meloampAPI.updateMediaKeys(defaultMediaKeys);
    }
  };

  const handleRestoreDefaults = () => {
    document.documentElement.style.setProperty('--meloamp-font-scale', String(DEFAULT_SETTINGS.fontScale));
    i18n.changeLanguage(DEFAULT_SETTINGS.language);
    onChange({ ...DEFAULT_SETTINGS });
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>{t('settings.title')}</Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('settings.theme')}</InputLabel>
        <Select
          value={settings.theme}
          label={t('settings.theme')}
          onChange={e => onChange({ ...settings, theme: e.target.value })}
        >
          {sortedThemes.map(tObj => (
            <MenuItem key={tObj.value} value={tObj.value}>
              {t(`localThemeGallery.themes.${tObj.value}.name`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('settings.language')}</InputLabel>
        <Select
          value={settings.language}
          label={t('settings.language')}
          onChange={e => {
            const lang = e.target.value;
            i18n.changeLanguage(lang); // Immediately apply language
            onChange({ ...settings, language: lang });
          }}
        >
          {SUPPORTED_LANGUAGES.map(({ code, label }) => (
            <MenuItem key={code} value={code}>{label}</MenuItem>
          ))}        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('settings.recentItems')}</InputLabel>
        <Select
          value={settings.dashboardRecentLimit || 10}
          label={t('settings.recentItems')}
          onChange={e => onChange({ ...settings, dashboardRecentLimit: Number(e.target.value) })}
        >
          {[5, 10, 15, 20, 25].map(val => <MenuItem key={val} value={val}>{val}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControlLabel
        control={<Switch checked={settings.highContrast} onChange={e => onChange({ ...settings, highContrast: e.target.checked })} />}
        label={t('settings.highContrast')}
      />
      <Box sx={{ mt: 2 }}>
        <Typography gutterBottom>{t('settings.fontScale')}</Typography>
        <Slider
          value={settings.fontScale}
          min={0.5}
          max={1.75}
          step={0.05}
          onChange={(_, v) => {
            const scale = v as number;
            document.documentElement.style.setProperty('--meloamp-font-scale', String(scale));
            onChange({ ...settings, fontScale: scale });
          }}
          valueLabelDisplay="auto"
        />
      </Box>

      {/* Media Keys Settings (Electron only) */}
      {isElectron && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            {t('settings.mediaKeys', 'Media Keys')}
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('settings.mediaKeysInfo', 'Configure global keyboard shortcuts for playback control. Use Electron accelerator format (e.g., MediaPlayPause, CommandOrControl+Shift+P).')}
          </Alert>
          <TextField
            fullWidth
            label={t('settings.playPauseKey', 'Play/Pause')}
            value={mediaKeys.playPause || ''}
            onChange={e => handleMediaKeyChange('playPause', e.target.value)}
            sx={{ mb: 2 }}
            size="small"
          />
          <TextField
            fullWidth
            label={t('settings.nextKey', 'Next Track')}
            value={mediaKeys.next || ''}
            onChange={e => handleMediaKeyChange('next', e.target.value)}
            sx={{ mb: 2 }}
            size="small"
          />
          <TextField
            fullWidth
            label={t('settings.previousKey', 'Previous Track')}
            value={mediaKeys.previous || ''}
            onChange={e => handleMediaKeyChange('previous', e.target.value)}
            sx={{ mb: 2 }}
            size="small"
          />
          <TextField
            fullWidth
            label={t('settings.stopKey', 'Stop')}
            value={mediaKeys.stop || ''}
            onChange={e => handleMediaKeyChange('stop', e.target.value)}
            sx={{ mb: 2 }}
            size="small"
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              onClick={handleSaveMediaKeys}
              disabled={mediaKeysLoading}
            >
              {t('settings.saveMediaKeys', 'Apply Shortcuts')}
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleRestoreDefaultMediaKeys}
            >
              {t('settings.resetMediaKeys', 'Reset to Default')}
            </Button>
          </Box>
        </>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="secondary" onClick={handleRestoreDefaults}>
          {t('settings.restoreDefaults', 'Restore Defaults')}
        </Button>
      </Box>
    </Box>
  );
}
