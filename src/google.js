export const getReviewElements = async (bot, page, reviewsSelector) => {
    const action = async () => page.$$(reviewsSelector)
    return bot.execute(`GET REVIEWS WITH SELECTOR ${reviewsSelector}`, action, false)
}

export const getRating = async (bot, review) => {
    const action = async () => review.$eval(
        '[aria-label~="estrellas"]', 
        rating => rating.getAttribute('aria-label').replace(/\D/g, ''))
    return bot.execute('GET_RATING', action, true)
}

export const getName = async (bot, review, nameSelector) => {
    const action = async () => review.$eval(
        nameSelector,
        el => el.innerText
                .toLowerCase()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ')
                )
    return bot.execute('GET_AUTHOR_NAME', action, true)
}

export const viewEntireContent = async (bot, review, viewMoreButtonText) => 
    bot.executeClickIfPresent('to view the entire content', review, `button ::-p-text(${viewMoreButtonText})`)

export const viewUntranslatedContent = async (bot, review, viewUntranslatedButtonText) => 
    bot.executeClickIfPresent('to view untranslated content', review, `span ::-p-text(${viewUntranslatedButtonText})`)

export const getContent = async (bot, review, contentSelector, viewMoreButtonText, viewUntranslatedButtonText) => {
    const action = async () => {
        const content = await review.$(contentSelector)
        if (!content) {
            return Promise.resolve('')
        }
        await viewEntireContent(bot, review, viewMoreButtonText)
        await viewUntranslatedContent(bot, review, viewUntranslatedButtonText)
        return review.$eval(contentSelector, el => el.innerHTML)
    }
    return bot.execute('GET_CONTENT', action, true)
}

export const scrapeReviews = async (bot, reviews, webConfig, selectors, viewMoreButtonText, viewUntranslatedButtonText) => {
    const action = async () => { 
        const {ignore_reviews, provider} = webConfig
        const minimumRating = ignore_reviews.by_minimum_rating
        const prohibitedNames = ignore_reviews.by_name
        const minimumCharInContent = ignore_reviews.by_minimum_characters_count_in_content
        let accum = []
        for await (const review of reviews) {
            const rating = await getRating(bot, review)
            const name = await getName(bot, review, selectors.name)
            const content = await getContent(bot, review, selectors.content, viewMoreButtonText, viewUntranslatedButtonText)

            if (rating < minimumRating 
                || content.length < minimumCharInContent 
                || prohibitedNames.includes(name)) {
                continue
            }

            accum.push({provider, rating, name, content})
        }
        return accum
    }
    return bot.execute('scrape reviews', action, false)
}

export const loadAllReviews = async (bot, page, lastReview) => {
    const action = async () => {
        await page.keyboard.press('Tab')
        let lastReviewElement
        do {
            await page.keyboard.press('End')
            await page.waitForNetworkIdle()
            lastReviewElement = await page.$(`::-p-text(${lastReview.name})`)
        } while (!lastReviewElement)
    }
    return bot.execute('SCROLL_UNTIL_ALL_REVIEWS_ARE_LOADED', action, false)
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
    await page.goto(webConfig.url)
    await rejectCookies(bot, page, rejectCookiesButtonText)
    await bot.clickOrFailOnTagContainingText('to go to reviews tab', page, 'button', reviewsSectionButtonText)
    await bot.clickOrFailOnTagContainingText('to open ordering options', page, 'button', orderingButtonText)
    await bot.clickOrFailOnTagContainingText('to order by newest', page, '', byNewestOptionText)
    await loadAllReviews(bot, page, oldestReview)

    const selectors = {
        review: await bot.getFirstClassOfElementWithSelector(`[aria-label="${knownReview.name}"]`, page),
        name: await bot.getFirstClassOfElementWithText(knownReview.name, page),
        content: await bot.getFirstClassOfElementWithText(knownReview.content, page),
    }
    const reviews = await getReviewElements(bot, page, selectors.review)
    return await scrapeReviews(bot, reviews, webConfig, selectors, viewMoreButtonText, viewUntranslatedButtonText)
}
