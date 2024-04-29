import type { WebConfig, GoogleKnownConfig, GoogleKnownTexts, GoogleKnownReview, GoogleSpecificConfig } from "./config/config.js"
import { Review, createReviewValidator } from "./review.js"
import { LogFunction } from "./logger.js"
import { 
    Milliseconds, 
    Browser, 
    getFirstClassOfElementWithSelector, 
    getFirstClassOfElementWithText, 
    selectorByText,
    Page,
    ElementHandle,
    evalOrElse,
    findOne,
    clickIfPresent,
    findAll,
    clickOrFail,
    waitForNetworkIdle,
    goto,
    pressKey,
    scrollUntil,
} from "./puppeteer-actions.js"

const PROVIDER_NAME = 'google'

export type InferedSelectors = {
    content: string
    authorName: string
    review: string
}
export const inferSelectors = (log: LogFunction, knownReview: GoogleKnownReview) => 
    async (page: Page) => ({
    content: await getFirstClassOfElementWithText(log)('to get the class to get the content', knownReview.content, page),
    authorName: await getFirstClassOfElementWithText(log)('to get the class to get the author name', knownReview.authorName, page),
    review: await getFirstClassOfElementWithSelector(log)
        ('to get the class to find each review', `[aria-label="${knownReview.authorName}"]`, page)
}) 

export const findRejectCookiesButton = (log: LogFunction, knownTexts: GoogleKnownTexts) => 
    findOne(log)('to get the reject cookies button')(selectorByText('button', knownTexts.rejectCookiesButtonText))
export const rejectCookies = (log: LogFunction, timeout: Milliseconds, knownTexts: GoogleKnownTexts) => 
    async (page: Page) =>
    log('to reject cookies')(async () => 
        findRejectCookiesButton(log, knownTexts)(page)
            .then(clickOrFail(log)('to reject cookies'))
            .then(waitForNetworkIdle(timeout, page)))

export const findReviewsTab = (log: LogFunction, knownTexts: GoogleKnownTexts) => 
    findOne(log)('to find the reviews tab')(selectorByText('button', knownTexts.reviewsSectionButtonText))
export const findOrderingOptionsButton = (log: LogFunction, knownTexts: GoogleKnownTexts) =>
    findOne(log)('to find the sorting options button')(selectorByText('button', knownTexts.sortingButtonText))
export const findByNewestOrderingOption = (log: LogFunction, knownTexts: GoogleKnownTexts) =>
    findOne(log)('to find the order by newest option')(selectorByText('', knownTexts.byNewestOptionButtonText))
export const loadAllReviews = (log: LogFunction, timeout: Milliseconds, {texts, oldestReviewAuthorName}: GoogleKnownConfig) => 
    async (page: Page) =>
    log('Load all the reviews')(async () => { 
        await log('Find the reviews tab')(async () =>
        findReviewsTab(log, texts)(page)
            .then(clickOrFail(log)('to click on reviews tab'))
            .then(_ => page.waitForNetworkIdle({timeout})))

        await log('Order by newest')(async () =>
        findOrderingOptionsButton(log, texts)(page)
            .then(clickOrFail(log)('to open the sorting options menu'))
            .then(_ => findByNewestOrderingOption(log, texts)(page))
            .then(clickOrFail(log)('to select the order by newest option'))
            .then(_ => page.waitForNetworkIdle({timeout})))

        return log('Scroll down until all the reviews are loaded')(async () =>
        pressKey(log)('to focus on reviews list', 'Tab')(page)
            .then(scrollUntil(log, timeout)(
                async handle =>findOne(log)('to check if have arrived to the last review')
                        (selectorByText('', oldestReviewAuthorName))(handle)
                        .then(found => found !== null) 
        )
     ))
})

export const findAllTheReviews = (log: LogFunction, inferedSelectors: InferedSelectors) =>
    findAll(log)('to find all the reviews elements')(inferedSelectors.review)

export const findRatingElement = (log: LogFunction, {stars}: GoogleKnownTexts) => 
    findOne(log)('to get the rating element')(`[aria-label~="${stars}"]`)
export const findAuthorNameElement = (log: LogFunction, inferedSelectors: InferedSelectors) =>
    findOne(log)('to get the author name element')(inferedSelectors.authorName)
export const findViewMoreButton = (log: LogFunction, {viewMoreButtonText}: GoogleKnownTexts) => 
    findOne(log)('to get the clickable element to expand the content')(selectorByText('button', viewMoreButtonText))
export const findViewUntranslatedClickableElement = (log: LogFunction, {viewUntranslatedContentButtonText}: GoogleKnownTexts) =>
    findOne(log)('to get the clickable element to view the untranslated content')
        (selectorByText('span', viewUntranslatedContentButtonText))
export const findContentElement = (log: LogFunction, inferedSelectors: InferedSelectors) => 
    findOne(log)('to get the content')(inferedSelectors.content)

export const loadEntireContent = (log: LogFunction, inferedSelectors: InferedSelectors, knownTexts: GoogleKnownTexts) => 
    async (review: ElementHandle) => {
    findViewMoreButton(log, knownTexts)(review)
        .then(clickIfPresent(log)('to view the entire content'))
    findViewUntranslatedClickableElement(log, knownTexts)(review)
        .then(clickIfPresent(log)('to view the untranslated content'))
    return await findContentElement(log, inferedSelectors)(review)
}
export const scrapeReview = (log: LogFunction, inferedSelectors: InferedSelectors, knownTexts: GoogleKnownTexts) => 
    async (review: ElementHandle): Promise<Review> => ({
        provider: PROVIDER_NAME, 
        rating: await findRatingElement(log, knownTexts)(review)
            .then(evalOrElse((rating: Element) => {
                const value = (rating as HTMLElement).getAttribute('aria-label')
                return value === null ? '0' : value.replace(/\D/g, '')
            }, () => '0'))
            .then(parseInt),

        authorName: await findAuthorNameElement(log, inferedSelectors)(review)
            .then(evalOrElse(
            el => (el as HTMLElement).innerText
            .toLowerCase()
            .split(' ')
            .map((s: string) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' '), () => '')),

        content: await loadEntireContent(log, inferedSelectors, knownTexts)(review)
            .then(evalOrElse(el => el.innerHTML, () => ''))
    })

export const scrapeAllReviews = (log: LogFunction, logOnLoop: LogFunction, {review, texts}: GoogleKnownConfig) => 
    async (page: Page): Promise<Review[]> => {
    const inferedSelectors = await inferSelectors(log, review)(page)
    return Promise.all(
        await findAllTheReviews(log, inferedSelectors)(page)
            .then(reviewEls => reviewEls.map(scrapeReview(logOnLoop, inferedSelectors, texts))))
}

export const createGoogleReviewsScraper = 
    (log: LogFunction, logOnLoop: LogFunction, timeout: Milliseconds, browser: Browser) => 
    async (webConfig: WebConfig<GoogleSpecificConfig>) => {
    const reviews = await browser.newPage()
        .then(goto(webConfig.url))
        .then(rejectCookies(log, timeout, webConfig.known.texts))
        .then(loadAllReviews(log, timeout, webConfig.known))
        .then(scrapeAllReviews(log, logOnLoop, webConfig.known))
    return reviews.filter(createReviewValidator(webConfig.ignoreReviews))
}
