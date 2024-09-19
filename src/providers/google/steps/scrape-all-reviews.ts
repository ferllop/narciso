import { LogFunction } from "../../../logger/logger.js"
import { 
	ElementHandle, 
	Page, 
	clickIfPresent,
	evalOrElse, 
	findAll, 
	findOne, 
	selectorByText
} from "../../../puppeteer-actions.js"
import { Review } from "../../../review.js"
import { GoogleKnownTexts, GoogleSpecificConfig } from "../google.config.js"
import { InferedSelectors } from "./infer-selectors.js"


export const scrapeAllReviews = (
	log: LogFunction, 
	logOnLoop: LogFunction, 
	{translatedContent, known}: GoogleSpecificConfig,
	inferedSelectors: InferedSelectors,
	providerName: string
) => async (page: Page): Promise<Review[]> =>
	log(`get the reviews data with ${translatedContent ? '' : 'un'}translated content`, async () => Promise.all(
		await Promise.resolve(page)
			.then(findAll(log, 'to find all the reviews elements')(inferedSelectors.review))
			.then(reviews => reviews.map(async review => ({
				provider: providerName, 
				rating: await scrapeRating(logOnLoop, known.texts.stars, review),
				authorName: await scrapeAuthor(logOnLoop, inferedSelectors.authorName, review),
				content: 
					await scrapeContent(logOnLoop, inferedSelectors.content, known.texts, translatedContent, page, review)
			})))
	))

const scrapeRating = (log: LogFunction, stars: string, review: ElementHandle): Promise<number> =>  
	Promise.resolve(review)
		.then(findOne(log, 'to get the rating element')(`[aria-label~="${stars}"]`))
		.then(evalOrElse(
			ratingEl => {
				const value = ratingEl.getAttribute('aria-label')
				return value === null ? '0' : value.replace(/\D/g, '')
			}, 
			() => '0'))
		.then(parseInt)

const scrapeAuthor = async (log: LogFunction, authorNameSelector: string, review: ElementHandle): Promise<string> =>  
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
	log: LogFunction, 
	contentSelector: string, 
	knownTexts: GoogleKnownTexts, 
	loadTranslatedContent: boolean,
	page: Page,
	review: ElementHandle): Promise<string> => 
	Promise.resolve(review)
		.then(review => loadTranslatedContent ? review : loadUntranslatedContent(log, knownTexts.viewUntranslatedContentButtonText))
		.then(_ => page.waitForNetworkIdle())
		.then(_ => loadContentEntirely(log, knownTexts.viewMoreButtonText)(review))
		.then(_ => page.waitForNetworkIdle())
		.then(_ => review)
		.then(findOne(log, 'to get the content')(contentSelector))
		.then(evalOrElse(el => el.innerHTML, () => ''))

const loadUntranslatedContent = 
	(log: LogFunction, viewUntranslatedContentButtonText: string) => (review: ElementHandle) =>  
	Promise.resolve(review)
		.then(findOne(log, 'to get the clickable element to view the untranslated content')
			  (selectorByText('span', viewUntranslatedContentButtonText)))
		.then(clickIfPresent(log, 'to view the untranslated content'))

const loadContentEntirely = 
	(log: LogFunction, viewMoreButtonText: string) => (review: ElementHandle) => 
	Promise.resolve(review)
		.then(findOne(log, 'to get the clickable element to expand the content')(selectorByText('button', viewMoreButtonText)))
		.then(clickIfPresent(log, 'to view the entire content'))

