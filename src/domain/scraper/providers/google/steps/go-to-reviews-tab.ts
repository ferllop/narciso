import { Log } from "../../../../logger/logger.js"
import { Milliseconds, Page, click, findOneOrFail, selectorByText, waitForNetworkIdle } from "../../../puppeteer-actions.js"

export const goToReviewsTab = 
	(log: Log, timeout: Milliseconds, reviewsSectionButtonText: string) => (page: Page): Promise<Page> =>
	log('Find the reviews tab', () =>
		Promise.resolve(page)
			.then(findOneOrFail(log, 'to find the reviews tab')(selectorByText('button', reviewsSectionButtonText)))
			.then(click(log, 'to click on reviews tab'))
			.then(_ => waitForNetworkIdle(timeout)(page)))
