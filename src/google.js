export const getReviewElements = async (bot, page, reviewsSelector) => 
    bot.findAll('to get reviews', page, reviewsSelector)

export const getRating = async (bot, review) =>
    bot.findOneAndEval(
        'to get the rating',
        review,
        '[aria-label~="estrellas"]', 
        rating => rating.getAttribute('aria-label').replace(/\D/g, ''))

export const getName = async (bot, review, nameSelector) =>
    await bot.findOneAndEval(
        'to get the author name',
        review,
        nameSelector,
        el => el.innerText
            .toLowerCase()
            .split(' ')
            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' '))

export const getContent = async (bot, review, contentSelector, viewMoreButtonText, viewUntranslatedButtonText) => {
    await bot.clickIfPresent('to view the entire content', review, `button ::-p-text(${viewMoreButtonText})`)
    await bot.clickIfPresent('to view untranslated content', review, `span ::-p-text(${viewUntranslatedButtonText})`)
    return await bot.findOneAndEval('to get the content', review, contentSelector, el => el.innerHTML, () => '')
}

export const scrapeReviews = async (bot, reviews, webConfig, selectors, viewMoreButtonText, viewUntranslatedButtonText) => {
    const action = async () => { 
        const {ignore_reviews, provider} = webConfig
        const minimumRating = ignore_reviews.by_minimum_rating
        const prohibitedNames = ignore_reviews.by_name
        const minimumCharInContent = ignore_reviews.by_minimum_characters_count_in_content
        let accum = []
        for await (const review of reviews) {
            const logOnlyOnErrorBot = bot.modifyLogger({logStart: () => {}, logFinish: () => {}})
            const rating = await getRating(logOnlyOnErrorBot, review)
            const name = await getName(logOnlyOnErrorBot, review, selectors.name)
            const content = await getContent(logOnlyOnErrorBot, review, selectors.content, viewMoreButtonText, viewUntranslatedButtonText)

            if (rating < minimumRating 
                || content.length < minimumCharInContent 
                || prohibitedNames.includes(name)) {
                continue
            }

            accum.push({provider, rating, name, content})
        }
        return accum
    }
    return bot.execute('SCRAPE_ALL_REVIEWS', action)
}

export const rejectCookies = async (bot, page, rejectCookiesButtonText) =>
    await bot.clickOrFailOnTagContainingText('to reject cookies', page, 'button', rejectCookiesButtonText)

export const scrapeGoogleUrl = (bot, browser) => async webConfig => {
    const rejectCookiesButtonText = 'Rechazar todo'
    const reviewsSectionButtonText = 'Reseñas'
    const orderingButtonText = 'Ordenar'
    const byNewestOptionText = 'Más recientes'
    const viewMoreButtonText = 'Más'
    const viewUntranslatedButtonText = 'Ver original'
    const knownReview = {
        name: 'Lidia Gonzalez Pot',
        content: '¡Buen trato, buena faena, buen resultado! Recomendable',
    }
    const oldestReview = { name: 'Q- Beat' }

    const page = await browser.newPage()
    await bot.goto(page, webConfig.url)
    await rejectCookies(bot, page, rejectCookiesButtonText)
    await bot.clickOrFailOnTagContainingText('to go to reviews tab', page, 'button', reviewsSectionButtonText)
    await bot.waitForNetworkIdle(page)
    await bot.clickOrFailOnTagContainingText('to open ordering options', page, 'button', orderingButtonText)
    await bot.clickOrFailOnTagContainingText('to order by newest', page, '', byNewestOptionText)
    await bot.pressKey(page, 'Tab')
    await bot.scrollDownUntilTextIsLoaded('to load all the reviews', page, oldestReview.name)

    const selectors = {
        review: await bot.getFirstClassOfElementWithSelector(`[aria-label="${knownReview.name}"]`, page),
        name: await bot.getFirstClassOfElementWithText(knownReview.name, page),
        content: await bot.getFirstClassOfElementWithText(knownReview.content, page),
    }
    const reviews = await getReviewElements(bot, page, selectors.review)
    return await scrapeReviews(bot, reviews, webConfig, selectors, viewMoreButtonText, viewUntranslatedButtonText)
}
