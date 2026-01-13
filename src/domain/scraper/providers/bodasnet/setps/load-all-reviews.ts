import { Log } from "../../../../logger/logger.js"
import { Milliseconds, findOne, scrollUntil, type Handle, type Page } from "../../../puppeteer-actions.js"

export const loadAllReviews = (log: Log, timeout: Milliseconds) => async (page: Page) => {

    const arrivedToFooter = async (handle: Handle) => {
        const footer = await findOne(log, 'to see if we arrived to the bottom of the page')('footer')(handle)
        return footer !== null
    }

    return scrollUntil(log, timeout)(arrivedToFooter)(page)
}
