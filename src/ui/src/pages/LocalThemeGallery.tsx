import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Grid,
  Tooltip,
} from '@mui/material';
import { Check, WbSunny, NightsStay, Palette } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { UserSettings } from '../types/settings';
import classicTheme from '../themes/classicTheme';
import oceanTheme from '../themes/oceanTheme';
import sunsetTheme from '../themes/sunsetTheme';
import forestTheme from '../themes/forestTheme';
import darkTheme from '../themes/darkTheme';
import modernMinimalTheme from '../themes/modernMinimalTheme';
import rainbowTheme from '../themes/rainbowTheme';
import candyTheme from '../themes/candyTheme';
import bubblegumTheme from '../themes/bubblegumTheme';
import { getAuroraTheme } from '../themes/auroraTheme';
import { getMonoContrastTheme } from '../themes/monoContrastTheme';
import { getBerryTwilightTheme } from '../themes/berryTwilightTheme';
import retroWaveTheme from '../themes/retroWaveTheme';
import spaceFunkTheme from '../themes/spaceFunkTheme';
import acidPopTheme from '../themes/acidPopTheme';
import fiestaTheme from '../themes/fiestaTheme';
import scarlettTheme from '../themes/scarlettTheme';
import winAmpTheme from '../themes/winAmpTheme';
import { Theme } from '@mui/material/styles';

interface ThemeEntry {
  id: string;
  name: string;
  description: string;
  category: 'classic' | 'dark' | 'colorful' | 'wild';
  getTheme: ((mode: 'light' | 'dark') => Theme) | Theme;
}

const themeEntries: ThemeEntry[] = [
  { id: 'classic', name: 'Classic', description: 'Clean, familiar Material Design with blue primary and orange accents', category: 'classic', getTheme: classicTheme },
  { id: 'ocean', name: 'Ocean', description: 'Cool blues and teals inspired by the sea', category: 'classic', getTheme: oceanTheme },
  { id: 'sunset', name: 'Sunset', description: 'Warm orange and gold tones like a setting sun', category: 'classic', getTheme: sunsetTheme },
  { id: 'forest', name: 'Forest', description: 'Earthy greens for a natural, calming feel', category: 'classic', getTheme: forestTheme },
  { id: 'dark', name: 'Dark', description: 'Elegant dark theme with blue and pink accents', category: 'dark', getTheme: darkTheme },
  { id: 'modernMinimal', name: 'Modern Minimal', description: 'Black and white ultra-minimalist design with sharp edges', category: 'dark', getTheme: modernMinimalTheme },
  { id: 'monoContrast', name: 'Mono Contrast', description: 'High-contrast monochrome with monospace typography', category: 'dark', getTheme: (mode) => getMonoContrastTheme(mode) },
  { id: 'winAmp', name: 'WinAmp', description: 'Retro WinAmp-inspired neon green with dark grey background', category: 'dark', getTheme: winAmpTheme },
  { id: 'retroWave', name: 'Retro Wave', description: 'Synthwave neon pink and cyan on deep purple', category: 'colorful', getTheme: retroWaveTheme },
  { id: 'spaceFunk', name: 'Space Funk', description: 'Electric purple and magenta with rounded corners, dark cosmic', category: 'colorful', getTheme: spaceFunkTheme },
  { id: 'aurora', name: 'Aurora', description: 'Teal and amber aurora borealis inspired, adapts to light/dark', category: 'colorful', getTheme: (mode) => getAuroraTheme(mode) },
  { id: 'berryTwilight', name: 'Berry Twilight', description: 'Rich berry and lavender hues, adapts to light/dark', category: 'colorful', getTheme: (mode) => getBerryTwilightTheme(mode) },
  { id: 'rainbow', name: 'Rainbow', description: 'Bold rainbow palette with hot pink primary and comic sans', category: 'wild', getTheme: rainbowTheme },
  { id: 'candy', name: 'Candy', description: 'Sweet candy pink and turquoise with playful rounded corners', category: 'wild', getTheme: candyTheme },
  { id: 'bubblegum', name: 'Bubblegum', description: 'Soft pastel pinks and peaches with extra-round corners', category: 'wild', getTheme: bubblegumTheme },
  { id: 'acidPop', name: 'Acid Pop', description: 'Neon acid green and vivid red — loud and proud', category: 'wild', getTheme: acidPopTheme },
  { id: 'fiesta', name: 'Fiesta', description: 'Vibrant orange and pink party palette, bold and celebratory', category: 'wild', getTheme: fiestaTheme },
  { id: 'scarlett', name: 'Scarlett', description: 'Deep indigo with hot pink, firebrick red, and gold accents', category: 'wild', getTheme: scarlettTheme },
];

