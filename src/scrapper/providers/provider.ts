import { Browser } from "puppeteer"
import { hasProvider } from "../../config/config-parser.js"
import { Provider, WebConfig } from "../../config/config.js"
import { createGoogleReviewsScraper } from "./google/google.js"
import { Review } from "../review.js"
import { LogFunction } from "../../logger/logger.js"
import { createBodasNetReviewsScraper } from "./bodasnet/bodasnet.js"


export type ProviderScraper = (webConfig: WebConfig<Provider>) => Promise<Review[]>

export const createScraper = 
    (log: LogFunction, logInLoop: LogFunction, browser: Browser): ProviderScraper => 
    (webConfig: WebConfig<Provider>) => {
    return hasProvider('google')(webConfig) ? createGoogleReviewsScraper(log, logInLoop, browser)(webConfig)
        : hasProvider('bodasnet')(webConfig) ? createBodasNetReviewsScraper(log, logInLoop, browser)(webConfig)
        : Promise.resolve([])
}

