import assert from 'node:assert'
import { describe, it, before, after } from 'node:test'
import { Browser, ElementHandle, Page, launch } from 'puppeteer'
import { assertIsClickableElementWithExactText, assertIsClickableElementWithIncludingText, permitRequestsTo } from '../../helpers.js'
import { InferedSelectors, findAllTheReviews, findAuthorNameElement, findContentElement, findOrderingOptionsButton, findRejectCookiesButton, findReviewsTab, findViewMoreButton, findViewUntranslatedClickableElement, inferSelectors, scrapeAllReviews } from '../../../src/providers/google/google.js'
import { allReviewsFileUrl, config, cookiesFileUrl, getGoogleCodeContent, initialReviewsFileUrl, log, onlyOnErrorLog, profileFileUrl } from './google-helpers.js'

const knownTexts = config.web.known.texts
const knownReview = config.web.known.review
const positions = config.web.known.reviewPositionFromOldestBeingZero

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
            const rejectCookiesButton = await findRejectCookiesButton(log, knownTexts)(page)
            await assertIsClickableElementWithExactText(rejectCookiesButton,knownTexts.rejectCookiesButtonText, 'BUTTON')
        })
    })

    describe('on profile page in its starting state', async () => {
        before(async () => {
            page = await browser.newPage()
            await permitRequestsTo(page, profileFileUrl)
            await page.goto(profileFileUrl)
        })
        after(async () => await page.close())

        it('then it knows how to find the reviews tab', async () => {
            const tab = await findReviewsTab(log, knownTexts)(page)
            await assertIsClickableElementWithExactText(tab, knownTexts.reviewsSectionButtonText)
        })
    })

    describe('on reviews page in its starting state', async () => {
        before(async () => {
            page = await browser.newPage()
            await permitRequestsTo(page, initialReviewsFileUrl)
            await page.goto(initialReviewsFileUrl)
        })
        after(async () => await page.close())

        it('then it knows how the find the section to open the sorting options', async () => {
            const ordering = await findOrderingOptionsButton(log, knownTexts)(page)
            await assertIsClickableElementWithExactText(ordering, knownTexts.sortingButtonText)
        })
    })

    describe('on reviews page with all the reviews already loaded', async () => {
        let reviewElements: ElementHandle[]
        let inferedSelectors: InferedSelectors
        before(async () => {
            page = await browser.newPage()
            await permitRequestsTo(page, allReviewsFileUrl)
            await page.goto(allReviewsFileUrl)
            inferedSelectors = await inferSelectors(log, knownReview)(page)
            reviewElements = await findAllTheReviews(log, inferedSelectors)(page)
        })
        after(async () => await page.close())

        it('then it knows how to get all the review elements', async () => {
            const lastReview = 
                await reviewElements[reviewElements.length -1]?.evaluate((e: Element) => (e as HTMLElement).innerText)
            assert.ok(reviewElements.length > 0, 'some elements are found')
            assert.ok(lastReview!.includes(config.web.known.oldestReviewAuthorName), 'some elements are found')
        })

        it('then it knows how to find the button to view the entire content', async () => {
            const viewMoreButton = await findViewMoreButton(log, knownTexts)(reviewElements.toReversed()[positions.withMoreButton])
            assert.ok(viewMoreButton instanceof ElementHandle, 'an element handle must be found')
            assert.ok(viewMoreButton.click, 'the handle must be clickable')
            assert.strictEqual(await viewMoreButton.evaluate(e => e.localName), 'button', 'is a button')
            assert.strictEqual(
                await viewMoreButton.evaluate(e => (e as HTMLElement).innerText), 
                knownTexts.viewMoreButtonText, 'has the expected text')
        })

        it('then it knows how to find the button to view the untranslated content', async () => {
            const viewUntranslatedContentButton = 
                await findViewUntranslatedClickableElement(log, knownTexts)(reviewElements.toReversed()[positions.withViewUntransalatedButton])
            await assertIsClickableElementWithIncludingText(
                viewUntranslatedContentButton, knownTexts.viewUntranslatedContentButtonText, 'BUTTON')
        })

        it('then it knows how to find the content', async () => {
            const scrapedKnownReview = reviewElements.toReversed()[positions.knownReview]
            const content = await findContentElement(log, inferedSelectors)(scrapedKnownReview)
            assert.strictEqual(
                await content?.evaluate(e => (e as HTMLElement).innerText),
                knownReview.content, 'has the expected content')
        })

        it('then it knows how to find the author name', async () => {
            const scrapedKnownReview = reviewElements.toReversed()[positions.knownReview]
            const content = await findAuthorNameElement(log, inferedSelectors)(scrapedKnownReview)
            assert.strictEqual(
                await content?.evaluate(e => (e as HTMLElement).innerText),
                knownReview.authorName, 'has the expected content')
        })

        it('when it scrapes a reviews page it includes the first and the last reviews', async () => {
            const reviews = await scrapeAllReviews(log, onlyOnErrorLog, config.web.known)(page)
            assert(reviews.some(({authorName}) => authorName === 'Q- Beat'))
            assert(reviews.some(({authorName}) => authorName === 'Lorena Antúnez'))
        })
    })
})

