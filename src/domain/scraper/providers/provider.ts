import { Browser } from "puppeteer"
import { Provider, WebConfig } from "../../config/config.js"
import { createGoogleReviewsScraper } from "./google/google.js"
import { LogFunction } from "../../logger/logger.js"
import { createBodasNetReviewsScraper } from "./bodasnet/bodasnet.js"
import { Review } from "../review.js"

type ProvidersMap = {
    [P in Provider]: ProviderScraper<P>
}

type ProviderScraper<T extends Provider>
    = (log: LogFunction, logInLoop: LogFunction, browser: Browser) 
    => (webConfig: WebConfig<T>) 
    => Promise<Review[]>

export const getProvider = <T extends Provider>(provider: T): ProviderScraper<T> =>
    providers[provider]

const providers: ProvidersMap = {
    'google': createGoogleReviewsScraper,
    'bodasnet': createBodasNetReviewsScraper
}


