import type { WebConfig } from "../../../config/config.js"
import { createReviewValidator } from "../../review.js"
import { LogFunction } from "../../../logger/logger.js"
import { Browser, goto } from "../../puppeteer-actions.js"
import { rejectCookies } from "./steps/reject-cookies.js"
import { loadAllReviews } from "./steps/load-all-reviews.js"
import { scrapeAllReviews } from "./steps/scrape-all-reviews.js"
import { goToReviewsTab } from "./steps/go-to-reviews-tab.js"
import { sortByNewest } from "./steps/sort-by-newest.js"
import { inferSelectors } from "./steps/infer-selectors.js"

const PROVIDER_NAME = 'google'

export const createGoogleReviewsScraper = 
    (log: LogFunction, logInLoop: LogFunction, browser: Browser) => 
    async (webConfig: WebConfig<typeof PROVIDER_NAME>) => {

    const { timeout } = webConfig
    const { oldestReviewAuthorName, texts: knownTexts, review: knownReview } = webConfig.specific.known
    const { rejectCookiesButtonText, reviewsSectionButtonText } = knownTexts

    const reviews = await browser.newPage()
        .then(goto(webConfig.url))
        .then(rejectCookies(log, timeout, rejectCookiesButtonText))
        .then(goToReviewsTab(log, timeout, reviewsSectionButtonText))
        .then(sortByNewest(log, timeout, webConfig.specific.known.texts))
        .then(loadAllReviews(log, timeout, oldestReviewAuthorName))
        .then(inferSelectors(log, knownReview))
        .then(([selectors, page]) => scrapeAllReviews(log, logInLoop, webConfig.specific, selectors, PROVIDER_NAME)(page))
    return reviews.filter(createReviewValidator(webConfig.ignoreReviews))
}

