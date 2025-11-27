import { Button, Stack } from '@mui/material'

type StepNavigationProps = {
  canGoBack: boolean
  isLastStep: boolean
  onBack: () => void
  onNext: () => void
  isSubmitting?: boolean
  nextLabel?: string
  nextDisabled?: boolean
}

export function StepNavigation({
  canGoBack,
  isLastStep,
  onBack,
  onNext,
  isSubmitting = false,
  nextLabel,
  nextDisabled = false,
}: StepNavigationProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      justifyContent="flex-end"
      sx={{ width: '100%' }}
    >
      <Button
        variant="outlined"
        size="large"
        onClick={onBack}
        disabled={!canGoBack || isSubmitting}
        sx={{
          minWidth: 200,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'text.primary',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
          '&:disabled': {
            borderColor: 'rgba(255, 255, 255, 0.15)',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: 'rgba(11, 29, 52, 0.4)',
          },
        }}
      >
        Voltar
      </Button>
      <Button
        variant="contained"
        size="large"
        onClick={onNext}
        disabled={isSubmitting || nextDisabled}
        sx={{
          minWidth: 240,
          backgroundColor: '#1A73E8',
          color: 'rgba(255, 255, 255, 0.95)',
          '&:hover': {
            backgroundColor: '#0F4FAB',
          },
          '&:disabled': {
            backgroundColor: 'rgba(26, 115, 232, 0.4)',
            color: 'rgba(255, 255, 255, 0.6)',
          },
        }}
      >
        {isLastStep ? nextLabel ?? 'Concluir atendimento' : nextLabel ?? 'Avançar'}
      </Button>
    </Stack>
  )
}

