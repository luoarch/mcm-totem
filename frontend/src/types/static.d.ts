declare module '*.mp3' {
  const src: string
  export default src
}

declare module 'virtual:pwa-register/react' {
  type NeedRefreshHandler = readonly [boolean, (value: boolean) => void]
  type OfflineReadyHandler = readonly [boolean, (value: boolean) => void]

  export function useRegisterSW(options?: {
    immediate?: boolean
    onRegisteredSW?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: unknown) => void
  }): {
    needRefresh: NeedRefreshHandler
    offlineReady: OfflineReadyHandler
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}

