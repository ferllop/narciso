import fs from 'node:fs'
import { Page, launch } from 'puppeteer'
import { PuppeteerConfig, WebConfig, parsePuppeteerConfig } from '../src/config-parser.js'
import { Milliseconds } from '../src/puppeteer-actions.js'

export type TestConfig = {
    puppeteer: PuppeteerConfig & { getContentTimeout: Milliseconds },
    web: Omit<WebConfig, 'provider' | 'activate'>
}

export const parseTestConfig = (testConfig: any): TestConfig => {
    return {
        puppeteer: {
            ...parsePuppeteerConfig(testConfig.puppeteer),
            getContentTimeout: testConfig.puppeteer?.getContentTimeout
        },
        web: {...testConfig.web}
    }
}

export const getAbsoluteFilePath = 
    (prefix: string, suffix: string, importMetaUrl: URL) => (relativeFilePath: string) => 
    new URL(prefix + relativeFilePath + suffix, importMetaUrl)

export const getAbsoluteFilePathWithLanguageSuffix = 
    (browserLanguage: string, importMetaUrl: URL) => getAbsoluteFilePath('', `-${browserLanguage}.html`, importMetaUrl)

export const writeWebContentToFile = 
    async (config: TestConfig, absoluteFilePath: URL, doBeforeGetContent: (page: Page) => Promise<void> = async () => {}) => {
    if (!fs.existsSync(absoluteFilePath)) {
        const browser = await launch(config.puppeteer)
        const page = await browser.newPage()
        await page.goto(config.web.url)
        await doBeforeGetContent(page)
        await page.waitForNetworkIdle({timeout: config.puppeteer.getContentTimeout})
        const content = await page.content()
        fs.writeFileSync(absoluteFilePath, content)
        await page.close()
        await browser.close()
    }
}

export const avoidExternalRequests = async (page: Page) => {
    await page.setRequestInterception(true)
    page.on('request', request => {
        if (request.isInterceptResolutionHandled()) {
            return
        }

        if (page.url() === request.url() || page.url() === 'about:blank') {
            request.continue()
            return
        }

        request.respond({
            status: 200,
            contentType: 'text/plain',
            body: 'Simulate something was found!',
        })
    })
}

