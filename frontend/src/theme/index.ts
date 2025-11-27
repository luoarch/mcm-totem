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
      secondary: 'rgba(11, 29, 52, 0.75)',
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
      color: 'rgba(11, 29, 52, 0.75)',
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
          color: 'rgba(255, 255, 255, 0.9)',
        },
        sizeLarge: {
          minHeight: 70,
          fontSize: '1.275rem',
        },
        contained: {
          backgroundColor: '#1A73E8',
          color: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 8px 16px rgba(26, 115, 232, 0.25)',
          '&:hover': {
            backgroundColor: '#0F4FAB',
            boxShadow: '0 12px 24px rgba(26, 115, 232, 0.3)',
          },
        },
        containedPrimary: {
          backgroundColor: '#1A73E8',
          color: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 8px 16px rgba(26, 115, 232, 0.25)',
          '&:hover': {
            backgroundColor: '#0F4FAB',
            boxShadow: '0 12px 24px rgba(26, 115, 232, 0.3)',
          },
        },
        outlined: {
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          color: 'text.primary',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderColor: 'rgba(255, 255, 255, 0.4)',
          },
        },
        text: {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          color: 'text.primary',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          padding: 32,
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
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
          color: 'rgba(11, 29, 52, 0.6)',
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
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.4)',
              },
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              '& fieldset': {
                borderColor: 'rgba(26, 115, 232, 0.6)',
                borderWidth: '2px',
              },
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(11, 29, 52, 0.85)',
            '&.Mui-focused': {
              color: '#1A73E8',
            },
          },
          '& .MuiFormHelperText-root': {
            color: 'rgba(11, 29, 52, 0.7)',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(26, 115, 232, 0.6)',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(26, 115, 232, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(26, 115, 232, 0.2)',
            },
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'text.primary',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderColor: 'rgba(255, 255, 255, 0.4)',
          },
          '&.Mui-selected': {
            backgroundColor: '#1A73E8',
            color: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#1A73E8',
            boxShadow: '0 8px 20px rgba(26,115,232,0.3)',
            '&:hover': {
              backgroundColor: '#0F4FAB',
              borderColor: '#0F4FAB',
            },
          },
        },
      },
    },
  },
})

export const appTheme = responsiveFontSizes(baseTheme, {
  factor: 2.6,
})

export type AppTheme = typeof appTheme

