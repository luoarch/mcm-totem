import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { logError } from '../utils/logger'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError('Erro capturado pelo boundary', error, {
      componentStack: errorInfo.componentStack,
    })
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    const { hasError } = this.state
    const { children } = this.props

    if (!hasError) {
      return children
    }

    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Paper elevation={6} sx={{ maxWidth: 640, width: '100%' }}>
          <Stack spacing={3} alignItems="center">
            <Typography variant="h3" component="h1" textAlign="center">
              Algo saiu errado
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              Recarregue o totem para tentar novamente. Se o erro persistir, chame um atendente.
            </Typography>
            <Button variant="contained" size="large" onClick={this.handleReload}>
              Recarregar
            </Button>
          </Stack>
        </Paper>
      </Box>
    )
  }
}

