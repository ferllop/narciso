declare module "../../../config/web-config.js" {
	interface SpecificsMap {
		google: GoogleSpecificConfig
	}	
}

export type GoogleSpecificConfig = {
	known: GoogleKnownConfig
	translatedContent: boolean
}

export type GoogleKnownConfig = {
	review: GoogleKnownReview
	texts: GoogleKnownTexts
	oldestReviewAuthorName: string
	reviewPositionFromOldestBeingZero: {
		knownReview: number
		withMoreButton: number
		withViewUntransalatedButton: number
	}
}

export type GoogleKnownReview = {
	authorName: string 
	content: string
}

export type GoogleKnownTexts = {
	rejectCookiesButtonText: string
	viewMoreButtonText: string
	viewUntranslatedContentButtonText: string
	reviewsSectionButtonText: string
	sortingButtonText: string
	byNewestOptionButtonText: string
	stars: string
}
