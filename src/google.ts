import { KnownConfig, KnownTexts as KnownTexts, KnownReview, WebConfig } from "./config-parser.js"
import { Review, createReviewValidator } from "./review.js"
import { LogFunction } from "./logger.js"
import { 
    Milliseconds, 
    Browser, 
    getFirstClassOfElementWithSelector, 
    getFirstClassOfElementWithText, 
    doClickOrFailOn,
    doFindOne,
    doActions,
    Triad,
    doWaitForNetworkIdle,
    doPressKey,
    doScrollUntil,
    doClickIfPresent,
    doFindOneInHandle,
    doFindAll,
    selectorByText,
    Page,
} from "./puppeteer-actions.js"

const PROVIDER_NAME = 'google'

export type InferedSelectors = Awaited<ReturnType<typeof inferSelectors>>
export const inferSelectors = async (log: LogFunction, knownReview: KnownReview, page: Page) => ({
    content: await getFirstClassOfElementWithText(log)('to get the class to get the content', knownReview.content, page),
    authorName: await getFirstClassOfElementWithText(log)('to get the class to get the author name', knownReview.authorName, page),
    review: await getFirstClassOfElementWithSelector(log)
        ('to get the class to find each review', `[aria-label="${knownReview.authorName}"]`, page)
}) 

export const findRejectCookiesButton = (log: LogFunction, knownTexts: KnownTexts) => 
    doFindOne(log)('to get the reject cookies button')(selectorByText('button', knownTexts.rejectCookiesButtonText))
export const rejectCookies = (log: LogFunction, timeout: Milliseconds) => 
    (knownTexts: KnownTexts) =>
    doActions(log)('to reject cookies')(
        findRejectCookiesButton(log, knownTexts),
        doClickOrFailOn(log)('to reject cookies'),
        doWaitForNetworkIdle(timeout))

export const findReviewsTab = (log: LogFunction, knownTexts: KnownTexts) => 
    doFindOne(log)('to find the reviews tab')(selectorByText('button', knownTexts.reviewsSectionButtonText))

export const loadAllReviews = (log: LogFunction, timeout: Milliseconds) => 
    (knownTexts: KnownTexts, oldestReviewAuthorName: string) =>
    doActions(log)('Load all the reviews')(
        doActions(log)('Go to reviews tab')(
            findReviewsTab(log, knownTexts),
            doClickOrFailOn(log)('to click on reviews tab'),
            doWaitForNetworkIdle(timeout)
        ),
        doActions(log)('Order by newest')(
            doActions(log)('to open ordering options')(
                doFindOne(log)('to find the sorting options button')(selectorByText('button', knownTexts.sortingButtonText)),
                doClickOrFailOn(log)('to open the sorting options menu'),
            ),
            doActions(log)('Select order by newest')(
                doFindOne(log)('to find the order by newest option')(selectorByText('', knownTexts.byNewestOptionButtonText)),
                doClickOrFailOn(log)('to select the order by newest option'),
            ),
            doWaitForNetworkIdle(timeout)
        ),
        doActions(log)('Scroll down until all the reviews are loaded')(
            doPressKey(log)('to focus on reviews list')('Tab'),
            doScrollUntil(log, timeout)('to keep scrolling')(
                async triad => {
                    const {handle: element} = await doFindOne
                        (log)
                        ('to check if the have arrived to the last review')
                        (selectorByText('', oldestReviewAuthorName))(triad)
                    return element !== null
                }
            ), 
        ),
     )

export const findAllTheReviews = (log: LogFunction, inferedSelectors: InferedSelectors) =>
    doFindAll(log)('to find all the reviews elements')(inferedSelectors.review)

export const findRatingElement = (log: LogFunction, {stars}: KnownTexts) => 
    doFindOneInHandle(log)('to get the rating')(`[aria-label~="${stars}"]`)
export const findAuthorNameElement = (log: LogFunction, inferedSelectors: InferedSelectors) =>
    doFindOneInHandle(log)('to get the author name')(inferedSelectors.authorName)
export const findViewMoreButton = (log: LogFunction, {viewMoreButtonText}: KnownTexts) => 
    doFindOneInHandle(log)('to get the clickable element to view the entire content')
        (selectorByText('button', viewMoreButtonText))
export const findViewUntranslatedClickableElement = (log: LogFunction, {viewUntranslatedContentButtonText}: KnownTexts) =>
    doFindOneInHandle(log)('to get the clickable element to view the untranslated content')
        (selectorByText('span', viewUntranslatedContentButtonText))
export const findContentElement = (log: LogFunction, inferedSelectors: InferedSelectors) => 
    doFindOneInHandle(log)('to get the content')(inferedSelectors.content)
export const loadEntireContent = (log: LogFunction, inferedSelectors: InferedSelectors, knownTexts: KnownTexts) => 
    doActions(log)('to get the full and untranslated content of the review')(
        findViewMoreButton(log, knownTexts),
        doClickIfPresent(log)('to click to view the entire content'),
        findViewUntranslatedClickableElement(log, knownTexts),
        doClickIfPresent(log)('to click to view the untranslated content'),
        findContentElement(log, inferedSelectors))
export const scrapeReview = (log: LogFunction) => 
    (inferedSelectors: InferedSelectors, knownTexts: KnownTexts) => 
    async (triad: Triad): Promise<Review> => 
    ({ 
        provider: PROVIDER_NAME, 
        rating: await Triad.getOrElse(rating => rating.getAttribute('aria-label').replace(/\D/g, ''), () => '')
                    (await findRatingElement(log, knownTexts)(triad)),
        authorName: await Triad.getOrElse(
                    el => el.innerText
                        .toLowerCase()
                        .split(' ')
                        .map((s: string) => s.charAt(0).toUpperCase() + s.substring(1))
                        .join(' '),
                    () => '')(await findAuthorNameElement(log, inferedSelectors)(triad)),
        content: await Triad.getOrElse(el => el.innerHTML, () => '')
            (await loadEntireContent(log, inferedSelectors, knownTexts)(triad))
    })

export const scrapeAllReviews = (log: LogFunction, logOnLoop: LogFunction) => (known: KnownConfig) => async (triad: Triad): Promise<Review[]> => {
    const inferedSelectors = await inferSelectors(log, known.review, triad.page)
    const reviewEls = await findAllTheReviews(log, inferedSelectors)(Triad.of(triad.page))
    return Promise.all(
        reviewEls.map(
            scrapeReview(logOnLoop)(inferedSelectors, known.texts)))
}

export const createGoogleReviewsScraper = 
    (log: LogFunction, logOnLoop: LogFunction, timeout: Milliseconds, browser: Browser) => 
    async (webConfig: WebConfig) => {
    const isValidReview = createReviewValidator(webConfig.ignoreReviews)
    const page = await browser.newPage()
    await page.goto(webConfig.url)
    await doActions(log)('')(
        rejectCookies(log, timeout)(webConfig.known.texts),
        loadAllReviews(log, timeout)(webConfig.known.texts, webConfig.known.oldestReviewAuthorName)
    )(Triad.of(page))
    const reviews = await scrapeAllReviews(log, logOnLoop)(webConfig.known)(Triad.of(page))
    return reviews.filter(isValidReview)
}
