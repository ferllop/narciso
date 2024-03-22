import fs from 'node:fs'
import { Browser, Page } from 'puppeteer'

export const getAbsoluteFilePath = (prefix: string, suffix: string) => 
    (relativeFilePath: string) => new URL(prefix + relativeFilePath + suffix, import.meta.url)

export const writeWebContentToFile = async (browser: Browser, url: string, absoluteFilePath: URL, doBeforeGetContent: (page: Page) => Promise<void> = async () => {}) => {
    if (!fs.existsSync(absoluteFilePath)) {
        const page = await browser.newPage()
        await page.goto(url)
        await doBeforeGetContent(page)
        const milisecondsOfNetworkIdle = 2000
        await page.waitForNetworkIdle({timeout: milisecondsOfNetworkIdle})
        const content = await page.content()
        fs.writeFileSync(absoluteFilePath, content)
        await page.close()
    }
}

