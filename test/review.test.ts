import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Review, createReviewValidator } from '../src/review.js'
import { IgnoreReviewsConfig } from '../src/config-parser.js'

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

const assertNotOk = (actual: boolean, message = '') => assert.equal(actual, false, message)

describe('Given a review', () => {
    it('when it has a name which is invalid then is not validated by the review validator', async () => {
        const isValid = createReviewValidator({...ignoreReviewsTemplate, byAuthorName: ['John']})
        assertNotOk(isValid({...reviewTemplate, authorName: 'John'}))
    })
})
