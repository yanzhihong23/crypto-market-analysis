import { createTheme } from '@mui/material'

import { SANS_STACK } from './fonts'

declare module '@mui/material/styles' {
  // Tells the Theme type that CSS variables are on, which is what puts
  // `theme.vars` within reach of component style callbacks.
  interface CssThemeVariables {
    enabled: true
  }

  interface BreakpointOverrides {
    xs: true
    sm: true
    md: true
    lg: true
    xl: true
    xxl: true
    xxxl: true
  }

  interface Palette {
    market: MarketPalette
    surface: SurfacePalette
  }
  interface PaletteOptions {
    market?: MarketPalette
    surface?: SurfacePalette
  }
}

/**
 * Colour budget: red and green are reserved for price direction and nothing
 * else. Keeping every up/down tone in one entry is what lets the dark scheme
 * restate them in one place instead of chasing hexes through components.
 */
export interface MarketPalette {
  up: string
  down: string
  /** Card fill, strong enough to scan across the grid, weak enough to read on */
  upSurface: string
  downSurface: string
  upBorder: string
  downBorder: string
  /** Chart stroke and gradient, same hues as the price text */
  upChart: string
  downChart: string
}

/**
 * Neutrals by role rather than by lightness. `grey.100` would have to mean a
 * near-white in one scheme and a near-black in the other, which reads as a lie
 * everywhere it is used.
 */
export interface SurfacePalette {
  /** Low-contrast fill: metric chips, gauge tracks */
  subtle: string
  /** Hairline: card borders, dividers */
  border: string
  /** A mark that has to stay visible on `subtle` */
  marker: string
  /** Sits on top of `subtle` and must read as lifted off it, in both schemes */
  raised: string
  /** Card elevation on hover */
  shadow: string
  /** Lift on the selected segment of a toggle group */
  segmentShadow: string
}

const lightMarket: MarketPalette = {
  up: '#25a750',
  down: '#ca3f64',
  upSurface: 'rgba(37, 167, 80, 0.05)',
  downSurface: 'rgba(202, 63, 100, 0.05)',
  upBorder: 'rgba(37, 167, 80, 0.35)',
  downBorder: 'rgba(202, 63, 100, 0.35)',
  upChart: '#25a750',
  downChart: '#ca3f64',
}

// Lifted and slightly desaturated: the light-scheme greens and reds sit too
// close to the background to carry a 32px price on a dark surface.
const darkMarket: MarketPalette = {
  up: '#3ecf7f',
  down: '#f2547d',
  upSurface: 'rgba(62, 207, 127, 0.08)',
  downSurface: 'rgba(242, 84, 125, 0.08)',
  upBorder: 'rgba(62, 207, 127, 0.35)',
  downBorder: 'rgba(242, 84, 125, 0.35)',
  upChart: '#3ecf7f',
  downChart: '#f2547d',
}

const lightSurface: SurfacePalette = {
  subtle: '#EEF2F6',
  border: '#E3E8EF',
  marker: '#CDD5DF',
  raised: '#fff',
  shadow: '0 4px 12px -2px rgba(16, 24, 40, 0.10)',
  segmentShadow: '0 1px 2px rgba(16, 24, 40, 0.10)',
}

const darkSurface: SurfacePalette = {
  subtle: '#1E2635',
  border: '#28313F',
  marker: '#46536A',
  // Lighter than `subtle`, not darker: in a dark scheme, lifted means lighter,
  // so background.paper would have read as a dent rather than a raised chip.
  raised: '#2E3849',
  shadow: '0 4px 12px -2px rgba(0, 0, 0, 0.55)',
  segmentShadow: '0 1px 2px rgba(0, 0, 0, 0.45)',
}

