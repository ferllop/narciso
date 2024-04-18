import { KnownConfig, WebConfig } from "./config-parser.js"
import { Review, createReviewValidator } from "./review.js"
import { LogFunction } from "./logger.js"
import { 
    Handle, 
    Milliseconds, 
    Selector, 
    Page, 
    Browser, 
    findOneAndEval, 
    clickIfPresent, 
    getFirstClassOfElementWithSelector, 
    getFirstClassOfElementWithText, 
    findAllAndExecute, 
    doClickOrFailOn,
    doFindOne,
    doActions,
    Triad,
    doWaitForNetworkIdle,
    doPressKey,
    doScrollUntil,
} from "./puppeteer-actions.js"

const PROVIDER_NAME = 'google'
export const selectorByText = (cssSelector: Selector, rejectCookiesText: string) => `${cssSelector} ::-p-text(${rejectCookiesText})`


export const rejectCookies = (log: LogFunction, timeout: Milliseconds) => 
    (rejectCookiesButtonText: string) =>     
    doActions(log)('to reject cookies')(
        doFindOne(log)('to get the reject cookies button')(selectorByText('button', rejectCookiesButtonText)),
        doClickOrFailOn(log)('to reject cookies'),
        doWaitForNetworkIdle(timeout),
     )


export const loadAllReviews = (log: LogFunction, timeout: Milliseconds) => 
    ({ 
        reviewsSectionButtonText,
        sortingButtonText,
        byNewestOptionButtonText,
        oldestReviewAuthorName,
    }: KnownConfig) =>
    doActions(log)('Load all the reviews')(
        doActions(log)('Go to reviews tab')(
            doFindOne(log)('to find the reviews tab')(selectorByText('button', reviewsSectionButtonText)),
            doClickOrFailOn(log)('to click on reviews tab'),
            doWaitForNetworkIdle(timeout)
        ),
        doActions(log)('Order by newest')(
            doActions(log)('to open ordering options')(
                doFindOne(log)('to find the sorting options button')(selectorByText('button', sortingButtonText)),
                doClickOrFailOn(log)('to open the sorting options menu'),
            ),
            doActions(log)('Select order by newest')(
                doFindOne(log)('to find the order by newest option')(selectorByText('', byNewestOptionButtonText)),
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
    await doActions(log)('')(
        rejectCookies(log, timeout)(rejectCookiesButtonText),
        loadAllReviews(log, timeout)(webConfig.known)
    )(Triad.of(page))
    const selectors = await getSelectors(log)(page, knownReview)
    const promises = await findAllAndExecute(log)(
        'to get all the reviews',
        selectors.review,
        scrapeReview(logOnLoop)(selectors, viewMoreButtonText,viewUntranslatedContentButtonText),
        page)
    const reviews = await Promise.all(promises)
    return reviews.filter(isValidReview)
}
