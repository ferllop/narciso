# 'google' provider

The url of this provider should include an "hl" query parameter indicating the language for the profile UI. 
It must be equal to the language used in the known.texts configuration properties explained next.
For example, the known.texts are in spanish, so the url should have the parameter hl=es:
```
https://www.google.com/search?q=some+search+with+opinions#lrd=0x12a482b981b3f765:0x7ca8c3c9b3eadc99,1,,,?hl=es',
```

The specific configuration of this provider looks like this:
```
translatedContent: true,
known: {
  review: {
    authorName: 'Jane Foo',
    content: 'The experience was amazing',
  },
  texts: {
    rejectCookiesButtonText: 'Rechazar todo',
    viewMoreButtonText: 'Más',
    viewUntranslatedContentButtonText: 'Ver original',
    reviewsSectionButtonText: 'Reseñas',
    sortingButtonText: 'Ordenar',
    byNewestOptionButtonText: 'Más recientes',
    stars: 'estrellas',
  },
  reviewPositionFromOldestBeingZero: {
    knownReview: 3,
    withMoreButton: 8,
    withViewUntransalatedButton: 4,
  },
  oldestReviewAuthorName: 'Mr. T',
}
```
All the fields are mandatory.
- known.review: an object with the author name and the content of a known review. 
    Used to infer the selector for each review.
- known.texts.rejectCookiesButtonText: a string with the text of the clickable element to reject the cookies.
    Used to find that element and click on it to reject the cookies and go to the google profile page.
- known.texts.viewMoreButtonText: a string with the text of the clickable element to expand the content of a review.
    Used to find that element and click on it to get the entire content.
- known.texts.viewUntranslatedContentButtonText: a string with the text of the clickable element to view the content in its original language.
    Used to find that element and click on it to get the content in its original language.
- known.texts.reviewsSectionButtonText: a string with the text of the clickable element to go to the reviews section of the initial profile.
    Used to find that element and click on it to got to the reviews section.
- known.texts.sortingButtonText: a string with the text of the clickable element to open the menu to select a specific ordering of the reviews.
    Used to find that element and click on it to open the sorting menu.
- known.texts.byNewestOptionButtonText: a string with the text of the clickable element to select the ordeting option to order reviews by newest.
    Used to find that element and click on it to order the reviews by oldest and thus be able to know when to stop scrolling while loading all the reviews.
- known.texts.stars: a string with the word that represents the item that represents a one point rating.
    Used to find the rating value.
- known.reviewPositionFromOldestBeingZero: is an object with the positions of some specific reviews. The oldest reviews always is the number zero.
    -- knownReview: the position of the review specified in the known.review field.
        Used in testing.
    -- withMoreButton: the position of a review with a clickable element to expand the content of the review.
        Used in testing.
    -- withViewUntransalatedButton: the position of a review with a clickable element to view the content of the review in its original language.
        Used in testing.
- known.oldestReviewAuthorName: a string with the name of the author of the oldest review.
    Is used to know when to stop scrolling while loading all the reviews.
- translatedContent: google provide reviews with the content automatically translated to the browser language. Setting this config option to false will make show the content in its original language.
