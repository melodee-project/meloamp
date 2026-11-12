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
import { THEME_CATALOG, ThemeValue } from '../themes/registry';

interface ThemeEntry {
  id: string;
  category: 'classic' | 'dark' | 'colorful' | 'wild';
  getTheme: ThemeValue;
}

const themeEntries: ThemeEntry[] = THEME_CATALOG.map(({ id, category, value }) => ({
  id,
  category,
  getTheme: value,
}));

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
    borderRadius: theme.shape?.borderRadius ?? 4,
    mode: p.mode || 'light',
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ThemeCardProps {
  entry: ThemeEntry;
  isActive: boolean;
  currentMode: 'light' | 'dark';
  onApply: (id: string) => void;
}

function ThemeCard({ entry, isActive, currentMode, onApply }: ThemeCardProps) {
  const { t } = useTranslation();
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
            {t(`localThemeGallery.themes.${entry.id}.name`)}
          </Typography>
          <Typography variant="caption" color={hexToRgba(textColor, 0.6)} sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 32,
            mt: 0.5,
          }}>
            {t(`localThemeGallery.themes.${entry.id}.description`)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              icon={colors.mode === 'light' ? <WbSunny sx={{ fontSize: 14 }} /> : <NightsStay sx={{ fontSize: 14 }} />}
              label={colors.mode === 'light' ? t('settings.light', 'Light') : t('settings.dark', 'Dark')}
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
                label={t('localThemeGallery.bold', 'Bold')}
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
    { id: 'classic' as const, icon: '◉' },
    { id: 'dark' as const, icon: '◉' },
    { id: 'colorful' as const, icon: '◉' },
    { id: 'wild' as const, icon: '◉' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        {t('settings.theme', 'Themes')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
        {t(
          'localThemeGallery.intro',
          'Choose from hand-crafted themes — from clean classics to bold, wild designs. Themes are stored locally and do not depend on the server.'
        )}
      </Typography>

      {categories.map((cat) => {
        const items = themeEntries.filter((e) => e.category === cat.id);
        if (items.length === 0) return null;
        return (
          <Box key={cat.id} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {t(`localThemeGallery.categories.${cat.id}`, `${cat.id.charAt(0).toUpperCase()}${cat.id.slice(1)}`)}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {t('localThemeGallery.themeCount', '({{count}} themes)', { count: items.length })}
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
