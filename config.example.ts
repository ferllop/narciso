import type { RawConfig } from './src/config/config.d.ts'

const rawConfig: RawConfig = {
  puppeteer: {
    browserLanguage: 'es-ES',
    sandboxBrowser: true,
    disableSetuidSandbox: true,
    headless: false,
    dumpio: true,
    timeout: 30000,
  },
  webs: [
    {
      activate: true,
      url : 'https://www.google.com/search?q=some+search+with+opinions#lrd=0x12a482b981b3f765:0x7ca8c3c9b3eadc99,1,,,',
      provider: 'google',
      ignoreReviews: {
        byAuthorName: ['John Doe', 'Foo Bar'],
        byMinimumRating: 4,
        byMinimumCharactersCountInContent: 10,
      },
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
        },
        oldestReviewAuthorName: 'Mr. T',
      }
    },
  ]
}

export default rawConfig
