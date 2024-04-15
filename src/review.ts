import { IgnoreReviewsConfig } from "./config-parser.js"

export type Review = {
	provider: string
	authorName: string
	rating: number
	content: string
}

export type ReviewValidator = (r: Review) => boolean
export const createReviewValidator = (ignoreConfig: IgnoreReviewsConfig) => (review: Review) => {
	const minimumRating = ignoreConfig.byMinimumRating
	const prohibitedNames = ignoreConfig.byAuthorName
	const minimumCharInContent = ignoreConfig.byMinimumCharactersCountInContent
	const {rating, authorName, content} = review
	return rating >= minimumRating
		&& content.length >= minimumCharInContent 
		&& !prohibitedNames.includes(authorName)
}
