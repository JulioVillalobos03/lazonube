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
    '@nuxtjs/tailwindcss',
    '@sentry/nuxt/module',
  ],

  i18n: {
    defaultLocale: 'es',
    locales: [{ code: 'es', language: 'es-MX', name: 'Español' }],
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  nitro: {
    preset: 'node-server',
  },

  runtimeConfig: {
    appEnv: '',
    appVersion: '',

    public: {
      appUrl: '',
      mediaUrl: '',
      environment: '',
    },
  },
})
