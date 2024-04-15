import { describe, it, before, beforeEach, after, afterEach} from 'node:test'
import assert from 'node:assert'
import { ElementHandle, Page, launch } from 'puppeteer'
import { configParser } from '../src/config-parser.js'
import { getAbsoluteFilePath, validFullConfig, writeWebContentToFile } from './helpers.js'
import { consoleLogger, createLog, noLogLogger, onlyOnErrorLogger } from '../src/logger.js'
import { getSelectors, loadAllReviews, rejectCookies, scrapeReview } from '../src/google.js'
import { clickOrFailOnTagContainingText, findAll, findAllAndExecute, getFirstClassOfElementWithSelector } from '../src/puppeteer-actions.js'
import { createReviewValidator } from '../src/review.js'

const browserLanguage = 'es-ES'
const validConfig = validFullConfig
validConfig.puppeteer.browserLanguage = browserLanguage
validConfig.webs[0].known.review.authorName = 'Lidia Gonzalez Pot'
const config = configParser(validConfig)

const {
    rejectCookiesButtonText, 
    viewMoreButtonText, 
    viewUntranslatedContentButtonText, 
    review: knownReview,
} = config.webs[0].known
const getAbsoluteFilePathWithLanguageSuffix = getAbsoluteFilePath('', `-${browserLanguage}.html`)
const log = createLog(noLogLogger)
const onLoopLog = createLog(noLogLogger)

describe('given google scraper', async () => {
    before(async () => {
        await writeWebContentToFile(
            config.puppeteer,
            config.webs[0].url,
            getAbsoluteFilePathWithLanguageSuffix('google-cookies-consent'))

        await writeWebContentToFile(
            config.puppeteer,
            config.webs[0].url,
            getAbsoluteFilePathWithLanguageSuffix('google-url'),
            async page => {
                await rejectCookies(log, config.puppeteer.timeout)(rejectCookiesButtonText, page)
                await loadAllReviews(log, config.puppeteer.timeout)(page, config.webs[0].known)
            })
    })

    const browser = await launch(config.puppeteer)
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
        const rejectCookiesButton = await rejectCookies(log, config.puppeteer.timeout)(rejectCookiesButtonText, page)
        assert(rejectCookiesButton instanceof ElementHandle, 'an element handle must be found')
        assert(rejectCookiesButton.click, 'the handle must be clickable')
    })

    it('when it scrapes a review \
        then it knows how to find the button to view the entire content', async () => {
        await page.goto(getAbsoluteFilePathWithLanguageSuffix('google-url').toString())
        const reviewSelector = await getFirstClassOfElementWithSelector(log)('', `[aria-label="${knownReview.authorName}"]`, page)
        const reviews = await findAll(log)('', reviewSelector, page)
        const moreButton = await clickOrFailOnTagContainingText(log, config.puppeteer.timeout)('', '', viewMoreButtonText, reviews[0])
        assert(moreButton instanceof ElementHandle, 'an element handle must be found')
        assert(moreButton.click, 'the handle must be clickable')
    })

    it('when it scrapes a review \
        then it knows how to find the button to view the untranslated content', async () => {
        await page.goto(getAbsoluteFilePathWithLanguageSuffix('google-url').toString())
        const reviewSelector = await getFirstClassOfElementWithSelector(log)('', `[aria-label="${knownReview.authorName}"]`, page)
        const reviews = await findAll(log)('', reviewSelector, page)
        const seeOriginalButton = await clickOrFailOnTagContainingText(log, config.puppeteer.timeout)('', '', viewUntranslatedContentButtonText, reviews[5])
        assert(seeOriginalButton instanceof ElementHandle, 'an element handle must be found')
        assert(seeOriginalButton.click, 'the handle must be clickable')
    })

    it('when it scrapes a reviews page it scrapes the first and the last reviews', async () => {
        await page.goto(getAbsoluteFilePathWithLanguageSuffix('google-url').toString())
        const reviewSelector = await getFirstClassOfElementWithSelector(log)('', `[aria-label="${knownReview.authorName}"]`, page)
        const selectors = await getSelectors(log)(page, knownReview)
        const reviews = await findAllAndExecute(log)('', reviewSelector, 
            scrapeReview(onLoopLog)(selectors, viewMoreButtonText, viewUntranslatedContentButtonText), page)
        assert(reviews.some(({authorName}) => authorName === 'Q- Beat'))
        assert(reviews.some(({authorName}) => authorName === 'Lorena Antúnez'))
    })

    it('when it scrapes a reviews page it not scrapes the reviews whom author names are declared to be ignored in config file', async () => {
        await page.goto(getAbsoluteFilePathWithLanguageSuffix('google-url').toString())
        const reviewSelector = await getFirstClassOfElementWithSelector(log)('', `[aria-label="${knownReview.authorName}"]`, page)
        const selectors = await getSelectors(log)(page, knownReview)
        const reviews = await findAllAndExecute(log)('', reviewSelector, 
            scrapeReview(onLoopLog)(selectors, viewMoreButtonText, viewUntranslatedContentButtonText), page)
        const result = reviews.filter(createReviewValidator({...config.webs[0].ignoreReviews, byAuthorName: ['Q- Beat', 'Lorena Antúnez']}))
        assert(!result.some(({authorName}) => authorName === 'Q- Beat'))
        assert(!result.some(({authorName}) => authorName === 'Lorena Antúnez'))
    })
})

