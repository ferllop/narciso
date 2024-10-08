import { Log } from "../../../../logger/logger.js"
import { Milliseconds, Page, click, findOneOrFail, selectorByText, waitForNetworkIdle } from "../../../puppeteer-actions.js"

export const rejectCookies = 
	(log: Log, timeout: Milliseconds, rejectCookiesButtonText: string) => async (page: Page) => 
	log('to reject cookies', async () => 
		Promise.resolve(page)
			.then(findOneOrFail(log, 'to get the reject cookies button')(selectorByText('button', rejectCookiesButtonText)))
			.then(click(log, 'to reject cookies'))
			.then(_ => waitForNetworkIdle(timeout)(page)))
