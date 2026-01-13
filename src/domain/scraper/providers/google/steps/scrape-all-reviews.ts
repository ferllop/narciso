import { Log } from "../../../../logger/logger.js"
import { 
	ElementHandle, 
	Page, 
	click, 
	evalOrElse, 
	findAll, 
	findOne, 
	findOneOrFail, 
	ifPresent, 
	selectorByText,
	waitForSelector,
	type Handle,
	type Milliseconds
} from "../../../puppeteer-actions.js"
import { Review } from "../../../review.js"
import { GoogleKnownTexts, GoogleSpecificConfig } from "../google.config.js"
import { InferedSelectors } from "./infer-selectors.js"

export const scrapeAllReviews = (
	log: Log, 
	logOnLoop: Log, 
	timeout: Milliseconds,
	googleSpecificConfig: GoogleSpecificConfig,
	inferedSelectors: InferedSelectors,
	providerName: string
) => async (page: Page): Promise<Review[]> =>
	log(`get the reviews data with ${googleSpecificConfig.translatedContent ? '' : 'un'}translated content`, async () => {
		const reviewsEls = await findAll(log, 'to find all the reviews elements')(inferedSelectors.review)(page)
		let reviews: Review[] = []
		for await (const review of reviewsEls) {
			reviews.push(
				await scrapeReview(logOnLoop, timeout, googleSpecificConfig, inferedSelectors, providerName, review)
			)
		}
		return reviews
	})

const scrapeReview = async (
	log: Log, 
	timeout: Milliseconds,
	{translatedContent, known}: GoogleSpecificConfig,
	inferedSelectors: InferedSelectors, 
	providerName: string, 
	review: ElementHandle): Promise<Review> => ({
		provider: providerName, 
		rating: await scrapeRating(log, known.texts.stars, review),
		authorName: await scrapeAuthor(log, inferedSelectors.authorName, review),
		content: await scrapeContent(log, timeout, inferedSelectors.content, known.texts, translatedContent, review)
	})

const scrapeRating = (log: Log, stars: string, review: ElementHandle): Promise<number> =>  
	Promise.resolve(review)
		.then(findOne(log, 'to get the rating element')(`[aria-label~="${stars}"]`))
		.then(evalOrElse(
			ratingEl => {
				const value = ratingEl.getAttribute('aria-label')
				return value === null ? '0' : value.replace(/\D/g, '')
			}, 
			() => '0'))
		.then(parseInt)

const scrapeAuthor = async (log: Log, authorNameSelector: string, review: ElementHandle): Promise<string> =>  
	Promise.resolve(review)
		.then(findOne(log, 'to get the author name element')(authorNameSelector))
		.then(evalOrElse(
			authorEl => (authorEl as HTMLElement).innerText
				.toLowerCase()
				.split(' ')
				.map((s: string) => s.charAt(0).toUpperCase() + s.substring(1))
				.join(' '), 
			() => ''))

const scrapeContent = async (
	log: Log, 
	timeout: Milliseconds,
	contentSelector: string, 
	knownTexts: GoogleKnownTexts, 
	loadTranslatedContent: boolean,
	review: ElementHandle): Promise<string> => 
	loadContentInDesiredTranslationState(log, timeout, loadTranslatedContent, knownTexts)(review)
		// .then(loadContentEntirely(log, timeout, knownTexts.viewMoreButtonText, contentSelector))
		.then(findOne(log, 'to get the content')(contentSelector))
		.then(evalOrElse(el => el.innerHTML, () => ''))
		
export const loadContentInDesiredTranslationState = (
	log: Log, 
	timeout: Milliseconds,
	loadTranslatedContent: boolean,
	knownTexts: GoogleKnownTexts, 
) => (review: ElementHandle) =>  
	loadTranslatedContent
		? Promise.resolve(review)
		: Promise.resolve(review)
			.then(findOne(log, 'to get the clickable element to view the untranslated content')
				  (selectorByText('span', knownTexts.viewUntranslatedContentButtonText)))
			// .then(ifPresent(log, click(log, 'to view the untranslated content')))
			.then(ifPresent(log, async (seeOriginalButton) => {
				await click(log, 'to view the untranslated content')(seeOriginalButton)
				return waitForSelector(log, selectorByText('', knownTexts.viewTranslatedContentButtonText), timeout)(review)
			}))
			.then(_ => review)

const loadContentEntirely = 
	(log: Log, timeout: Milliseconds, viewMoreButtonText: string, contentSelector: string) => (review: ElementHandle) => 
	Promise.resolve(review)
		.then(findOne(log, 'to get the clickable element to expand the content')(selectorByText('button', viewMoreButtonText)))
		.then(ifPresent(log, async viewMoreButton => {
			const getContentLength = () => findOneOrFail(log, 'to get the content')(contentSelector)(review)
				.then(async content => {
					console.log({content: await content.evaluate(el => el.innerHTML)})
					return content.evaluate(el => el.innerHTML.length)
				})
			const contentLengthBefore = await getContentLength()

			await click(log, 'to view the entire content')(viewMoreButton)

			const waitUntil = (pollTime: Milliseconds, timeout: Milliseconds, predicate: (handle: Handle) => Promise<boolean>) => async (handle: Handle) => {
				return await new Promise(resolve => {
					let timeWaiting = 0
					const interval = setInterval(async () => {
						if (await predicate(handle)) {
							clearInterval(interval);
							return resolve(handle);
						};
						timeWaiting += pollTime
						if (timeWaiting > timeout) {
							clearInterval(interval)
							throw new Error('TIMEOUT', { cause: {pollTime, timeWaiting, timeout}})
						}
					}, pollTime);
				});
			}
			await waitUntil(100, timeout, async () => {
				const after = await getContentLength() 
				console.log({after, before: contentLengthBefore})
				return after > contentLengthBefore
			})(review)

			return viewMoreButton
		}))
		.then(_ => review)

