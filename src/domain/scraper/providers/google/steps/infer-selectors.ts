import { Log } from "../../../../logger/logger.js"
import { Page, Selector, findOneOrFail, getFirstClassOfElementWithSelector, getFirstClassOfElementWithText, type Milliseconds } from "../../../puppeteer-actions.js"
import { GoogleKnownReview, type GoogleKnownTexts } from "../google.config.js"
import { loadContentInDesiredTranslationState } from './scrape-all-reviews.js'

export type InferedSelectors = Record<'content' | 'authorName' | 'review', Selector>

export const inferSelectors = (log: Log, timeout: Milliseconds, loadTranslatedContent: boolean, knownTexts: GoogleKnownTexts, knownReview: GoogleKnownReview) => 
	async (page: Page): Promise<[InferedSelectors, Page]> => log('Infer selectors', async () => {

	const author = `[aria-label="${knownReview.authorName}"]`

	const reviewSelector = await getFirstClassOfElementWithSelector(
			log, 'to get the class to find each review', author, page)
		
	const knownReviewHandle = await findOneOrFail(log, 'to get the known review')(author)(page)
	
	await loadContentInDesiredTranslationState(log, timeout, loadTranslatedContent, knownTexts)(knownReviewHandle)

	const inferedSelectors = {
		content: await getFirstClassOfElementWithText(
			log, 'to get the class to get the content', knownReview.content, page),
		authorName: await getFirstClassOfElementWithText(
			log, 'to get the class to get the author name', knownReview.authorName, page),
		review: reviewSelector,
	}
	return [inferedSelectors, page] as const
})
