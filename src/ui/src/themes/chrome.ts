import { Theme } from '@mui/material/styles';

/**
 * Colours for the application chrome (top AppBar + navigation drawer).
 *
 * These deliberately use `background.default` and `primary` rather than
 * `background.paper`: most light themes share a white paper colour, so a
 * paper-coloured header/nav would look unchanged when the user switches
 * themes. `background.default` is tinted per theme, and the primary accent
 * gives each theme a distinct edge/active state.
 */
export interface ChromeColors {
  appBarBackground: string;
  appBarText: string;
  accent: string;
  drawerBackground: string;
  drawerText: string;
  divider: string;
  activeItemBackground: string;
  activeItemText: string;
}

export function chromeColors(theme: Theme): ChromeColors {
  return {
    appBarBackground: theme.palette.background.default,
    appBarText: theme.palette.text.primary,
    accent: theme.palette.primary.main,
    drawerBackground: theme.palette.background.default,
    drawerText: theme.palette.text.primary,
    divider: theme.palette.divider,
    activeItemBackground: theme.palette.primary.main,
    activeItemText: theme.palette.primary.contrastText,
  };
}

/** `sx` for the top AppBar; call with the active MUI theme. */
export function appBarSx(theme: Theme) {
  const colors = chromeColors(theme);
  return {
    backgroundColor: colors.appBarBackground,
    color: colors.appBarText,
    borderBottom: `3px solid ${colors.accent}`,
    boxShadow: theme.shadows[1],
  };
}

/** `sx` for the Drawer paper (applied to `.MuiDrawer-paper`). */
export function drawerPaperSx(theme: Theme) {
  const colors = chromeColors(theme);
  return {
    backgroundColor: colors.drawerBackground,
    color: colors.drawerText,
    borderRight: `2px solid ${colors.accent}`,
  };
}

/** `sx` for the currently-active navigation item. */
export function activeNavItemSx(theme: Theme) {
  const colors = chromeColors(theme);
  return {
    backgroundColor: colors.activeItemBackground,
    color: colors.activeItemText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '& .MuiListItemIcon-root': {
      color: colors.activeItemText,
    },
    '& .MuiListItemText-primary': {
      fontWeight: 600,
    },
    '&.Mui-selected': {
      backgroundColor: colors.activeItemBackground,
      color: colors.activeItemText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
  };
}
