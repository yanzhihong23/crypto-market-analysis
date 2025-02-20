import { createTheme } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#444ce7',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ff9800',
      contrastText: '#fff',
    },
    success: {
      main: '#25a750',
    },
    error: {
      main: '#ca3f64',
    },
    grey: {
      200: '#E3E8EF',
      300: '#CDD5DF',
      500: '#697586',
      600: '#4B5565',
      700: '#364152',
      900: '#121926',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'DM Sans 24pt',
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1168, // 1120 + 24*2(padding left and right)
      xl: 1344,
    },
  },
  components: {
    MuiContainer: {},
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '84px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '16px',
          fontWeight: 500,
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
        root: {
          background: '#CDD5DF',
          margin: '32px 0',
        },
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
        root: {
          border: '1px solid #EEF2F6',
          boxShadow:
            '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03);',
        },
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
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: '8px',
          borderRadius: '4px',
          backgroundColor: '#E3E8EF',
          '& .MuiLinearProgress-bar': {
            borderRadius: '4px',
          },
        },
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
        root: {
          fontSize: '14px',
          fontWeight: 600,
          borderRadius: '12px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1px',
            borderColor: '#CDD5DF',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1px',
            borderColor: '#121926',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: '#F8FAFC',
            },
          },
          '&:hover': {
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backgroundColor: 'transparent',
          '&.Mui-expanded': {
            margin: 0,
          },
          '&::before': {
            opacity: '1 !important',
            backgroundColor: '#CDD5DF',
          },
        },
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
  },
})

export default theme
