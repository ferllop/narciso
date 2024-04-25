import fs from 'node:fs'
import { Page, launch } from 'puppeteer'
import { PuppeteerConfig, WebConfig, parsePuppeteerConfig } from '../src/config-parser.js'
import { Milliseconds } from '../src/puppeteer-actions.js'

export type TestConfig = {
    puppeteer: PuppeteerConfig & { getContentTimeout: Milliseconds },
    web: Omit<WebConfig, 'provider' | 'activate'>
}

export const doNothing = () => {}
export const doNothingAsync = async () => {}

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
        console.log(`\n# The html file ${absoluteFilePath} is not found. Generating with a headless browser. Please be patinent...`)
        const browser = await launch(config.puppeteer)
        const page = await browser.newPage()
        await page.goto(config.web.url)
        await doBeforeGetContent(page)
        await page.waitForNetworkIdle({timeout: config.puppeteer.getContentTimeout})
        const content = await page.content()
        fs.writeFileSync(absoluteFilePath, content)
        await page.close()
        await browser.close()
        console.log(`# Html file ${absoluteFilePath} has been generated. You can generate again by deleting it.\n`)
    }
}

export const permitRequestsTo = async (page: Page, ...urls: string[]) => {
    await page.setRequestInterception(true)
    page.on('request', request => {
        if (request.isInterceptResolutionHandled()) {
            return
        }

        if (page.url() === request.url() || page.url() === 'about:blank' || urls.includes(page.url())) {
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

