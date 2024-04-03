import fs from 'node:fs'
import { Browser, Page } from 'puppeteer'

export const validFullConfig = {
    "puppeteer": {
        "browserLanguage": "es-ES",
        "sandboxBrowser": true,
        "disableSetuidSandbox": true,
        "headless": true,
        "dumpio": true,
        "timeout": 30000
    },
    "webs":[{
        "activate": true,
        "url": "https://www.google.com/maps/place/SOME+COMPANY/@40.2234903,2.4440167,17z/data=lotsofgibberish",
        "provider": "google",
        "ignoreReviews": {
            "byAuthorName": ["John Doe", "Foo Bar"],
            "byMinimumRating": 4,
            "byMinimumCharactersCountInContent": 10
        },
        "known": {
          "review": {
              "authorName": "Lidia Gonzalez Pot",
              "content": "¡Buen trato, buena faena, buen resultado! Recomendable",
          },
          "rejectCookiesButtonText": "Rechazar todo",
          "viewMoreButtonText": "Más",
          "viewUntranslatedContentButtonText": "Ver original",
          "reviewsSectionButtonText": "Reseñas",
          "sortingButtonText": "Ordenar",
          "byNewestOptionButtonText": "Más recientes",
          "oldestReviewAuthorName": "Q- Beat"
        }
    }]
} 

export const getAbsoluteFilePath = (prefix: string, suffix: string) => 
    (relativeFilePath: string) => new URL(prefix + relativeFilePath + suffix, import.meta.url)

export const writeWebContentToFile = async (browser: Browser, url: string, absoluteFilePath: URL, doBeforeGetContent: (page: Page) => Promise<void> = async () => {}) => {
    if (!fs.existsSync(absoluteFilePath)) {
        const page = await browser.newPage()
        await page.goto(url)
        await doBeforeGetContent(page)
        const milisecondsOfNetworkIdle = 2000
        await page.waitForNetworkIdle({timeout: milisecondsOfNetworkIdle})
        const content = await page.content()
        fs.writeFileSync(absoluteFilePath, content)
        await page.close()
    }
}

