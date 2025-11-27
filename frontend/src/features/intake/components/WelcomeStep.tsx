import { Box, Button, Stack, Typography } from '@mui/material'

type WelcomeStepProps = {
  onStart: () => void
}

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onStart()
    }
  }

  return (
    <Box
      onClick={onStart}
      onTouchStart={onStart}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label="Toque para iniciar o atendimento"
      sx={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(26,115,232,0.03) 0%, rgba(15,79,171,0.05) 100%)',
          animation: 'pulse 3s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': {
              opacity: 0.5,
            },
            '50%': {
              opacity: 0.8,
            },
          },
        },
      }}
    >
      <Stack
        spacing={{ xs: 3, md: 4 }}
        alignItems="center"
        sx={{ width: '100%', position: 'relative', zIndex: 1 }}
      >
        <Stack spacing={1.5} alignItems="center">
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #1A73E8 0%, #0F4FAB 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'fadeIn 1s ease-in',
              '@keyframes fadeIn': {
                from: {
                  opacity: 0,
                  transform: 'translateY(-10px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            Bem-vindo ao Autoatendimento
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              textAlign: 'center',
              maxWidth: 480,
              animation: 'fadeIn 1s ease-in 0.2s both',
            }}
          >
            Toque em qualquer lugar da tela para iniciar
          </Typography>
        </Stack>

        <Button
          variant="contained"
          size="large"
          onClick={(e) => {
            e.stopPropagation()
            onStart()
          }}
          sx={{
            px: 6,
            py: 1.8,
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '1.1rem',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 10px 18px rgba(26,115,232,0.18)',
            animation: 'fadeIn 1s ease-in 0.4s both, float 3s ease-in-out infinite 1.4s',
            '@keyframes float': {
              '0%, 100%': {
                transform: 'translateY(0)',
              },
              '50%': {
                transform: 'translateY(-8px)',
              },
            },
            '&:hover': {
              transform: 'translateY(-2px) scale(1.02)',
              boxShadow: '0 12px 20px rgba(15,79,171,0.22)',
            },
          }}
        >
          Iniciar atendimento
        </Button>
      </Stack>
    </Box>
  )
}

