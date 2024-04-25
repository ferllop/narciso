import testConfigData from './google.config.json' assert {type: 'json'}
import { TestConfig, getAbsoluteFilePathWithLanguageSuffix, parseTestConfig, writeWebContentToFile } from '../helpers.js';
import { findReviewsTab, loadAllReviews, rejectCookies } from '../../src/google.js';
import { Triad, doActions, doClickOrFailOn } from '../../src/puppeteer-actions.js';
import { createLog, noLogLogger } from '../../src/logger.js';

const browserLanguage = 'es-ES'
export const getPagePath = getAbsoluteFilePathWithLanguageSuffix(browserLanguage, new URL(import.meta.url))
export const cookiesPageName = 'google-cookies-page'
export const profilePageName = 'google-profile-page'
export const initialReviewsPageName = 'google-initial-reviews-page'
export const allReviewsPageName = 'google-all-reviews-loaded-page'
export const cookiesFileUrl = getPagePath(cookiesPageName).toString()
export const profileFileUrl = getPagePath(profilePageName).toString()
export const initialReviewsFileUrl = getPagePath(initialReviewsPageName).toString()
export const allReviewsFileUrl = getPagePath(allReviewsPageName).toString()
export const config: TestConfig = parseTestConfig(testConfigData)
export const log = createLog(noLogLogger)
export const onLoopLog = createLog(noLogLogger)

export const getGoogleCodeContent = async () => {
    await writeWebContentToFile(config, getPagePath(cookiesPageName));
    await writeWebContentToFile(
        config,
        getPagePath(profilePageName),
        async (page) => {
            await rejectCookies(log, config.puppeteer.getContentTimeout)(config.web.known.texts)(Triad.of(page));
        });
    await writeWebContentToFile(
        config,
        getPagePath(initialReviewsPageName),
        async (page) => {
            await doActions(log)('')(
                rejectCookies(log, config.puppeteer.getContentTimeout)(config.web.known.texts),
                findReviewsTab(log, config.web.known.texts),
                doClickOrFailOn(log)('')
            )(Triad.of(page));
        });
    await writeWebContentToFile(
        config,
        getPagePath(allReviewsPageName),
        async (page) => {
            await doActions(log)('')(
                rejectCookies(log, config.puppeteer.getContentTimeout)(config.web.known.texts),
                loadAllReviews(log, config.puppeteer.getContentTimeout)(config.web.known)
            )(Triad.of(page));
        });
};

