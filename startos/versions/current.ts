import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.34.1:0',
  releaseNotes: {
    en_US:
      'Update to Karakeep 0.34.1. Everyone is signed out once because of the new sign-in system; sign in again. Crawling now uses Google Chrome and gets blocked less.',
    es_ES:
      'Actualización a Karakeep 0.34.1. Todos los usuarios cierran sesión una vez por el nuevo sistema de inicio de sesión; vuelva a iniciar sesión. El rastreo ahora usa Google Chrome y se bloquea menos.',
    de_DE:
      'Update auf Karakeep 0.34.1. Alle werden einmalig abgemeldet, da das Anmeldesystem erneuert wurde; bitte erneut anmelden. Das Crawling nutzt jetzt Google Chrome und wird seltener blockiert.',
    pl_PL:
      'Aktualizacja do Karakeep 0.34.1. Wszyscy zostaną jednorazowo wylogowani z powodu nowego systemu logowania; zaloguj się ponownie. Indeksowanie używa teraz Google Chrome i jest rzadziej blokowane.',
    fr_FR:
      'Mise à jour vers Karakeep 0.34.1. Tout le monde est déconnecté une fois en raison du nouveau système de connexion ; reconnectez-vous. L’exploration utilise désormais Google Chrome et est moins souvent bloquée.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
