import { describe, it, before, beforeEach, after, afterEach} from 'node:test'
import assert from 'node:assert'
import puppeteer, { ElementHandle } from 'puppeteer'
import { configParser } from '../src/config-parser.js'
import { findRejectCookiesButton, getClassOfElementWithText, getContent, getName, getRating, getReviews, google, loadAllReviews } from '../src/google.js'
import { getAbsoluteFilePath, writeWebContentToFile } from './helpers.js'

const browserLanguage = 'es-ES'
const config = configParser({
    "puppeteer": {
        "browserLanguage": browserLanguage,
        "sandboxBrowser": true,
        "disableSetuidSandbox": true,
        "headless": false,
        "dumpio": true
    },
    "webs":[{
        "activate": true,
        "url": "https://www.google.com/maps/place/DJ+MARIAN/@41.2791903,1.9760167,17z/data=!4m6!3m5!1s0x12a482b981b3f765:0x7ca8c3c9b3eadc99!8m2!3d41.2791903!4d1.9760167!16s%2Fg%2F11c61mwhrb?entry=ttu",
        "provider": "google",
        "ignore_reviews": {
            "by_name": ["John Doe", "Foo Bar"],
            "by_minimum_rating": 4,
            "by_minimum_characters_count_in_content": 10
        }
    }]
})


const getAbsoluteFilePathWithLanguageSuffix = getAbsoluteFilePath('', `-${browserLanguage}.html`)

describe('given google scraper', async () => {
    const browser = await puppeteer.launch(config.puppeteer)
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
                const reject = await findRejectCookiesButton(page, 'Rechazar', 500)
                await reject.click()
                await loadAllReviews(page, '.jftiEf') })
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
        const rejectCookiesButton = await findRejectCookiesButton(page, 'Rechazar', 500)
        assert(rejectCookiesButton instanceof ElementHandle, 'an element handle must be found')
        assert(rejectCookiesButton.click, 'the handle must be clickable')
    })

})

