import { describe, it, before, beforeEach, after, afterEach} from 'node:test'
import assert from 'node:assert'
import { ElementHandle } from 'puppeteer'
import { configParser } from '../src/config-parser.js'
import { 
    getReviewElements, 
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
        "timeout": 500
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
        "knownReview": {
            name: 'Lidia Gonzalez Pot',
            content: '¡Buen trato, buena faena, buen resultado! Recomendable',
        }
    }]
})

const knownReview = config.webs[0].knownReview

const getAbsoluteFilePathWithLanguageSuffix = getAbsoluteFilePath('', `-${browserLanguage}.html`)
const doNothing = () => {}
const testBot = Bot(config, {logStart: doNothing, logFinish: doNothing, logError: doNothing})

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
                const reject = await rejectCookies(testBot, page, 'Rechazar todo')
                await reject.click()
                await testBot.scrollDownUntilTextIsLoaded('', page, 'Q- Beat') })
    })

    let page
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
    afterEach(async () => page = await page.close())
    after(async () => browser.close())

    it('when it arrives to google cookies consent page \
        then it knows how to find the button to reject the cookies', async () => {
        const cookiesHtml = getAbsoluteFilePathWithLanguageSuffix('google-cookies-consent')
        await page.goto(cookiesHtml)
        const rejectCookiesButton = await rejectCookies(testBot, page, 'Rechazar')
        assert(rejectCookiesButton instanceof ElementHandle, 'an element handle must be found')
        assert(rejectCookiesButton.click, 'the handle must be clickable')
    })

    it.skip('when it scrapes a review \
        then it knows how to find the button to view the entire content', async () => {
        await page.goto(getAbsoluteFilePathWithLanguageSuffix('google-url'))
        const reviewSelector = await testBot.getFirstClassOfElementWithSelector(`[aria-label="${knownReview.name}"]`, page)
        const reviews = await getReviewElements(testBot, page, reviewSelector)
        const moreButton = await viewEntireContent(testBot, reviews[0], 'Más')
        assert(moreButton instanceof ElementHandle, 'an element handle must be found')
        assert(moreButton.click, 'the handle must be clickable')
    })

    it.skip('when it scrapes a review \
        then it knows how to find the button to view the untranslated content', async () => {
        await page.goto(getAbsoluteFilePathWithLanguageSuffix('google-url'))
        const reviewSelector = await testBot.getFirstClassOfElementWithSelector(`[aria-label="${knownReview.name}"]`, page)
        const reviews = await getReviewElements(testBot, page, reviewSelector)
        const seeOriginalButton = await viewUntranslatedContent(testBot, reviews[5], 'Ver original')
        assert(seeOriginalButton instanceof ElementHandle, 'an element handle must be found')
        assert(seeOriginalButton.click, 'the handle must be clickable')
    })

    it('when it scrapes a reviews page it scrapes the first and the last reviews', async () => {
        await page.goto(getAbsoluteFilePathWithLanguageSuffix('google-url'))
        const reviewSelector = await testBot.getFirstClassOfElementWithSelector(`[aria-label="${knownReview.name}"]`, page)
        // const reviews = await getReviewElements(testBot, page, reviewSelector)
        const selectors = {
            name: await testBot.getFirstClassOfElementWithText('Lidia Gonzalez Pot', page),
            content: await testBot.getFirstClassOfElementWithText('¡Buen trato, buena faena, buen resultado! Recomendable', page),
        }
        const reviewsResult = await testBot.findAllAndExecute('', page, reviewSelector, scrapeReviews(testBot, selectors, 'Más', 'Ver original'))
        assert(reviewsResult.some(({name}) => name === 'Q- Beat'))
        assert(reviewsResult.some(({name}) => name === 'Lorena Antúnez'))
    })
})

