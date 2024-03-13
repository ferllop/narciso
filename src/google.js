import { TimeoutError } from 'puppeteer'

const log = console.log

export const findRejectCookiesButton = async (page, rejectButtonText, timeout) => {
    log('rejecting cookies by clicking on button with text:', rejectButtonText)
    try {
        return await page.waitForSelector(`button ::-p-text(${rejectButtonText})`, {timeout})
    } catch (e) {
        return log(e instanceof TimeoutError 
            ? `Error: Button with text ${rejectButtonText} was not found`
            : e.message)
    }
}

const goToReviews = async (page, ariaLabelWord) => {
    const selector = `[aria-label~="${ariaLabelWord}"]`
    log('Going to reviews by clicking element with selector:', selector)
    const goToReviewsElement = await page.waitForSelector(selector)
    await goToReviewsElement.click()
}

const orderByNewest = async (page, orderSelectAriaLabel) => {
    await page.waitForNetworkIdle()
    await page.click(`[aria-label~="${orderSelectAriaLabel}"`)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
}

const getInnermostByTextNative = text => el => {
    const isLeave = el => !el.hasChildNodes()
    const isText = el => isLeave(el) && el.nodeName === '#text' && el.textContent === text

    const reducer = (accum, el) => 
        isText(el) ? el.parentNode : Array.from(el.childNodes).reduce(reducer, accum)

    return reducer(null, el)
}

export const loadAllReviews = async (page, reviewSelector) => {
    await goToReviews(page, 'Reseñas')
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

export const getInnermostByText = async (text, page) => page.$(`::-p-text(${text})`) 

export const getClassOfElementWithText = async (name, page) => {
    const el = await getInnermostByText(name, page)
    const tag = await el.evaluate(el => el.nodeName.toLowerCase())
    const className = await el.evaluate(el => el.classList[0])
    return tag + '.' + className
}

export const getReviews = async (page, reviewsSelector) => page.$$(reviewsSelector)

export const getRating = async review => 
    review.$eval(
        '[aria-label~="estrellas"]', 
        rating => rating.getAttribute('aria-label').replace(/\D/g, ''))

export const getName = nameSelector => async review => 
    review.$eval(
        nameSelector,
        el => el.innerText
                .toLowerCase()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ')
                )

export const getContent = contentSelector => 
    async review => {
        const content = await review.$(contentSelector)
        if (!content) {
            return Promise.resolve('')
        }

        const translateButton = await review.$(`span ::-p-text(Ver original)`)
        if (translateButton) {
            await translateButton.evaluate(b => b.click())
        }

        const moreButton = await review.$(`button ::-p-text(Más)`)
        if (moreButton) {
            await moreButton.evaluate(b => b.click())
        }

        return review.$eval(contentSelector, el => el.innerHTML)
    }

const makeReviews = async (page, config, reviewSelector) => {
    const minimumRating = config.webs[0].ignore_reviews.by_minimum_rating
    const minimumCharInContent = config.webs[0].ignore_reviews.by_minimum_characters_count_in_content
    const prohibitedNames = config.webs[0].ignore_reviews.by_name

    return await page.evaluate((selector, minRating, minChars, noNames, findByText) => {
        let allReviews = []
        document.querySelectorAll(selector).forEach( review => {
            const moreButton = tempContent.querySelector('[aria-label~="más"]')
            const translateButton = findByText('Ver original')(review)
            if (moreButton) {
                moreButton.click()
            }
            
            let rating = review
                .querySelector('[aria-label~="estrellas"]')
                .getAttribute('aria-label')
                .replace(/\D/g, '')
            let name = review.querySelector('.d4r55').innerText
                name = name
                .toLowerCase()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ')
            let content
            let tempContent = review.querySelector('span.wiI7pd')

            if (moreButton) {
                moreButton.click()
                content = tempContent.querySelector('.review-full-text')
                content = 
                    content.querySelectorAll('span').length === 3
                        ? content.querySelectorAll('span')[2].innerText
                        : content.innerText
            } else if (tempContent.querySelectorAll('span').length === 4) {
                content = tempContent.querySelectorAll('span')[3].innerText
            } else {
                content = tempContent.innerText
            }

            let reviewObj = {
                id : allReviews.length,
                source: 'Google',
                rating: Math.floor(parseInt(rating)),
                name: name,
                content: content,
            }

            if (reviewObj.rating >= minRating 
                && reviewObj.content.length >= minChars 
                && !noNames.includes(reviewObj.name)) {
                    allReviews.push(reviewObj)
            }
        })
        return allReviews
    }, reviewSelector, minimumRating, minimumCharInContent, prohibitedNames, getInnermostByText)
}

export const google = (page, config) => async url => {
    await page.goto(url)
    const rejectCookiesButton = await findRejectCookiesButton(page, 'Rechazar')
    if (rejectCookiesButton) {
        await rejectCookiesButton.click()
    }
    await loadAllReviews(page, '.jftiEf')
    const reviews = makeReviews(page, config, '.jftiEf')
    return reviews
}
