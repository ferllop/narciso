import type { RawConfig } from './src/config/config.d.ts'

const rawConfig: RawConfig = {
  puppeteer: {
    browserLanguage: 'es-ES',
    sandboxBrowser: true,
    disableSetuidSandbox: true,
    headless: false,
    dumpio: true,
  },
  webs: [
    {
      title: "Foo en google",
      activate: true,
      timeout: 30000,
      url: 'https://www.google.com/maps/place/MY+compsny/@33.333,1.555, 15a/data=l0ts0f6u1ber15h?hl=en',
      provider: 'google',
      ignoreReviews: {
        byAuthorName: ['John Doe', 'Foo Bar'],
        byMinimumRating: 4,
        byMinimumCharactersCountInContent: 10,
      },
      specific: {
        translatedContent: true,
        known: {
          review: {
            authorName: 'Jane Foo',
            content: 'The experience was amazing',
          },
          texts: {
            rejectCookiesButtonText: 'Rechazar todo',
            viewMoreButtonText: 'Más',
            viewUntranslatedContentButtonText: 'Ver original',
            reviewsSectionButtonText: 'Reseñas',
            sortingButtonText: 'Ordenar',
            byNewestOptionButtonText: 'Más recientes',
            stars: 'estrellas',
          },
          reviewPositionFromOldestBeingZero: {
            knownReview: 3,
            withMoreButton: 8,
            withViewUntransalatedButton: 4,
          },
          oldestReviewAuthorName: 'Mr. T',
        }
      }
    },
  ]
}

export default rawConfig
