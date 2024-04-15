import { KnownConfig, WebConfig } from "./config-parser.js"
import { Review, createReviewValidator } from "./review.js"
import { LogFunction } from "./logger.js"
import { 
    Handle, 
    Milliseconds, 
    Selector, 
    Page, 
    Browser, 
    clickOrFail, 
    scrollDownUntilTextIsLoaded, 
    findOneAndEval, 
    clickIfPresent, 
    getFirstClassOfElementWithSelector, 
    getFirstClassOfElementWithText, 
    findAllAndExecute 
} from "./puppeteer-actions.js"

const PROVIDER_NAME = 'google'

export const rejectCookies = (log: LogFunction, timeout: Milliseconds) => 
    async (rejectCookiesButtonText: string, page: Page) =>
    clickOrFail(log, timeout)('to reject cookies', `button ::-p-text(${rejectCookiesButtonText})`, page)

export const loadAllReviews = (log: LogFunction, timeout: Milliseconds) => 
    async (page: Page, knownConfig: KnownConfig) => {
    const {
        reviewsSectionButtonText,
        sortingButtonText,
        byNewestOptionButtonText,
        oldestReviewAuthorName,
    } = knownConfig
    const click = clickOrFail(log, timeout)
    await click('to go to reviews tab', `button ::-p-text(${reviewsSectionButtonText})`, page)
    await page.waitForNetworkIdle()
    await click('to open ordering options', `button ::-p-text(${sortingButtonText})`, page)
    await click('to order by newest', `::-p-text(${byNewestOptionButtonText})`, page)
    await page.keyboard.press('Tab')
    await scrollDownUntilTextIsLoaded(log, timeout)('to load all the reviews', oldestReviewAuthorName, page)
}

export const scrapeReview = (log: LogFunction) => 
    (selectors: Record<string, Selector>, viewMoreButtonText: string, viewUntranslatedButtonText: string) => 
    async (review: Handle): Promise<Review> => { 
    const findOneAndEvaluate = findOneAndEval(log)
    const getRating = async (review: Handle) =>
        findOneAndEvaluate(
            'to get the rating',
            '[aria-label~="estrellas"]', 
            rating => rating.getAttribute('aria-label').replace(/\D/g, ''),
            () => '',
            review)

    const getName = async (review: Handle, nameSelector: Selector) =>
        findOneAndEvaluate(
            'to get the author name',
            nameSelector,
            el => el.innerText
                .toLowerCase()
                .split(' ')
                .map((s: string) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' '),
            () => '',
            review)

    const getContent = 
        async (review: Handle, contentSelector: Selector, viewMoreButtonText: string, viewUntranslatedButtonText: string) => {
        const click = clickIfPresent(log)
        await click('to view the entire content', `button ::-p-text(${viewMoreButtonText})`, review)
        await click('to view untranslated content', `span ::-p-text(${viewUntranslatedButtonText})`, review)
        return await findOneAndEvaluate('to get the content', contentSelector, el => el.innerHTML, () => '', review)
    }

    const rating = await getRating(review)
    const authorName = await getName(review, selectors.authorName)
    const content = await getContent(review, selectors.content, viewMoreButtonText, viewUntranslatedButtonText)

    return {provider: PROVIDER_NAME, rating, authorName, content}
}

export const getSelectors = (log: LogFunction) => 
    async (page: Page, knownReview: KnownConfig["review"]) => ({
    review: await getFirstClassOfElementWithSelector(log)('to get the class to find each review', `[aria-label="${knownReview.authorName}"]`, page),
    authorName: await getFirstClassOfElementWithText(log)('to get the class to get the author name', knownReview.authorName, page),
    content: await getFirstClassOfElementWithText(log)('to get the class to get the content', knownReview.content, page),
})

export const createGoogleReviewsScraper = 
    (log: LogFunction, logOnLoop: LogFunction, timeout: Milliseconds, browser: Browser) => 
    async (webConfig: WebConfig) => {
    const {
        rejectCookiesButtonText, 
        viewMoreButtonText, 
        viewUntranslatedContentButtonText, 
        review: knownReview
    } = webConfig.known
    const isValidReview = createReviewValidator(webConfig.ignoreReviews)
    const page = await browser.newPage()
    await page.goto(webConfig.url)
    await rejectCookies(log, timeout)(rejectCookiesButtonText, page)
    await loadAllReviews(log, timeout)(page, webConfig.known)
    const selectors = await getSelectors(log)(page, knownReview)
    const promises = await findAllAndExecute(log)(
        'to get all the reviews',
        selectors.review,
        scrapeReview(logOnLoop)(selectors, viewMoreButtonText,viewUntranslatedContentButtonText),
        page)
    const reviews = await Promise.all(promises)
    return reviews.filter(isValidReview)
}
