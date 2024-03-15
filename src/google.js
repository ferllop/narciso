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

export const clickOnRejectCookiesButton = async (page, rejectButtonText, timeout = 30000) => {
    return executeClickOrFail('to reject cookies', page, `button ::-p-text(${rejectButtonText})`, timeout)
}

const goToReviewsSection = async (page, ariaLabelWord) => {
    const selector = `[aria-label~="${ariaLabelWord}"]`
    return executeClickOrFail('to navigate to reviews section', page, selector)
}

const orderByNewest = async (page, orderSelectAriaLabel) => {
    const action = async () => {
        await page.waitForNetworkIdle()
        await page.click(`[aria-label~="${orderSelectAriaLabel}"`)
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('Enter')
    }
    return execute('ORDER_REVIEWS_BY_NEWEST', action, false)
}

export const loadAllReviews = async (page, reviewSelector) => {
    const action = async () => {
        await goToReviewsSection(page, 'Reseñas')
        await orderByNewest(page, 'Ordenar')
        await page.waitForNetworkIdle()
        await page.keyboard.press('Tab')

        let previousQuantity
        let loadedQuantity = await page.$$eval(reviewSelector, nodes => nodes.length)
        do {
            previousQuantity = loadedQuantity
            await page.keyboard.press('End')
            await page.waitForNetworkIdle()
            loadedQuantity = await page.$$eval(reviewSelector, nodes => nodes.length)
        } while (loadedQuantity > previousQuantity)
    }
    return execute('SCROLL_UNTIL_ALL_REVIEWS_ARE_LOADED', action, false)
}

export const getClassOfElementWithText = async (name, page) => {
    const action = async () => {
        const el = await page.$(`::-p-text(${name})`)
        const tag = await el.evaluate(el => el.nodeName.toLowerCase())
        const className = await el.evaluate(el => el.classList[0])
        return tag + '.' + className
    }
    return execute(`GET_CLASS_OF_ELEMENT_WITH_TEXT ${name}`, action, false)
}

export const getReviewElements = async (page, reviewsSelector) => {
    const action = async () => page.$$(reviewsSelector)
    return execute(`GET REVIEWS WITH SELECTOR ${reviewsSelector}`, action, false)
}

export const getRating = async review => {
    const action = async () => review.$eval(
        '[aria-label~="estrellas"]', 
        rating => rating.getAttribute('aria-label').replace(/\D/g, ''))
    return execute('get Rating', action, true)
}

export const getName = nameSelector => async review => {
    const action = async () => review.$eval(
        nameSelector,
        el => el.innerText
                .toLowerCase()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ')
                )
    return execute('get author name', action, true)
}

export const viewEntireContent = async review => 
    executeClickIfPresent('to view the entire content', review, `button ::-p-text(Más)`)

export const viewUntranslatedContent = async review => 
    executeClickIfPresent('to view untranslated content', review, `span ::-p-text(Ver original)`)

export const getContent = contentSelector => async review => {
    const action = async () => {
        const content = await review.$(contentSelector)
        if (!content) {
            return Promise.resolve('')
        }
        await viewEntireContent(review)
        await viewUntranslatedContent(review)
        return review.$eval(contentSelector, el => el.innerHTML)
    }
    return execute('get content', action, true)
}

export const scrapeReviews = async (reviews, webConfig, nameSelector, contentSelector) => {
    const action = async () => { 
        const {ignore_reviews, provider} = webConfig
        const minimumRating = ignore_reviews.by_minimum_rating
        const prohibitedNames = ignore_reviews.by_name
        const minimumCharInContent = ignore_reviews.by_minimum_characters_count_in_content
        let accum = []
        for await (const review of reviews) {
            const rating = await getRating(review)
            const name = await getName(nameSelector)(review)
            const content = await getContent(contentSelector)(review)

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

export const scrapeGoogleUrl = browser => async webConfig => {
    const page = await browser.newPage()
    await page.goto(webConfig.url)
    await clickOnRejectCookiesButton(page, 'Rechazar')
    await loadAllReviews(page, '.jftiEf')
    const reviews = await getReviewElements(page, '.jftiEf')
    const nameSelector = await getClassOfElementWithText('Lidia Gonzalez Pot', page)
    const contentSelector = await getClassOfElementWithText('¡Buen trato, buena faena, buen resultado! Recomendable', page)
    return await scrapeReviews(reviews, webConfig, nameSelector, contentSelector)
}
