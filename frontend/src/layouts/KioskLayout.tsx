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
  subheading,
  steps,
  stepIndex,
  children,
  footer,
  aside,
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
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 2, md: 3 }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          <Box sx={{ flexShrink: 0 }}>
            <Typography variant="h2" component="h1" gutterBottom>
              {heading}
            </Typography>
            {subheading ? (
              <Typography variant="body1" sx={{ maxWidth: 560 }}>
                {subheading}
              </Typography>
            ) : null}
          </Box>
          {aside}
        </Stack>

        <Paper
          elevation={6}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Stack
            spacing={{ xs: 2.5, md: 3 }}
            sx={{ flex: 1, overflow: 'hidden', px: { xs: 2.5, md: 4 }, py: { xs: 3, md: 4 } }}
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
            <Box sx={{ flex: 1, overflow: 'auto', pr: { xs: 0.5, sm: 0 } }}>{children}</Box>
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

