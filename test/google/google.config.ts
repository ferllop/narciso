import { GoogleSpecificConfig } from '../../src/config/config.js';
import { TestRawConfig } from '../helpers.js';

export type GoogleTestConfig = TestRawConfig<GoogleSpecificConfig>
const config: GoogleTestConfig = {
    puppeteer: {
        browserLanguage: 'es-ES',
        sandboxBrowser: true,
        disableSetuidSandbox: true,
        headless: true,
        dumpio: true,
        getContentTimeout: 30000
    },
    web:{
        timeout: 2000,
        url: 'https://www.google.com/maps/place/DJ+MARIAN/@41.2791903,1.9760167,17z/data=!4m6!3m5!1s0x12a482b981b3f765:0x7ca8c3c9b3eadc99!8m2!3d41.2791903!4d1.9760167!16s%2Fg%2F11c61mwhrb?entry=ttu',
            ignoreReviews: {
            byAuthorName: [],
            byMinimumRating: 4,
            byMinimumCharactersCountInContent: 10,
        },
        known: {
            review: {
                authorName: 'Lidia Gonzalez Pot',
                content: '¡Buen trato, buena faena, buen resultado! Recomendable',
            },
            texts : {
                rejectCookiesButtonText: 'Rechazar todo',
                viewMoreButtonText: 'Más',
                viewUntranslatedContentButtonText: 'Ver original',
                reviewsSectionButtonText: 'Reseñas',
                sortingButtonText: 'Ordenar',
                byNewestOptionButtonText: 'Más recientes',
                stars: 'estrellas',
            },
            reviewPositionFromOldestBeingZero: {
                knownReview: 2,
                withMoreButton: 8,
                withViewUntransalatedButton: 4,
            },
            oldestReviewAuthorName: 'Q- Beat',
        }
    }
} 

export default config
