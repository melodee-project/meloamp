import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Typography, Box, Switch, FormControlLabel, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';

const themes = [
  { label: 'Acid Pop', value: 'acidPop' },
  { label: 'Aurora', value: 'aurora' },
  { label: 'Berry Twilight', value: 'berryTwilight' },
  { label: 'Bubblegum', value: 'bubblegum' },
  { label: 'Candy', value: 'candy' },
  { label: 'Classic', value: 'classic' },
  { label: 'Dark', value: 'dark' },
  { label: 'Fiesta', value: 'fiesta' },
  { label: 'Forest', value: 'forest' },
  { label: 'Modern Minimal', value: 'modernMinimal' },
  { label: 'Mono Contrast', value: 'monoContrast' },
  { label: 'Ocean', value: 'ocean' },
  { label: 'Rainbow', value: 'rainbow' },
  { label: 'Retro Wave', value: 'retroWave' },
  { label: 'Scarlett', value: 'scarlett' },
  { label: 'Space Funk', value: 'spaceFunk' },
  { label: 'Sunset', value: 'sunset' }
];

const sortedThemes = themes.slice().sort((a, b) => a.label.localeCompare(b.label));

export default function UserSettings({ settings, onChange }: any) {
  const { t, i18n } = useTranslation();

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
          {sortedThemes.map(tObj => <MenuItem key={tObj.value} value={tObj.value}>{tObj.label}</MenuItem>)}
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
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="es">Español</MenuItem>
          <MenuItem value="fr">Français</MenuItem>
          <MenuItem value="de">Deutsch</MenuItem>
          <MenuItem value="pt">Português</MenuItem>
          <MenuItem value="it">Italiano</MenuItem>
          <MenuItem value="ja">日本語</MenuItem>
          <MenuItem value="zh-CN">简体中文</MenuItem>
          <MenuItem value="ru">Русский</MenuItem>
        </Select>
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
          min={0.8}
          max={1.5}
          step={0.05}
          onChange={(_, v) => onChange({ ...settings, fontScale: v as number })}
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );
}
