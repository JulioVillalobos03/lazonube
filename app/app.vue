<template>
  <main class="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
    <NuxtRouteAnnouncer />
    <section class="mx-auto max-w-3xl">
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-sky-400">
        {{ $t('foundation.productName') }}
      </p>
      <h1 class="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
        {{ $t('foundation.title') }}
      </h1>
      <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
        {{ $t('foundation.description') }}
      </p>
    </section>
  </main>
</template>
