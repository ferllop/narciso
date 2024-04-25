import assert from 'node:assert'
import { describe, it, before, after } from 'node:test'
import { Browser, ElementHandle, Page, launch } from 'puppeteer'
import { permitRequestsTo } from '../helpers.js'
import { InferedSelectors, findAllTheReviews, findAuthorNameElement, findContentElement, findRejectCookiesButton, findViewMoreButton, findViewUntranslatedClickableElement, inferSelectors, scrapeAllReviews } from '../../src/google.js'
import { Triad } from '../../src/puppeteer-actions.js'
import { allReviewsFileUrl, config, cookiesFileUrl, getGoogleCodeContent, initialReviewsFileUrl, log, onLoopLog, profileFileUrl } from './google-helpers.js'

const knownTexts = config.web.known.texts
const knownReview = config.web.known.review

describe('given google scraper', async () => {
    let browser: Browser
    let page: Page
    before(async () => {
        browser = await launch(config.puppeteer)
        await getGoogleCodeContent()
    })
    after(async () => {
        await browser.close()
    })

    describe('being on cookies page', async () => {
        before(async () => {
            page = await browser.newPage()
            await permitRequestsTo(page, cookiesFileUrl)
            await page.goto(cookiesFileUrl)
        })
        after(async () => await page.close())

        it('then it knows how to find the button to reject the cookies', async () => {
            const {handle: rejectCookiesButton} = await findRejectCookiesButton(log, knownTexts)(Triad.of(page))
            assert(rejectCookiesButton instanceof ElementHandle, 'an element handle must be found')
            assert(rejectCookiesButton.click, 'the handle must be clickable')
            assert.strictEqual(await rejectCookiesButton.evaluate(e => e.parentNode.localName), 'button', 'is a button')
            assert.strictEqual(await rejectCookiesButton.evaluate(e => e.innerText), knownTexts.rejectCookiesButtonText, 'has the expected text')
        })
    })

    describe('on profile page in its starting state', async () => {
        before(async () => {
            page = await browser.newPage()
            await permitRequestsTo(page, profileFileUrl)
            await page.goto(profileFileUrl)
        })
        after(async () => await page.close())
    })

    describe('on reviews page in its starting state', async () => {
        before(async () => {
            page = await browser.newPage()
            await permitRequestsTo(page, initialReviewsFileUrl)
            await page.goto(initialReviewsFileUrl)
        })
        after(async () => await page.close())
    })

    describe('on reviews page with all the reviews already loaded', async () => {
        let reviewElements: Triad[]
        let inferedSelectors: InferedSelectors
        before(async () => {
            page = await browser.newPage()
            await permitRequestsTo(page, allReviewsFileUrl)
            await page.goto(allReviewsFileUrl)
            inferedSelectors = await inferSelectors(log, knownReview, page)
            reviewElements = await findAllTheReviews(log, inferedSelectors)(Triad.of(page))
        })
        after(async () => await page.close())

        it('then it knows how to get all the review elements', async () => {
            const lastReview = await reviewElements[reviewElements.length -1].handle?.evaluate(e => e.innerText)
            assert.ok(reviewElements.length > 0, 'some elements are found')
            assert.ok(lastReview.includes(config.web.known.oldestReviewAuthorName, 'some elements are found'))
        })

        it('then it knows how to find the button to view the entire content', async () => {
            const {handle: viewMoreButton} = await findViewMoreButton(log, knownTexts)(reviewElements[5])
            assert.ok(viewMoreButton instanceof ElementHandle, 'an element handle must be found')
            assert.ok(viewMoreButton.click, 'the handle must be clickable')
            assert.strictEqual(await viewMoreButton.evaluate(e => e.localName), 'button', 'is a button')
            assert.strictEqual(await viewMoreButton.evaluate(e => e.innerText), knownTexts.viewMoreButtonText, 'has the expected text')
        })

        it('then it knows how to find the button to view the untranslated content', async () => {
            const {handle: viewUntranslatedContentButton} = 
                await findViewUntranslatedClickableElement(log, knownTexts)(reviewElements[5])
            assert.ok(viewUntranslatedContentButton instanceof ElementHandle, 'an element handle must be found')
            assert.ok(viewUntranslatedContentButton.click, 'the handle must be clickable')
            assert.strictEqual(await viewUntranslatedContentButton.evaluate(e => e.parentNode.localName), 'button', 'is a button')
            assert.ok((await viewUntranslatedContentButton.evaluate(e => e.innerText)).includes(knownTexts.viewUntranslatedContentButtonText), 'has the expected text')
        })

        it('then it knows how to find the content', async () => {
            const scrapedKnownReview = reviewElements.toReversed()[config.web.known.review.positionFromOldestBeingZero]
            const {handle: content} = await findContentElement(log, inferedSelectors)(scrapedKnownReview)
            assert.strictEqual(await content?.evaluate(e => e.innerText), knownReview.content, 'has the expected content')
        })

        it('then it knows how to find the author name', async () => {
            const scrapedKnownReview = reviewElements.toReversed()[config.web.known.review.positionFromOldestBeingZero]
            const {handle: content} = await findAuthorNameElement(log, inferedSelectors)(scrapedKnownReview)
            assert.strictEqual(await content?.evaluate(e => e.innerText), knownReview.authorName, 'has the expected content')
        })

        it('when it scrapes a reviews page it includes the first and the last reviews', async () => {
            const reviews = await scrapeAllReviews(log, onLoopLog)(config.web.known)(Triad.of(page))
            assert(reviews.some(({authorName}) => authorName === 'Q- Beat'))
            assert(reviews.some(({authorName}) => authorName === 'Lorena Antúnez'))
        })
    })
})

