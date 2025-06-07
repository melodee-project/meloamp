import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Typography, Box, Switch, FormControlLabel, Slider } from '@mui/material';

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
  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>User Settings</Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Theme</InputLabel>
        <Select
          value={settings.theme}
          label="Theme"
          onChange={e => onChange({ ...settings, theme: e.target.value })}
        >
          {sortedThemes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Language</InputLabel>
        <Select
          value={settings.language}
          label="Language"
          onChange={e => onChange({ ...settings, language: e.target.value })}
        >
          <MenuItem value="en">English</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Recent Items on Dashboard</InputLabel>
        <Select
          value={settings.dashboardRecentLimit || 10}
          label="Recent Items on Dashboard"
          onChange={e => onChange({ ...settings, dashboardRecentLimit: Number(e.target.value) })}
        >
          {[5, 10, 15, 20, 25].map(val => <MenuItem key={val} value={val}>{val}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControlLabel
        control={<Switch checked={settings.highContrast} onChange={e => onChange({ ...settings, highContrast: e.target.checked })} />}
        label="High Contrast Mode"
      />
      <Box sx={{ mt: 2 }}>
        <Typography gutterBottom>Font Scale</Typography>
        <Slider
          value={settings.fontScale}
          min={0.8}
          max={1.5}
          step={0.05}
          onChange={(_, v) => onChange({ ...settings, fontScale: v as number })}
          valueLabelDisplay="auto"
        />
      </Box>
      <FormControlLabel
        control={<Switch checked={settings.caching} onChange={e => onChange({ ...settings, caching: e.target.checked })} />}
        label="Enable Caching"
      />
    </Box>
  );
}
