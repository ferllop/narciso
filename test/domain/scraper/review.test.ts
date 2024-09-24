import { describe, it } from 'node:test'
import { IgnoreReviewsConfig } from '../../../src/domain/config/config.js'
import { assertNotOk } from '../../custom-asserts.js'
import { Review, createReviewValidator } from '../../../src/domain/scraper/review.js'

const reviewTemplate: Review = {
    provider: '',
    authorName: '',
    rating: 0,
    content: ''
}

const ignoreReviewsTemplate: IgnoreReviewsConfig = {
    byAuthorName: [],
    byMinimumRating: 0,
    byMinimumCharactersCountInContent: 0
}

describe('Given a review', () => {
    it('when it has a name which is invalid then is not validated by the review validator', async () => {
        const isValid = createReviewValidator({...ignoreReviewsTemplate, byAuthorName: ['John']})
        assertNotOk(isValid({...reviewTemplate, authorName: 'John'}))
    })
})
