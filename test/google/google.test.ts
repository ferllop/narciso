import assert from 'node:assert'
import { describe, it, before, after } from 'node:test'
import { Browser, ElementHandle, Page, launch } from 'puppeteer'
import { permitRequestsTo } from '../helpers.js'
import { findAllTheReviews, findAuthorNameElement, findContentElement, findRejectCookiesButton, findViewMoreButton, findViewUntranslatedClickableElement, inferAuthorNameSelector, inferContentSelector, inferReviewSelector, scrapeAllReviews } from '../../src/google.js'
import { Triad } from '../../src/puppeteer-actions.js'
import { allReviewsFileUrl, config, cookiesFileUrl, getGoogleCodeContent, initialReviewsFileUrl, log, onLoopLog, profileFileUrl } from './google-helpers.js'

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
            const {handle: rejectCookiesButton} = await findRejectCookiesButton(log, config.web.known.rejectCookiesButtonText)(Triad.of(page))
            assert(rejectCookiesButton instanceof ElementHandle, 'an element handle must be found')
            assert(rejectCookiesButton.click, 'the handle must be clickable')
            assert.strictEqual(await rejectCookiesButton.evaluate(e => e.parentNode.localName), 'button', 'is a button')
            assert.strictEqual(await rejectCookiesButton.evaluate(e => e.innerText), config.web.known.rejectCookiesButtonText, 'has the expected text')
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
        let reviewSelector: string
        let authorNameSelector: string
        let contentSelector: string
        let reviewElements: Triad[]
        before(async () => {
            page = await browser.newPage()
            await permitRequestsTo(page, allReviewsFileUrl)
            await page.goto(allReviewsFileUrl)
            reviewSelector = await inferReviewSelector(log, config.web.known.review)(Triad.of(page))
            authorNameSelector = await inferAuthorNameSelector(log, config.web.known.review)(Triad.of(page))
            contentSelector = await inferContentSelector(log, config.web.known.review)(Triad.of(page))
            reviewElements = await findAllTheReviews(log, reviewSelector)(Triad.of(page))
        })
        after(async () => await page.close())

        it('then it knows how to get all the review elements', async () => {
            const lastReview = await reviewElements[reviewElements.length -1].handle?.evaluate(e => e.innerText)
            assert.ok(reviewElements.length > 0, 'some elements are found')
            assert.ok(lastReview.includes(config.web.known.oldestReviewAuthorName, 'some elements are found'))
        })

        it('then it knows how to find the button to view the entire content', async () => {
            const {handle: viewMoreButton} = await findViewMoreButton(log, config.web.known.viewMoreButtonText)(reviewElements[5])
            assert.ok(viewMoreButton instanceof ElementHandle, 'an element handle must be found')
            assert.ok(viewMoreButton.click, 'the handle must be clickable')
            assert.strictEqual(await viewMoreButton.evaluate(e => e.localName), 'button', 'is a button')
            assert.strictEqual(await viewMoreButton.evaluate(e => e.innerText), config.web.known.viewMoreButtonText, 'has the expected text')
        })

        it('then it knows how to find the button to view the untranslated content', async () => {
            const {handle: viewUntranslatedContentButton} = 
                await findViewUntranslatedClickableElement(log, config.web.known.viewUntranslatedContentButtonText)(reviewElements[5])
            assert.ok(viewUntranslatedContentButton instanceof ElementHandle, 'an element handle must be found')
            assert.ok(viewUntranslatedContentButton.click, 'the handle must be clickable')
            assert.strictEqual(await viewUntranslatedContentButton.evaluate(e => e.parentNode.localName), 'button', 'is a button')
            assert.ok((await viewUntranslatedContentButton.evaluate(e => e.innerText)).includes(config.web.known.viewUntranslatedContentButtonText), 'has the expected text')
        })

        it('then it knows how to find the content', async () => {
            const knownReview = reviewElements.toReversed()[config.web.known.review.positionFromOldestBeingZero]
            const {handle: content} = await findContentElement(log, contentSelector)(knownReview)
            assert.strictEqual(await content?.evaluate(e => e.innerText), config.web.known.review.content, 'has the expected content')
        })

        it('then it knows how to find the author name', async () => {
            const knownReview = reviewElements.toReversed()[config.web.known.review.positionFromOldestBeingZero]
            const {handle: content} = await findAuthorNameElement(log, authorNameSelector)(knownReview)
            assert.strictEqual(await content?.evaluate(e => e.innerText), config.web.known.review.authorName, 'has the expected content')
        })

        it('when it scrapes a reviews page it includes the first and the last reviews', async () => {
            const reviews = await scrapeAllReviews(log, onLoopLog)(config.web.known)(Triad.of(page))
            assert(reviews.some(({authorName}) => authorName === 'Q- Beat'))
            assert(reviews.some(({authorName}) => authorName === 'Lorena Antúnez'))
        })
    })
})

