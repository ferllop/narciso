import puppeteer from 'puppeteer'

export const google = config => async url => 
{
    let browser = await puppeteer.launch(config.puppeteer);
    const page = await browser.newPage()

    await page.goto(url)

    //Sacamos el total de reseñas que hay
    const reviewsQtySelector = '.yVc3Hc'

    await page.waitForSelector(reviewsQtySelector)
    const reviewsQtyText = await page.evaluate(reviewsQtySelector => {
        return reviewsQtyText = document.querySelector(reviewsQtySelector).innerText
    }, reviewsQtySelector)

    const totalReviewsQty = parseInt(reviewsQtyText.replace(' opiniones', ''))

    //Ordenamos las reseñas de más nueva a más antigua
    await page.click('g-dropdown-menu')
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    //Vamos a la ultima review que hay cargada
    //y comprobamos si hay las mismas que las que dice el total de reseñas.
    //Si no las hay, repetimos
    const reviewSelector = '.gws-localreviews__google-review'
    let loadedReviewsQty = []
    await page.waitFor(Math.floor(Math.random() * 2000));
    await page.keyboard.press('Tab')

    while (loadedReviewsQty < totalReviewsQty)
    {
        await page.keyboard.press('End')
        await page.waitFor(Math.floor(Math.random() * 2000))
        loadedReviewsQty = await page.evaluate((selector)=> 
        {
            return document.querySelectorAll(selector).length
        }, reviewSelector)
    }

    //Sacamos los datos de cada review y los metemos en un array de objetos.
    const minimumRating = config.webs[0].ignore_reviews.by_minimum_rating
    const minimumCharInContent = config.webs[0].ignore_reviews.by_minimum_characters_count_in_content
    const prohibitedNames = config.webs[0].ignore_reviews.by_name

    let reviews = await page.evaluate((selector, minRating, minChars, noNames) => 
    {
        let allReviews = []
        document.querySelectorAll(selector).forEach( review => 
        {
            let rating = review.querySelector('g-review-stars span').getAttribute('aria-label')
                .replace('Valoración de ', '')
                .replace(' de un máximo de 5,', '')
            let name = review.querySelector('.TSUbDb').innerText;
		name = name.toLowerCase()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ')
            let content
            let tempContent = review.querySelector('.Jtu6Td')

            if(tempContent.querySelector('.review-full-text')) 
            {
                content = tempContent.querySelector('.review-full-text')
                                content.querySelectorAll('span').length === 3
                ? content = content.querySelectorAll('span')[2].innerText
                : content = content.innerText

            } 
            else if (tempContent.querySelectorAll('span').length === 4)
            {
                content = tempContent.querySelectorAll('span')[3].innerText
            } 
            else 
            {
                content = tempContent.innerText
            }

            let reviewObj = {
                id : allReviews.length,
                source: 'Google',
                rating: Math.floor(parseInt(rating)),
                name: name,
                content: content,
            };


            if ( reviewObj.rating >= minRating && reviewObj.content.length >= minChars && !noNames.includes(reviewObj.name) )
                allReviews.push(reviewObj);
        })
        return allReviews
    }, reviewSelector, minimumRating, minimumCharInContent, prohibitedNames)

    await browser.close()

    return reviews
}
