import { LogFunction } from "../../../../logger/logger.js"
import { Milliseconds, Page, click, findOneOrFail, selectorByText, waitForNetworkIdle } from "../../../puppeteer-actions.js"
import { GoogleKnownTexts } from "../google.config.js"

export const sortByNewest =	(
	log: LogFunction, 
	timeout: Milliseconds, 
	knownTexts: GoogleKnownTexts
) => (page: Page): Promise<Page> =>
	log('Sort by newest', () => 
		Promise.resolve(page)
			.then(findOneOrFail(log, 'to find the sorting options button')(selectorByText('button', knownTexts.sortingButtonText)))
			.then(click(log, 'to open the sorting options menu'))
			.then(_ => waitForNetworkIdle(timeout)(page))
			.then(findOneOrFail(log, 'to find the order by newest option')(selectorByText('', knownTexts.byNewestOptionButtonText)))
			.then(click(log, 'to select the order by newest option'))
			.then(_ => waitForNetworkIdle(timeout)(page)))

