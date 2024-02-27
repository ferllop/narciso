import puppeteer from 'puppeteer'
import { config } from './.env.js'

export const starOfService = async (url) => {
    let browser = await puppeteer.launch(config.puppeteer);
    const page = await browser.newPage()

    await page.goto(url)

    //Vamos a la ultima review que hay cargada
    //y comprobamos si hay las mismas que las que dice el total de reseñas.
    //Si no las hay, repetimos
    const reviewSelector = '.list-received_item'


    //Sacamos los datos de cada review y los metemos en un array de objetos.
    const minimumRating = config.webs[1].ignore_reviews.by_minimum_rating
    const minimumCharInContent = config.webs[1].ignore_reviews.by_minimum_characters_count_in_content
    const prohibitedNames = config.webs[1].ignore_reviews.by_name

    let reviews = await page.evaluate((selector, minRating, minChars, noNames) => {
        let allReviews = []
        document.querySelectorAll(selector).forEach( review => {
            let rating = review.querySelector('.rating-stars').title

            let name = review.querySelector('.list-received_item-name').innerText;
            name = name.toLowerCase()
                .replace(/[\n]/g, '')
                .trim()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ')

            let content = review.querySelector('.review-full-message')
            if (!content)
	        content = review.querySelector('.list-received_item-review')

            content = content.innerText.replace(/[\r\n]/g, '').trim()
            
            let reviewObj = {
                id : allReviews.length,
                source: 'Star Of Service',
                rating: Math.floor(rating),
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
