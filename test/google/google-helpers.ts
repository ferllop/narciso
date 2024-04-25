import { writeWebContentToFile } from '../helpers.js';
import { findReviewsTab, loadAllReviews, rejectCookies } from '../../src/google.js';
import { Triad, doActions, doClickOrFailOn } from '../../src/puppeteer-actions.js';
import { config, getPagePath, cookiesPageName, profilePageName, log, initialReviewsPageName, allReviewsPageName } from './google.test.js';

export const getGoogleCodeContent = async () => {
    await writeWebContentToFile(config, getPagePath(cookiesPageName));
    await writeWebContentToFile(
        config,
        getPagePath(profilePageName),
        async (page) => {
            await rejectCookies(log, config.puppeteer.getContentTimeout)(config.web.known.rejectCookiesButtonText)(Triad.of(page));
        });
    await writeWebContentToFile(
        config,
        getPagePath(initialReviewsPageName),
        async (page) => {
            await doActions(log)('')(
                rejectCookies(log, config.puppeteer.getContentTimeout)(config.web.known.rejectCookiesButtonText),
                findReviewsTab(log, config.web.known),
                doClickOrFailOn(log)('')
            )(Triad.of(page));
        });
    await writeWebContentToFile(
        config,
        getPagePath(allReviewsPageName),
        async (page) => {
            await doActions(log)('')(
                rejectCookies(log, config.puppeteer.getContentTimeout)(config.web.known.rejectCookiesButtonText),
                loadAllReviews(log, config.puppeteer.getContentTimeout)(config.web.known)
            )(Triad.of(page));
        });
};

