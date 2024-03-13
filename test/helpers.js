import fs from 'node:fs'

export const getAbsoluteFilePath = (prefix, suffix) => 
    relativeFilePath => new URL(prefix + relativeFilePath + suffix, import.meta.url)

export const writeWebContentToFile = async (browser, url, absoluteFilePath, doBeforeGetContent = async () => {}) => {
    if (!fs.existsSync(absoluteFilePath)) {
        const page = await browser.newPage()
        await page.goto(url)
        await doBeforeGetContent(page)
        const milisecondsOfNetworkIdle = 2000
        await page.waitForNetworkIdle(milisecondsOfNetworkIdle)
        const content = await page.content()
        fs.writeFileSync(absoluteFilePath, content)
        await page.close()
    }
}

