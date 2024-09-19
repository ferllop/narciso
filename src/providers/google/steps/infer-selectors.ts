import { LogFunction } from "../../../logger/logger.js"
import { Page, Selector, getFirstClassOfElementWithSelector, getFirstClassOfElementWithText } from "../../../puppeteer-actions.js"
import { GoogleKnownReview } from "../google.config.js"

export type InferedSelectors = Record<'content' | 'authorName' | 'review', Selector>

export const inferSelectors = (log: LogFunction, knownReview: GoogleKnownReview) => 
	async (page: Page): Promise<[InferedSelectors, Page]> => {
	const inferedSelectors = {
		content: await getFirstClassOfElementWithText(
			log, 'to get the class to get the content', knownReview.content, page),
		authorName: await getFirstClassOfElementWithText(
			log, 'to get the class to get the author name', knownReview.authorName, page),
		review: await getFirstClassOfElementWithSelector(
			log, 'to get the class to find each review', `[aria-label="${knownReview.authorName}"]`, page)
		}

	return [inferedSelectors, page] as const
}
