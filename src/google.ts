import { Bot, Browser, Handle, Selector, Page } from "./bot.js"
import { IgnoreReviewsConfig, WebConfig } from "./config-parser.js"
import { Review } from "./index.js"

const PROVIDER_NAME = 'google'

export const getReviewElements = async (bot: Bot, page: Handle, reviewsSelector: Selector) => 
    bot.findAll('to get reviews', page, reviewsSelector)

export const getRating = async (bot: Bot, review: Handle) =>
    bot.findOneAndEval(
        'to get the rating',
        review,
        '[aria-label~="estrellas"]', 
        rating => rating.getAttribute('aria-label').replace(/\D/g, ''),
        () => '')

export const getName = async (bot: Bot, review: Handle, nameSelector: Selector) =>
    await bot.findOneAndEval(
        'to get the author name',
        review,
        nameSelector,
        el => el.innerText
            .toLowerCase()
            .split(' ')
            .map((s: string) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' '),
        () => '')

export const getContent = async (bot: Bot, review: Handle, contentSelector: Selector, viewMoreButtonText: string, viewUntranslatedButtonText: string) => {
    await bot.clickIfPresent('to view the entire content', review, `button ::-p-text(${viewMoreButtonText})`)
    await bot.clickIfPresent('to view untranslated content', review, `span ::-p-text(${viewUntranslatedButtonText})`)
    return await bot.findOneAndEval('to get the content', review, contentSelector, el => el.innerHTML, () => '')
}

export const scrapeReviews = (bot: Bot, selectors: Record<string, Selector>, viewMoreButtonText: string, viewUntranslatedButtonText: string) => async (review: Handle) => { 
        const logOnlyOnErrorBot = bot.modifyLogger({logStart: () => {}, logFinish: () => {}})
        const rating = await getRating(logOnlyOnErrorBot, review)
        const name = await getName(logOnlyOnErrorBot, review, selectors.name)
        const content = await getContent(logOnlyOnErrorBot, review, selectors.content, viewMoreButtonText, viewUntranslatedButtonText)

        return {provider: PROVIDER_NAME, rating, name, content}
    }

export const isValidReview = (ignoreConfig: IgnoreReviewsConfig) => (review: Review) => {
    const minimumRating = ignoreConfig.byMinimumRating
    const prohibitedNames = ignoreConfig.byName
    const minimumCharInContent = ignoreConfig.byMinimumCharactersCountInContent
    const {rating, name, content} = review
    return rating >= minimumRating
        && content.length >= minimumCharInContent 
        && !prohibitedNames.includes(name)
}

export const rejectCookies = async (bot: Bot, handle: Handle, rejectCookiesButtonText: string) =>
    await bot.clickOrFailOnTagContainingText('to reject cookies', handle, 'button', rejectCookiesButtonText)

export const loadAllReviews = async (bot: Bot, page: Page, webConfig: WebConfig) => {
    const {
        reviewsSectionButtonText,
        sortingButtonText,
        byNewestOptionButtonText,
        oldestReviewAuthorName
    } = webConfig.known
    await bot.clickOrFailOnTagContainingText('to go to reviews tab', page, 'button', reviewsSectionButtonText)
    await bot.waitForNetworkIdle(page)
    await bot.clickOrFailOnTagContainingText('to open ordering options', page, 'button', sortingButtonText)
    await bot.clickOrFailOnTagContainingText('to order by newest', page, '', byNewestOptionButtonText)
    await bot.pressKey(page, 'Tab')
    await bot.scrollDownUntilTextIsLoaded('to load all the reviews', page, oldestReviewAuthorName)
}

export const scrapeGoogleUrl = (bot: Bot, browser: Browser) => async (webConfig: WebConfig) => {
    const {
        rejectCookiesButtonText, 
        viewMoreButtonText, 
        viewUntranslatedContentButtonText, 
        review: knownReview
    } = webConfig.known
    const page = await browser.newPage()
    await bot.goto(page, webConfig.url)
    await rejectCookies(bot, page, rejectCookiesButtonText)

    await loadAllReviews(bot, page, webConfig)

    const selectors = {
        review: await bot.getFirstClassOfElementWithSelector('to get the class to find each review', page, `[aria-label="${knownReview.name}"]`),
        name: await bot.getFirstClassOfElementWithText('to get the class to get the author name', page, knownReview.name),
        content: await bot.getFirstClassOfElementWithText('to get the class to get the content', page, knownReview.content),
    }
    const promises = await bot.findAllAndExecute(
        'to get all the reviews', 
        page, 
        selectors.review, 
        scrapeReviews(bot, selectors, viewMoreButtonText,viewUntranslatedContentButtonText))
    const reviews = await Promise.all(promises)
    return reviews.filter(isValidReview(webConfig.ignoreReviews))
}
