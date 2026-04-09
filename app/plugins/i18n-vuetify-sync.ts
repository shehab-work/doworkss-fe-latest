export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('i18n:localeSwitched', ({ newLocale }) => {
    const vuetify = useNuxtApp().$vuetify
    if (!vuetify) return

    const localeConfig = nuxtApp.$i18n.locales.value.find(
      (l: { code: string }) => l.code === newLocale,
    )
    const isRtl = localeConfig?.dir === 'rtl'

    vuetify.locale.current.value = newLocale
    vuetify.rtl.value = isRtl
  })
})