function extractColors(entry: ThemeEntry, currentMode: 'light' | 'dark') {
  const theme = typeof entry.getTheme === 'function'
    ? entry.getTheme(currentMode)
    : entry.getTheme;
  const p = theme.palette;
  return {
    primary: p.primary?.main || '#1976d2',
    secondary: p.secondary?.main || '#ff9800',
    background: p.background?.default || '#f5f5f5',
    paper: p.background?.paper || '#ffffff',
    text: p.text?.primary || '#000000',
    borderRadius: (theme.shape as any)?.borderRadius || 4,
    mode: p.mode || 'light',
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ThemeCardProps {
  entry: ThemeEntry;
  isActive: boolean;
  currentMode: 'light' | 'dark';
  onApply: (id: string) => void;
}

function ThemeCard({ entry, isActive, currentMode, onApply }: ThemeCardProps) {
  const colors = extractColors(entry, currentMode);
  const isLight = colors.mode === 'light';
  const textColor = isLight ? '#333' : '#eee';
  const labelBg = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)';

  return (
    <Card
      sx={{
        position: 'relative',
        border: isActive ? 2 : 1,
        borderColor: isActive ? 'primary.main' : 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
        overflow: 'visible',
      }}
    >
      {isActive && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            boxShadow: 2,
          }}
        >
          <Check fontSize="small" />
        </Box>
      )}

      {/* Color preview strip */}
      <Box
        sx={{
          height: 100,
          bgcolor: colors.background,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 1.5,
          pb: 2,
          borderTopLeftRadius: (theme) => theme.shape.borderRadius,
          borderTopRightRadius: (theme) => theme.shape.borderRadius,
        }}
      >
        <Tooltip title={`Primary: ${colors.primary}`}>
          <Box sx={{ width: 40, height: 40, bgcolor: colors.primary, borderRadius: `${colors.borderRadius}px`, boxShadow: 1 }} />
        </Tooltip>
        <Tooltip title={`Secondary: ${colors.secondary}`}>
          <Box sx={{ width: 40, height: 40, bgcolor: colors.secondary, borderRadius: `${colors.borderRadius}px`, boxShadow: 1 }} />
        </Tooltip>
        <Tooltip title={`Background: ${colors.background}`}>
          <Box sx={{ width: 40, height: 40, bgcolor: colors.paper, borderRadius: `${colors.borderRadius}px`, boxShadow: 1, border: '1px solid rgba(0,0,0,0.1)' }} />
        </Tooltip>
        <Tooltip title={`Text: ${colors.text}`}>
          <Box sx={{ width: 40, height: 40, bgcolor: colors.text, borderRadius: `${colors.borderRadius}px`, boxShadow: 1 }} />
        </Tooltip>
      </Box>

      <CardActionArea onClick={() => onApply(entry.id)}>
        <CardContent sx={{ bgcolor: colors.paper, color: textColor }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            {entry.name}
          </Typography>
          <Typography variant="caption" color={hexToRgba(textColor, 0.6)} sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 32,
            mt: 0.5,
          }}>
            {entry.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              icon={colors.mode === 'light' ? <WbSunny sx={{ fontSize: 14 }} /> : <NightsStay sx={{ fontSize: 14 }} />}
              label={colors.mode === 'light' ? 'Light' : 'Dark'}
              sx={{ bgcolor: labelBg, height: 22, '& .MuiChip-icon': { ml: 0.5 }, fontSize: 11 }}
            />
            <Chip
              size="small"
              label={`r: ${colors.borderRadius}px`}
              sx={{ bgcolor: labelBg, height: 22, fontSize: 11 }}
            />
            {entry.category === 'wild' && (
              <Chip
                size="small"
                icon={<Palette sx={{ fontSize: 14 }} />}
                label="Bold"
                sx={{ bgcolor: labelBg, height: 22, '& .MuiChip-icon': { ml: 0.5 }, fontSize: 11 }}
              />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

interface Props {
  settings: UserSettings;
  onChange: (settings: UserSettings) => void;
}

export default function LocalThemeGallery({ settings, onChange }: Props) {
  const { t } = useTranslation();

  const categories = [
    { id: 'classic' as const, label: 'Classic', icon: '◉' },
    { id: 'dark' as const, label: 'Dark', icon: '◉' },
    { id: 'colorful' as const, label: 'Colorful', icon: '◉' },
    { id: 'wild' as const, label: 'Wild', icon: '◉' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        {t('settings.theme', 'Themes')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
        Choose from 18 hand-crafted themes — from clean classics to bold, wild designs.
        Themes are stored locally and don't depend on the server.
      </Typography>

      {categories.map((cat) => {
        const items = themeEntries.filter((e) => e.category === cat.id);
        if (items.length === 0) return null;
        return (
          <Box key={cat.id} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {cat.label}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({items.length} themes)
              </Typography>
            </Typography>
            <Grid container spacing={2}>
              {items.map((entry) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={entry.id}>
                  <ThemeCard
                    entry={entry}
                    isActive={settings.theme === entry.id}
                    currentMode={settings.mode || 'light'}
                    onApply={(id) => onChange({ ...settings, theme: id })}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}
    </Box>
  );
}
