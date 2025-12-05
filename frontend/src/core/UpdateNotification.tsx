import { useEffect, useState } from 'react'
import { Alert, Button, Snackbar } from '@mui/material'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { logError } from '../utils/logger'

export function UpdateNotification() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (needRefresh || offlineReady) {
      setOpen(true)
    }
  }, [needRefresh, offlineReady])

  const handleClose = () => {
    setOpen(false)
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  const handleUpdate = () => {
    updateServiceWorker(true).catch((error: unknown) => {
      logError('Falha ao atualizar service worker', error)
    })
    handleClose()
  }

  const message = needRefresh
    ? 'Nova versão disponível. Atualize para continuar com a versão mais recente.'
    : 'Aplicativo pronto para uso offline.'

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      autoHideDuration={needRefresh ? null : 6000}
    >
      <Alert
        severity={needRefresh ? 'info' : 'success'}
        variant="filled"
        action={
          needRefresh ? (
            <Button color="inherit" size="small" onClick={handleUpdate}>
              Atualizar
            </Button>
          ) : (
            <Button color="inherit" size="small" onClick={handleClose}>
              Ok
            </Button>
          )
        }
        onClose={handleClose}
        sx={{ alignItems: 'center' }}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}

