import userConfigData from '../../../config.js'
import { getAbsoluteFilePathWithLanguageSuffix, getTestConfig, writeWebContentToFile } from '../../helpers.js';
import { findReviewsTab, loadAllReviews, rejectCookies } from '../../../src/providers/google/google.js';
import { createLogFunction, onlyErrorLogFormatter, simpleLogFormatter } from '../../../src/logger/logger.js';
import { clickOrFail } from '../../../src/puppeteer-actions.js';

const browserLanguage = 'es-ES'
export const getPagePath = (relative: string) => 
    getAbsoluteFilePathWithLanguageSuffix(browserLanguage, new URL(import.meta.url))('./html/' + relative)
export const cookiesPageName = 'google-cookies-page'
export const profilePageName = 'google-profile-page'
export const initialReviewsPageName = 'google-initial-reviews-page'
export const allReviewsPageName = 'google-all-reviews-loaded-page'
export const cookiesFileUrl = getPagePath(cookiesPageName).toString()
export const profileFileUrl = getPagePath(profilePageName).toString()
export const initialReviewsFileUrl = getPagePath(initialReviewsPageName).toString()
export const allReviewsFileUrl = getPagePath(allReviewsPageName).toString()
export const config = getTestConfig('google', userConfigData, 30000)

export const logMem: string[] = []
export const log = createLogFunction(simpleLogFormatter, logMem)
export const onlyOnErrorLog = createLogFunction(onlyErrorLogFormatter, logMem)

export const getGoogleCodeContent = async () => {
    await writeWebContentToFile(config, getPagePath(cookiesPageName));
    await writeWebContentToFile(
        config,
        getPagePath(profilePageName),
        page => rejectCookies(log, config.web.getContentTimeout, config.web.specific.known.texts)(page))

    await writeWebContentToFile(
        config,
        getPagePath(initialReviewsPageName),
        page => rejectCookies(log, config.web.getContentTimeout, config.web.specific.known.texts)(page)
                    .then(findReviewsTab(log, config.web.specific.known.texts))
                    .then(clickOrFail(log, '')))
        
    await writeWebContentToFile(
        config,
        getPagePath(allReviewsPageName),
        page => rejectCookies(log, config.web.getContentTimeout, config.web.specific.known.texts)(page)
                    .then(loadAllReviews(log, config.web.getContentTimeout, config.web.specific.known)))
}

