import { KnownConfig, KnownReview, WebConfig } from "./config-parser.js"
import { Review, createReviewValidator } from "./review.js"
import { LogFunction } from "./logger.js"
import { 
    Milliseconds, 
    Selector, 
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
} from "./puppeteer-actions.js"

const PROVIDER_NAME = 'google'

export const inferContentSelector = (log: LogFunction, knownReview: KnownReview) => ({page}: Triad) =>
    getFirstClassOfElementWithText(log)('to get the class to get the content', knownReview.content, page)

export const inferAuthorNameSelector = (log: LogFunction, knownReview: KnownReview) => ({page}: Triad): Promise<string> =>
    getFirstClassOfElementWithText(log)('to get the class to get the author name', knownReview.authorName, page)

export const inferReviewSelector = (log: LogFunction, knownReview: KnownReview) => ({page}: Triad): Promise<string> =>
    getFirstClassOfElementWithSelector(log)('to get the class to find each review', `[aria-label="${knownReview.authorName}"]`, page)

export const findRejectCookiesButton = (log: LogFunction, rejectCookiesButtonText: string) => 
    doFindOne(log)('to get the reject cookies button')(selectorByText('button', rejectCookiesButtonText))
export const rejectCookies = (log: LogFunction, timeout: Milliseconds) => 
    (rejectCookiesButtonText: string) =>     
    doActions(log)('to reject cookies')(
        findRejectCookiesButton(log, rejectCookiesButtonText),
        doClickOrFailOn(log)('to reject cookies'),
        doWaitForNetworkIdle(timeout))

export const findReviewsTab = (log: LogFunction, knownConfig: KnownConfig) => 
    doFindOne(log)('to find the reviews tab')(selectorByText('button', knownConfig.reviewsSectionButtonText))

export const loadAllReviews = (log: LogFunction, timeout: Milliseconds) => 
    (knownConfig: KnownConfig) =>
    doActions(log)('Load all the reviews')(
        doActions(log)('Go to reviews tab')(
            findReviewsTab(log, knownConfig),
            doClickOrFailOn(log)('to click on reviews tab'),
            doWaitForNetworkIdle(timeout)
        ),
        doActions(log)('Order by newest')(
            doActions(log)('to open ordering options')(
                doFindOne(log)('to find the sorting options button')(selectorByText('button', knownConfig.sortingButtonText)),
                doClickOrFailOn(log)('to open the sorting options menu'),
            ),
            doActions(log)('Select order by newest')(
                doFindOne(log)('to find the order by newest option')(selectorByText('', knownConfig.byNewestOptionButtonText)),
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
                        (selectorByText('', knownConfig.oldestReviewAuthorName))(triad)
                    return element !== null
                }
            ), 
        ),
     )

export const findAllTheReviews = (log: LogFunction, reviewSelector: Selector) =>
    doFindAll(log)('to find all the reviews elements')(reviewSelector)

export const findRatingElement = (log: LogFunction) => 
    doFindOneInHandle(log)('to get the rating')('[aria-label~="estrellas"]')
export const findAuthorNameElement = (log: LogFunction, authorNameSelector: Selector) => 
    doFindOneInHandle(log)('to get the author name')(authorNameSelector)
export const findViewMoreButton = (log: LogFunction, viewMoreButtonText: string) => 
    doFindOneInHandle(log)('to get the clickable element to view the entire content')(selectorByText('button', viewMoreButtonText))
export const findViewUntranslatedClickableElement = (log: LogFunction,viewUntranslatedButtonText: string) =>
    doFindOneInHandle(log)('to get the clickable element to view the untranslated content')(selectorByText('span', viewUntranslatedButtonText))
export const findContentElement = (log: LogFunction, contentSelector: Selector) => 
    doFindOneInHandle(log)('to get the content')(contentSelector)
export const loadEntireContent = (log: LogFunction, contentSelector: string, viewMoreButtonText: string, viewUntranslatedButtonText: string) => doActions(log)('to get the full and untranslated content of the review')(
    findViewMoreButton(log, viewMoreButtonText),
    doClickIfPresent(log)('to click to view the entire content'),
    findViewUntranslatedClickableElement(log, viewUntranslatedButtonText),
    doClickIfPresent(log)('to click to view the untranslated content'),
    findContentElement(log, contentSelector))
export const scrapeReview = (log: LogFunction) => 
    (authorNameSelector: string, contentSelector: string, viewMoreButtonText: string, viewUntranslatedButtonText: string) => 
    async (triad: Triad): Promise<Review> => 
    ({ 
        provider: PROVIDER_NAME, 
        rating: await Triad.getOrElse(rating => rating.getAttribute('aria-label').replace(/\D/g, ''), () => '')
                        (await findRatingElement(log)(triad)),
        authorName: await Triad.getOrElse(
                    el => el.innerText
                        .toLowerCase()
                        .split(' ')
                        .map((s: string) => s.charAt(0).toUpperCase() + s.substring(1))
                        .join(' '),
                    () => '')(await findAuthorNameElement(log, authorNameSelector)(triad)),
        content: await Triad.getOrElse(el => el.innerHTML, () => '')
            (await loadEntireContent(log, contentSelector, viewMoreButtonText, viewUntranslatedButtonText)(triad))
    })

export const scrapeAllReviews = (log: LogFunction, logOnLoop: LogFunction) => (known: KnownConfig) => async (triad: Triad): Promise<Review[]> => {
    const reviewEls = await findAllTheReviews(log, await inferReviewSelector(log, known.review)(triad))(Triad.of(triad.page))
    return Promise.all(
        reviewEls.map(
            scrapeReview(logOnLoop)(
                await inferAuthorNameSelector(log, known.review)(triad),
                await inferContentSelector(log, known.review)(triad),
                known.viewMoreButtonText, 
                known.viewUntranslatedContentButtonText)))
}

export const createGoogleReviewsScraper = 
    (log: LogFunction, logOnLoop: LogFunction, timeout: Milliseconds, browser: Browser) => 
    async (webConfig: WebConfig) => {
    const isValidReview = createReviewValidator(webConfig.ignoreReviews)
    const page = await browser.newPage()
    await page.goto(webConfig.url)
    await doActions(log)('')(
        rejectCookies(log, timeout)(webConfig.known.rejectCookiesButtonText),
        loadAllReviews(log, timeout)(webConfig.known)
    )(Triad.of(page))
    const reviews = await scrapeAllReviews(log, logOnLoop)(webConfig.known)(Triad.of(page))
    return reviews.filter(isValidReview)
}
