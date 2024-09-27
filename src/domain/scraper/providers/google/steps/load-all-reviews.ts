import { Log } from "../../../../logger/logger.js"
import { 
	Handle, 
	Milliseconds, 
	Page, 
	findOne, 
	pressKey, 
	scrollUntil, 
	selectorByText, 
} from "../../../puppeteer-actions.js"

export const loadAllReviews =
	(log: Log, timeout: Milliseconds, oldestReviewAuthorName: string) => (page: Page): Promise<Page> => 
	log('Load all the reviews', () => scrollUntilTheEnd(log, timeout, oldestReviewAuthorName, page))

const scrollUntilTheEnd = 
	(log: Log, timeout: Milliseconds, oldestReviewAuthorName: string, page: Page): Promise<Page> => {
	const hasLoadedTheLastReview = (handle: Handle): Promise<boolean> => 
		Promise.resolve(handle)
			.then(findOne(log, 'to check if have arrived to the last review')(selectorByText('', oldestReviewAuthorName)))
			.then(found => found !== null) 

	return log('Scroll down until all the reviews are loaded', () =>
		Promise.resolve(page)
		.then(pressKey(log, 'to focus on reviews list', 'Tab'))
		.then(scrollUntil(log, timeout)(hasLoadedTheLastReview)))
}
