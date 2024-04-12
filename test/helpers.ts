import fs from 'node:fs'
import puppeteer, { Page } from 'puppeteer'
import { PuppeteerConfig } from '../src/config-parser.js'

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
        "url": "https://www.google.com/maps/place/DJ+MARIAN/@41.2791903,1.9760167,17z/data=!4m6!3m5!1s0x12a482b981b3f765:0x7ca8c3c9b3eadc99!8m2!3d41.2791903!4d1.9760167!16s%2Fg%2F11c61mwhrb?entry=ttu",
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

export const writeWebContentToFile = async (puppeteerConfig: PuppeteerConfig, url: string, absoluteFilePath: URL, doBeforeGetContent: (page: Page) => Promise<void> = async () => {}) => {
    if (!fs.existsSync(absoluteFilePath)) {
        const browser = await puppeteer.launch(puppeteerConfig)
        const page = await browser.newPage()
        await page.goto(url)
        await doBeforeGetContent(page)
        const miliseconds = 2000
        await page.waitForNetworkIdle({timeout: miliseconds})
        const content = await page.content()
        fs.writeFileSync(absoluteFilePath, content)
        await page.close()
        await browser.close()
    }
}

