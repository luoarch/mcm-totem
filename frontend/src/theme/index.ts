import { createTheme, responsiveFontSizes } from '@mui/material/styles'

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1A73E8',
      dark: '#0F4FAB',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#12B76A',
      dark: '#047857',
      contrastText: '#022C22',
    },
    background: {
      default: '#EAF1FF',
      paper: 'rgba(255, 255, 255, 0.2)',
    },
    text: {
      primary: '#0B1D34',
      secondary: 'rgba(11, 29, 52, 0.72)',
    },
    error: {
      main: '#F04438',
    },
    warning: {
      main: '#F79009',
    },
    success: {
      main: '#17B26A',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Helvetica Neue',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.75rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontSize: '2.125rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1.25rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '1.0625rem',
      lineHeight: 1.6,
      color: 'rgba(11, 29, 52, 0.72)',
    },
    button: {
      fontSize: '1.3125rem',
      fontWeight: 700,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 10,
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': {
          height: '100%',
        },
        body: {
          background:
            'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.35) 100%)',
          color: '#0B1D34',
          overscrollBehavior: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 64,
          paddingInline: 28,
          borderRadius: 10,
        },
        sizeLarge: {
          minHeight: 70,
          fontSize: '1.275rem',
        },
        containedPrimary: {
          boxShadow: '0 12px 28px rgba(26, 115, 232, 0.28)',
        },
        outlined: {
          borderWidth: 1.4,
          borderColor: 'rgba(255, 255, 255, 0.35)',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          padding: 32,
          background: 'rgba(255, 255, 255, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.28)',
          boxShadow: '0 20px 40px rgba(15, 79, 171, 0.12)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          '@media (min-width:900px)': {
            padding: 48,
          },
        },
      },
    },
    MuiStepper: {
      defaultProps: {
        alternativeLabel: true,
      },
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderTopWidth: 3,
          borderRadius: 999,
          borderColor: 'rgba(26, 115, 232, 0.25)',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.7rem',
          fontWeight: 600,
          marginTop: 4,
          color: 'rgba(11, 29, 52, 0.52)',
          '&.Mui-active': {
            color: '#0B1D34',
          },
          '&.Mui-completed': {
            color: '#0B1D34',
          },
        },
        labelContainer: {
          paddingBottom: 8,
        },
        iconContainer: {
          padding: 0,
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          width: 18,
          height: 18,
          color: 'rgba(26, 115, 232, 0.18)',
          '&.Mui-active': {
            color: '#1A73E8',
            filter: 'drop-shadow(0 4px 12px rgba(26, 115, 232, 0.35))',
          },
          '&.Mui-completed': {
            color: 'rgba(26, 115, 232, 0.5)',
          },
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'md',
      },
    },
  },
})

export const appTheme = responsiveFontSizes(baseTheme, {
  factor: 2.6,
})

export type AppTheme = typeof appTheme

