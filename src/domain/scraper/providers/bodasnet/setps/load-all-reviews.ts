import { Logger } from "../../../../logger/logger.js"
import { Milliseconds, findOne, scrollUntil } from "../../../puppeteer-actions.js"

export const loadAllReviews = (log: Logger, timeout: Milliseconds) => 
    scrollUntil(log, timeout)(async page => {
        const footer = findOne(log, 'to see if we arrived to the bottom of the page')('footer')(page)
        return footer !== null
})
