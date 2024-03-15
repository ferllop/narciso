const log = console.log

export const execute = async (actionName, action, /** @type boolean */ onlyLogIfError) => {
    if (!onlyLogIfError) {
        log(`Start "${actionName}" started`)
    }
    try {
        const result = await action()
        if (!onlyLogIfError) {
            log(
                `Finish "${actionName}" succesfully` +
                (['string', 'number'].includes(typeof result) 
                    ? ' with result ' + result
                    : '')
            )
        }
        return result
    } catch (e) {
        log(`Error in action "${actionName}": ${e.message}`)
        throw e
    }
}

export const executeClickOrFail = async (/** @type string */ reason, handle, selector, timeout = 30000) => {
    const action = async () => {
        const element = await handle.waitForSelector(selector, {timeout})
        await element.click()
        return element
    }
    const message = `MANDATORY_CLICK_ON_SELECTOR ${selector}` +
        (reason.length > 0 ? ` ${reason}` : '')
    return execute(message, action, false)
}

export const executeClickIfPresent = async (reason, handle, selector) => {
    const action = async () => {
        const element = await handle.$(selector)
        if (element) {
            await element.evaluate(b => b.click())
        }
        return element
    }
    const message = `CLICK_ON_SELECTOR_IF_PRESENT ${selector}` +
        (reason.length > 0 ? ` ${reason}` : '')
    return execute(message, action, true)
}

export const clickOrFailOnTagContainingText = async (reason, JSHandle, tag, text, timeout = 30000) => 
    executeClickOrFail(reason, JSHandle, `${tag} ::-p-text(${text})`, timeout)

export const getFirstClassOfElementWithText = async (name, page) => {
    const action = async () => {
        const el = await page.$(`::-p-text(${name})`)
        const tag = await el.evaluate(el => el.nodeName.toLowerCase())
        const className = await el.evaluate(el => el.classList[0])
        return tag + '.' + className
    }
    return execute(`GET_CLASS_OF_ELEMENT_WITH_TEXT ${name}`, action, false)
}

export const getFirstClassOfElementWithSelector = async (selector, page) => {
    const action = async () => {
        const el = await page.$(selector)
        const tag = await el.evaluate(el => el.nodeName.toLowerCase())
        const className = await el.evaluate(el => el.classList[0])
        return tag + '.' + className
    }
    return execute(`GET_CLASS_OF_ELEMENT_WITH_SELECTOR ${selector}`, action, false)
}

export const getReviewElements = async (page, reviewsSelector) => {
    const action = async () => page.$$(reviewsSelector)
    return execute(`GET REVIEWS WITH SELECTOR ${reviewsSelector}`, action, false)
}

export const getRating = async review => {
    const action = async () => review.$eval(
        '[aria-label~="estrellas"]', 
        rating => rating.getAttribute('aria-label').replace(/\D/g, ''))
    return execute('GET_RATING', action, true)
}

export const getName = async (review, nameSelector) => {
    const action = async () => review.$eval(
        nameSelector,
        el => el.innerText
                .toLowerCase()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ')
                )
    return execute('GET_AUTHOR_NAME', action, true)
}

export const viewEntireContent = async (review, viewMoreButtonText) => 
    executeClickIfPresent('to view the entire content', review, `button ::-p-text(${viewMoreButtonText})`)

export const viewUntranslatedContent = async (review, viewUntranslatedButtonText) => 
    executeClickIfPresent('to view untranslated content', review, `span ::-p-text(${viewUntranslatedButtonText})`)

export const getContent = async (review, contentSelector, viewMoreButtonText, viewUntranslatedButtonText) => {
    const action = async () => {
        const content = await review.$(contentSelector)
        if (!content) {
            return Promise.resolve('')
        }
        await viewEntireContent(review, viewMoreButtonText)
        await viewUntranslatedContent(review, viewUntranslatedButtonText)
        return review.$eval(contentSelector, el => el.innerHTML)
    }
    return execute('GET_CONTENT', action, true)
}

export const scrapeReviews = async (reviews, webConfig, selectors, viewMoreButtonText, viewUntranslatedButtonText) => {
    const action = async () => { 
        const {ignore_reviews, provider} = webConfig
        const minimumRating = ignore_reviews.by_minimum_rating
        const prohibitedNames = ignore_reviews.by_name
        const minimumCharInContent = ignore_reviews.by_minimum_characters_count_in_content
        let accum = []
        for await (const review of reviews) {
            const rating = await getRating(review)
            const name = await getName(review, selectors.name)
            const content = await getContent(review, selectors.content, viewMoreButtonText, viewUntranslatedButtonText)

            if (rating < minimumRating 
                || content.length < minimumCharInContent 
                || prohibitedNames.includes(name)) {
                continue
            }

            accum.push({provider, rating, name, content})
        }
        return accum
    }
    return execute('scrape reviews', action, false)
}

export const loadAllReviews = async (page, lastReview) => {
    const action = async () => {
        await page.keyboard.press('Tab')
        let lastReviewElement
        do {
            await page.keyboard.press('End')
            await page.waitForNetworkIdle()
            lastReviewElement = await page.$(`::-p-text(${lastReview.name})`)
        } while (!lastReviewElement)
    }
    return execute('SCROLL_UNTIL_ALL_REVIEWS_ARE_LOADED', action, false)
}

export const scrapeGoogleUrl = browser => async webConfig => {
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
    await clickOrFailOnTagContainingText('to reject cookies', page, 'button', rejectCookiesButtonText, 5000)
    await clickOrFailOnTagContainingText('to go to reviews tab', page, 'button', reviewsSectionButtonText)
    await clickOrFailOnTagContainingText('to open ordering options', page, 'button', orderingButtonText)
    await clickOrFailOnTagContainingText('to order by newest', page, '', byNewestOptionText)
    await loadAllReviews(page, oldestReview)

    const selectors = {
        review: await getFirstClassOfElementWithSelector(`[aria-label="${knownReview.name}"]`, page),
        name: await getFirstClassOfElementWithText(knownReview.name, page),
        content: await getFirstClassOfElementWithText(knownReview.content, page),
    }
    const reviews = await getReviewElements(page, selectors.review)
    return await scrapeReviews(reviews, webConfig, selectors, viewMoreButtonText, viewUntranslatedButtonText)
}
