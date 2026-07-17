import tailwindcss from '@tailwindcss/vite'

const sentryEnabled = Boolean(
  process.env.SENTRY_DSN ?? process.env.NUXT_PUBLIC_SENTRY_DSN,
)
const sentrySourceMapsEnabled =
  sentryEnabled && Boolean(process.env.SENTRY_AUTH_TOKEN)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-13',

  devtools: {
    enabled: true,
  },

  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@sentry/nuxt/module',
  ],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    defaultLocale: 'es-MX',
    locales: [
      {
        code: 'es-MX',
        file: 'es-MX.json',
        language: 'es-MX',
        name: 'Español',
      },
    ],
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  nitro: {
    preset: 'node-server',
  },

  sentry: {
    enabled: sentryEnabled,
    autoInjectServerSentry: 'top-level-import',
    sourceMapsUploadOptions: {
      enabled: sentrySourceMapsEnabled,
      telemetry: false,
    },
  },

  sourcemap: sentrySourceMapsEnabled
    ? {
        client: 'hidden',
        server: 'hidden',
      }
    : false,

  runtimeConfig: {
    appEnv: '',
    appVersion: '',

    public: {
      appUrl: '',
      mediaUrl: '',
      environment: '',
      sentryDsn: '',
    },
  },
})
