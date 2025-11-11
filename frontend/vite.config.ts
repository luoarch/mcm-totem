import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isProduction = process.env.NODE_ENV === 'production'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Totem de Autoatendimento',
        short_name: 'Totem',
        description:
          'Autoatendimento hospitalar com fluxo guiado para triagem rápida e segura.',
        theme_color: '#1A73E8',
        background_color: '#F4F6FB',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: isProduction
        ? {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
            navigateFallback: '/index.html',
          }
        : undefined,
      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
})
