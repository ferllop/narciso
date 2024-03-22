import { describe, it, before, beforeEach, after, afterEach} from 'node:test'
import assert from 'node:assert'
import { ElementHandle, Page } from 'puppeteer'
import { configParser } from '../src/config-parser.js'
import { 
    getReviewElements, 
    isValidReview, 
    loadAllReviews, 
    rejectCookies, 
    scrapeReviews, 
} from '../src/google.js'
import { getAbsoluteFilePath, writeWebContentToFile } from './helpers.js'
import { Bot } from '../src/bot.js'

const browserLanguage = 'es-ES'
const config = configParser({
    "puppeteer": {
        "browserLanguage": browserLanguage,
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
        "ignore_reviews": {
            "by_name": ["John Doe", "Foo Bar"],
            "by_minimum_rating": 4,
            "by_minimum_characters_count_in_content": 10
        },
    }]
})

const knownReview = {
    name: 'Lidia Gonzalez Pot',
    content: '¡Buen trato, buena faena, buen resultado! Recomendable',
}

const getAbsoluteFilePathWithLanguageSuffix = getAbsoluteFilePath('', `-${browserLanguage}.html`)
const doNothing = () => {}
const testBot = Bot({logStart: doNothing, logFinish: doNothing, logError: doNothing}, config)

describe('given google scraper', async () => {
    const browser = await testBot.launchBrowser()
    before(async () => {
        await writeWebContentToFile(
            browser,
            config.webs[0].url,
            getAbsoluteFilePathWithLanguageSuffix('google-cookies-consent'))

        await writeWebContentToFile(
            browser,
            config.webs[0].url,
            getAbsoluteFilePathWithLanguageSuffix('google-url'),
            async page => {
                await rejectCookies(testBot, page, 'Rechazar todo')
                await loadAllReviews(testBot,page)
                await testBot.scrollDownUntilTextIsLoaded('', page, 'Q- Beat') })
    })

    let page: Page
    beforeEach(async () => {
        page = await browser.newPage()
        await page.setRequestInterception(true)
        page.on('request', request => {
            if (request.isInterceptResolutionHandled()) {
                return
            }

            if (page.url() === request.url() || page.url() === 'about:blank') {
                request.continue()
                return
            }

            request.respond({
                status: 200,
                contentType: 'text/plain',
                body: 'Simulate something was found!',
            })
        })
    })
    afterEach(async () => await page.close())
    after(async () => browser.close())

    it('when it arrives to google cookies consent page \
        then it knows how to find the button to reject the cookies', async () => {
        const cookiesHtml = getAbsoluteFilePathWithLanguageSuffix('google-cookies-consent').toString()
        await page.goto(cookiesHtml)
        const rejectCookiesButton = await rejectCookies(testBot, page, 'Rechazar')
        assert(rejectCookiesButton instanceof ElementHandle, 'an element handle must be found')
        assert(rejectCookiesButton.click, 'the handle must be clickable')
    })

    it('when it scrapes a review \
        then it knows how to find the button to view the entire content', async () => {
        await page.goto(getAbsoluteFilePathWithLanguageSuffix('google-url').toString())
        const reviewSelector = await testBot.getFirstClassOfElementWithSelector('', page, `[aria-label="${knownReview.name}"]`)
        const reviews = await getReviewElements(testBot, page, reviewSelector)
        const moreButton = await testBot.clickOrFailOnTagContainingText('', reviews[0], '', 'Más')
        assert(moreButton instanceof ElementHandle, 'an element handle must be found')
        assert(moreButton.click, 'the handle must be clickable')
    })

    it('when it scrapes a review \
        then it knows how to find the button to view the untranslated content', async () => {
        await page.goto(getAbsoluteFilePathWithLanguageSuffix('google-url').toString())
        const reviewSelector = await testBot.getFirstClassOfElementWithSelector('', page, `[aria-label="${knownReview.name}"]`)
        const reviews = await getReviewElements(testBot, page, reviewSelector)
        const seeOriginalButton = await testBot.clickOrFailOnTagContainingText('', reviews[5], '', 'Ver original')
        assert(seeOriginalButton instanceof ElementHandle, 'an element handle must be found')
        assert(seeOriginalButton.click, 'the handle must be clickable')
    })

    it('when it scrapes a reviews page it scrapes the first and the last reviews', async () => {
        await page.goto(getAbsoluteFilePathWithLanguageSuffix('google-url').toString())
        const reviewSelector = await testBot.getFirstClassOfElementWithSelector('', page, `[aria-label="${knownReview.name}"]`)
        const selectors = {
            name: await testBot.getFirstClassOfElementWithText('', page, 'Lidia Gonzalez Pot'),
            content: await testBot.getFirstClassOfElementWithText('', page, '¡Buen trato, buena faena, buen resultado! Recomendable'),
        }
        const promises = await testBot.findAllAndExecute('', page, reviewSelector, scrapeReviews(testBot, selectors, 'Más', 'Ver original'))
        const reviews = await Promise.all(promises)
        const result = reviews.filter(isValidReview(config.webs[0].ignoreReviews))
        assert(result.some(({name}) => name === 'Q- Beat'))
        assert(result.some(({name}) => name === 'Lorena Antúnez'))
    })
})

