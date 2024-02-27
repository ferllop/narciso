import fs from 'node:fs'
import { config } from './.env.js'
import { google } from './google.js'
import { starOfService } from './star-of-service.js'

(async () => {
    const providers = {
        google,
        star_of_service: starOfService,
    }
    let reviews = []
    
    for (const web of config.webs) {
        if (!web.activate)
            continue
        
        try {
            let providerReviews = await providers[web.provider](web.url)
            await providerReviews.forEach( review => reviews.push(review) )
        } catch (ex) {
            console.log("Ha habido un error: " + ex.message)
        }
    
    }
    
    await fs.writeFile('./reviews.json', JSON.stringify(reviews, null, 2), (err) => {
        if (err) {
            console.error(err)
            return
        }
    })
})()
