import type { ReactNode } from 'react'
import {
  Box,
  Container,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material'

type KioskLayoutProps = {
  heading: string
  subheading?: string
  steps: string[]
  stepIndex: number
  children: ReactNode
  footer?: ReactNode
  aside?: ReactNode
}

export function KioskLayout({
  heading,
  steps,
  stepIndex,
  children,
  footer,
}: KioskLayoutProps) {
  return (
    <Box
      component="main"
      sx={{
        height: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'stretch',
        py: { xs: 2, md: 4 },
        overflow: 'hidden',
        ...(!heading && {
          py: 0,
          alignItems: 'center',
        }),
      }}
    >
      <Container
        maxWidth="lg"
        disableGutters
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 3, md: 4 },
          px: { xs: 2.5, md: 0 },
          flex: 1,
          ...(!heading && {
            gap: 0,
            justifyContent: 'center',
          }),
        }}
      >
        {heading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              sx={{
                color: 'primary.main',
                textAlign: 'center',
                fontWeight: 700,
              }}
            >
              {heading}
            </Typography>
          </Box>
        ) : null}

        <Paper
          elevation={6}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...(!heading && {
              justifyContent: 'center',
            }),
          }}
        >
          <Stack
            spacing={{ xs: 2.5, md: 3 }}
            sx={{
              flex: 1,
              overflow: 'hidden',
              px: { xs: 2.5, md: 4 },
              py: { xs: 3, md: 4 },
              ...(!heading && {
                justifyContent: 'center',
                px: 0,
                py: 0,
              }),
            }}
          >
            {steps.length > 0 ? (
              <>
                <Stepper
                  activeStep={stepIndex}
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                  }}
                >
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
                <Typography
                  variant="subtitle1"
                  textAlign="center"
                  sx={{ display: { xs: 'block', sm: 'none' } }}
                >
                  Passo {Math.min(stepIndex + 1, steps.length)}/{steps.length}
                </Typography>
              </>
            ) : null}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                pr: { xs: 0.5, sm: 0 },
                ...(!heading && {
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'visible',
                }),
              }}
            >
              {children}
            </Box>
          </Stack>
        </Paper>

        {footer ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {footer}
          </Box>
        ) : null}
      </Container>
    </Box>
  )
}