const grey = {
  50: '#F8FAFC',
  100: '#EEF2F6',
  200: '#E3E8EF',
  300: '#CDD5DF',
  500: '#697586',
  600: '#4B5565',
  700: '#364152',
  900: '#121926',
}

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#444ce7',
          contrastText: '#fff',
        },
        secondary: {
          main: '#ff9800',
          contrastText: '#fff',
        },
        success: { main: '#25a750' },
        error: { main: '#ca3f64' },
        grey,
        background: {
          default: '#fff',
          paper: '#fff',
        },
        text: {
          primary: '#121926',
          secondary: '#4B5565',
        },
        divider: '#E3E8EF',
        market: lightMarket,
        surface: lightSurface,
      },
    },
    dark: {
      palette: {
        // Lifted off the dark background so it stays legible as a fill and as
        // text, which the light scheme's indigo does not.
        primary: {
          main: '#7B87F5',
          contrastText: '#0C111C',
        },
        secondary: {
          main: '#ffab40',
          contrastText: '#0C111C',
        },
        success: { main: '#3ecf7f' },
        error: { main: '#f2547d' },
        grey,
        // Off-black, not #000: pure black flattens the card edges away.
        background: {
          default: '#0C111C',
          paper: '#141B29',
        },
        text: {
          primary: '#E3E8EF',
          secondary: '#93A0B4',
        },
        divider: '#28313F',
        market: darkMarket,
        surface: darkSurface,
      },
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: SANS_STACK,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1168, // 1120 + 24*2(padding left and right)
      xl: 1440,
      xxl: 1920,
      xxxl: 2560,
    },
  },
  components: {
    MuiContainer: {},
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: 'transparent',
      },
      styleOverrides: {
        root: ({ theme }) => ({
          // The bar carries a logo, three links and a clock. It gets a neutral
          // surface so the only saturated colour on screen is price direction.
          backgroundColor: theme.vars.palette.background.paper,
          color: theme.vars.palette.text.primary,
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '84px',
        },
      },
    },
    // One track, one radius. Inheriting shape.borderRadius gave the end
    // segments a 16px half-pill and the middle ones square corners, so a
    // selected segment changed shape depending on where it sat in the group.
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.surface.subtle,
          borderRadius: 10,
          padding: 3,
          gap: 2,
        }),
        grouped: {
          border: 0,
          borderRadius: 7,
          marginLeft: 0,
        },
        firstButton: { borderRadius: 7 },
        middleButton: { borderRadius: 7 },
        lastButton: { borderRadius: 7 },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          fontWeight: 500,
          color: theme.vars.palette.text.secondary,
          '&:hover': {
            backgroundColor: 'transparent',
            color: theme.vars.palette.text.primary,
          },
          // Raised rather than filled: a saturated block for a sort setting
          // outshouted the prices it was there to order.
          '&.Mui-selected': {
            backgroundColor: theme.vars.palette.surface.raised,
            color: theme.vars.palette.text.primary,
            fontWeight: 600,
            boxShadow: theme.vars.palette.surface.segmentShadow,
            '&:hover': {
              backgroundColor: theme.vars.palette.surface.raised,
            },
          },
        }),
        sizeSmall: {
          fontSize: 13,
          height: 28,
          padding: '0 12px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
        indicator: {
          height: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '14px',
          fontWeight: 500,
          // MUI reserves 90px per tab and pads it 12x16, which spread three
          // short labels across a third of the bar.
          minWidth: 'auto',
          minHeight: 40,
          padding: '0 12px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          '&:hover': {
            background: '#6172F3',
          },
          '&:disabled': {
            color: '#fff',
            background: '#C7D7FE',
            cursor: 'not-allowed',
          },
        },
        outlinedPrimary: {
          color: '#364152',
          borderColor: '#CDD5DF',
        },
        sizeMedium: {
          height: '44px',
          borderRadius: '100px',
          textTransform: 'none',
          fontSize: '16px',
          fontWeight: 600,
        },
        sizeSmall: {
          height: '36px',
          borderRadius: '100px',
          textTransform: 'none',
          fontSize: '14px',
          fontWeight: 600,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          fontWeight: 700,
          cursor: 'pointer',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: theme.vars.palette.divider,
          margin: '32px 0',
        }),
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          variants: [
            {
              props: { variant: 'body1' },
              style: {
                fontSize: '14px',
              },
            },
          ],
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paperWidthXs: {
          maxWidth: '464px',
        },
        paperWidthMd: {
          maxWidth: '680px',
        },
        paper: {
          margin: '16px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        outlined: {
          width: '480px',
          marginBottom: '40px',
          marginRight: '40px',
          fontWeight: 600,
        },
        outlinedSuccess: {
          color: '#067647',
          background: '#F6FEF9',
          border: '1px solid #75E0A7',
        },
        outlinedError: {
          color: '#B42318',
          background: '#FFFBFA',
          border: '1px solid #FDA29B',
        },
      },
    },
    MuiAlertTitle: {
      styleOverrides: {
        root: {
          padding: '8px 0',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.vars.palette.surface.border}`,
          boxShadow: theme.vars.palette.surface.shadow,
        }),
      },
    },
    MuiCardMedia: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(2px)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: ({ theme }) => ({
          height: '8px',
          borderRadius: '4px',
          backgroundColor: theme.vars.palette.surface.subtle,
          '& .MuiLinearProgress-bar': {
            borderRadius: '4px',
          },
        }),
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          gap: '4px',
          '& .MuiBottomNavigationAction-label': {
            fontSize: '10px',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: '14px',
          fontWeight: 600,
          borderRadius: '12px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1px',
            borderColor: theme.vars.palette.divider,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1px',
            borderColor: theme.vars.palette.text.primary,
          },
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-selected': {
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: theme.vars.palette.surface.subtle,
            },
          },
          '&:hover': {
            backgroundColor: theme.vars.palette.surface.subtle,
          },
        }),
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: 'none',
          backgroundColor: 'transparent',
          '&.Mui-expanded': {
            margin: 0,
          },
          '&::before': {
            opacity: '1 !important',
            backgroundColor: theme.vars.palette.divider,
          },
        }),
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: 0,
          '& .MuiAccordionSummary-content': {
            margin: '24px 0',
            '&.Mui-expanded': {
              margin: '24px 0',
            },
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: 0,
          paddingBottom: '24px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        sizeSmall: {
          fontSize: 12,
          height: 22,
        },
      },
    },
  },
})

export default theme
