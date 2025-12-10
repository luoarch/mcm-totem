import { Button } from '@mui/material'
import type { ButtonProps } from '@mui/material'

type SelectableButtonProps = ButtonProps & {
  isSelected?: boolean
}

export function SelectableButton({
  isSelected = false,
  children,
  sx,
  ...props
}: SelectableButtonProps) {
  return (
    <Button
      variant={isSelected ? 'contained' : 'outlined'}
      {...props}
      sx={{
        flex: 1,
        px: 3,
        py: 1.6,
        borderRadius: 10,
        fontWeight: 700,
        transition: 'all 0.2s ease',
        ...(isSelected
          ? {
              backgroundColor: '#1A73E8',
              color: 'rgba(255, 255, 255, 0.95)',
              borderColor: 'rgba(26, 115, 232, 0.6)',
              borderWidth: 2,
              boxShadow: '0 8px 20px rgba(26,115,232,0.3)',
              '&:hover': {
                backgroundColor: '#0F4FAB',
                borderColor: '#0F4FAB',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 24px rgba(26,115,232,0.35)',
              },
            }
          : {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: 'text.primary',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderWidth: 1,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.4)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              },
            }),
        ...sx,
      }}
    >
      {children}
    </Button>
  )
}

