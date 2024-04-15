import { describe, it, before, beforeEach, after, afterEach} from 'node:test'
import assert from 'node:assert'
import { ElementHandle, Page, launch } from 'puppeteer'
import testConfigData from './google.config.json' assert {type: 'json'}
import { TestConfig, avoidExternalRequests, getAbsoluteFilePathWithLanguageSuffix, parseTestConfig, writeWebContentToFile } from '../helpers.js'
import { createLog, noLogLogger } from '../../src/logger.js'
import { getSelectors, loadAllReviews, rejectCookies, scrapeReview } from '../../src/google.js'
import { clickOrFailOnTagContainingText, findAll, findAllAndExecute, getFirstClassOfElementWithSelector } from '../../src/puppeteer-actions.js'
import { createReviewValidator } from '../../src/review.js'

const browserLanguage = 'es-ES'
const cookiesPageName = 'google-cookies-page'
const reviewsPageName = 'google-reviews-page'
const config: TestConfig = parseTestConfig(testConfigData)

const {
    rejectCookiesButtonText, 
    viewMoreButtonText, 
    viewUntranslatedContentButtonText, 
    review: knownReview,
} = config.web.known
const log = createLog(noLogLogger)
const onLoopLog = createLog(noLogLogger)
const getPagePath = getAbsoluteFilePathWithLanguageSuffix(browserLanguage, new URL(import.meta.url))
const getGoogleCodeContent = async () => {
    await writeWebContentToFile(config, getPagePath(cookiesPageName))
    await writeWebContentToFile(
        config,
        getPagePath(reviewsPageName),
        async page => {
            await rejectCookies(log, config.puppeteer.getContentTimeout)(rejectCookiesButtonText, page)
            await loadAllReviews(log, config.puppeteer.getContentTimeout)(page, config.web.known)
        })
}

describe('given google scraper', async () => {
    const browser = await launch(config.puppeteer)
    let page: Page
    before(getGoogleCodeContent) 
    beforeEach(async () => {
        page = await browser.newPage()
        await avoidExternalRequests(page)
    })
    afterEach(async () => await page.close())
    after(async () => browser.close())

    it('when it arrives to google cookies consent page \
        then it knows how to find the button to reject the cookies', async () => {
        const cookiesHtml = getPagePath(cookiesPageName).toString()
        await page.goto(cookiesHtml)
        const rejectCookiesButton = await rejectCookies(log, config.puppeteer.timeout)(rejectCookiesButtonText, page)
        assert(rejectCookiesButton instanceof ElementHandle, 'an element handle must be found')
        assert(rejectCookiesButton.click, 'the handle must be clickable')
    })

    it('when it scrapes a review \
        then it knows how to find the button to view the entire content', async () => {
        await page.goto(getPagePath(reviewsPageName).toString())
        const reviewSelector = await getFirstClassOfElementWithSelector(log)('', `[aria-label="${knownReview.authorName}"]`, page)
        const reviews = await findAll(log)('', reviewSelector, page)
        const moreButton = await clickOrFailOnTagContainingText(log, config.puppeteer.timeout)('', '', viewMoreButtonText, reviews[0])
        assert(moreButton instanceof ElementHandle, 'an element handle must be found')
        assert(moreButton.click, 'the handle must be clickable')
    })

    it('when it scrapes a review \
        then it knows how to find the button to view the untranslated content', async () => {
        await page.goto(getPagePath(reviewsPageName).toString())
        const reviewSelector = await getFirstClassOfElementWithSelector(log)('', `[aria-label="${knownReview.authorName}"]`, page)
        const reviews = await findAll(log)('', reviewSelector, page)
        const seeOriginalButton = await clickOrFailOnTagContainingText(log, config.puppeteer.timeout)('', '', viewUntranslatedContentButtonText, reviews[5])
        assert(seeOriginalButton instanceof ElementHandle, 'an element handle must be found')
        assert(seeOriginalButton.click, 'the handle must be clickable')
    })

    it('when it scrapes a reviews page it scrapes the first and the last reviews', async () => {
        await page.goto(getPagePath(reviewsPageName).toString())
        const reviewSelector = await getFirstClassOfElementWithSelector(log)('', `[aria-label="${knownReview.authorName}"]`, page)
        const selectors = await getSelectors(log)(page, knownReview)
        const reviews = await findAllAndExecute(log)('', reviewSelector, 
            scrapeReview(onLoopLog)(selectors, viewMoreButtonText, viewUntranslatedContentButtonText), page)
        assert(reviews.some(({authorName}) => authorName === 'Q- Beat'))
        assert(reviews.some(({authorName}) => authorName === 'Lorena Antúnez'))
    })

    it('when it scrapes a reviews page it not scrapes the reviews whom author names are declared to be ignored in config file', async () => {
        await page.goto(getPagePath(reviewsPageName).toString())
        const reviewSelector = await getFirstClassOfElementWithSelector(log)('', `[aria-label="${knownReview.authorName}"]`, page)
        const selectors = await getSelectors(log)(page, knownReview)
        const reviews = await findAllAndExecute(log)('', reviewSelector, 
            scrapeReview(onLoopLog)(selectors, viewMoreButtonText, viewUntranslatedContentButtonText), page)
        const result = reviews.filter(createReviewValidator({...config.web.ignoreReviews, byAuthorName: ['Q- Beat', 'Lorena Antúnez']}))
        assert(!result.some(({authorName}) => authorName === 'Q- Beat'))
        assert(!result.some(({authorName}) => authorName === 'Lorena Antúnez'))
    })
})

