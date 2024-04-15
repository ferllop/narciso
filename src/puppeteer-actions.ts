import { Page, ElementHandle, Browser, NodeFor } from "puppeteer"
import { LogFunction } from "./logger.js"

export type Reason = string
export type Tag = string
export type Selector = string
export type Milliseconds = number
export type Handle = ElementHandle | Page
export { Page, Browser }

export const findOne = (log: LogFunction) => 
        async (reason: Reason, selector: Selector, handle: Handle) => 
        log(`Find one element with selector ${selector} ${reason}`)(async () => 
        await handle.$(selector))

export const clickOrFail = (log: LogFunction, timeout: Milliseconds) => 
        async (reason: Reason, selector: Selector, handle: Handle) => 
        log(`Mandatory click on selector ${selector} ${reason}`)(async () => {
        const element = await handle.waitForSelector(selector, { timeout })
        if (element === null) {
                throw new Error(`The selector ${selector} was expected not to be found or to be hidden but was found`)
        }
        await element.click()
        return element
})

export const scrollDownUntilTextIsLoaded = (log: LogFunction, timeout: Milliseconds) => 
        async (reason: Reason, text: string, page: Page) => {
        const action = async () => {
                await page.keyboard.press('End')
                await page.waitForNetworkIdle({timeout})
                const element = await findOne(log)(reason, `::-p-text(${text})`, page)
                if (!element) {
                        await action()
                }
        }
        return log(`Scroll down until text ${text} is present ${reason}`)(action)
}

export const findAll = (log: LogFunction) => 
        async (reason: Reason, selector: Selector, handle: Handle) =>
        log(`Find all elements with selector ${selector} ${reason}`)(async () => await handle.$$(selector))

export const findOneAndEval = (log: LogFunction) => 
        async <T>(reason: Reason, selector: Selector, onFound: (x: NodeFor<Selector>) => T, onNotFound: () => T, handle: Handle) =>
        log(`Find selector and eval ${selector} ${reason}`)(async () => {
                const element = await handle.$(selector)
                return element 
                        ? await element.evaluate(onFound)
                        : onNotFound()
        })

export const findAllAndExecute = (log: LogFunction) => 
        async <OUT>(reason: Reason, selector: Selector, onEach: (x: ElementHandle) => Promise<OUT>, handle: Handle) =>
        log(`Find all with selector ${selector} and execute ${reason}`)(async () => {
        const elements = await handle.$$(selector)
        return await Promise.all(elements.map(onEach))
})

export const clickIfPresent = (log: LogFunction) => 
        async (reason: Reason, selector: Selector, handle: Handle) =>
        log(`Click on selector ${selector} if is present ${reason}`)(async () => {
        const element = await handle.$(selector)
        if (element) {
                await element.evaluate(b => b.click())
        }
        return element
})

export const clickOrFailOnTagContainingText = (log: LogFunction, timeout: Milliseconds) =>
        async (reason: Reason, tag: Tag, text: string, handle: Handle) =>
        clickOrFail(log, timeout)(reason, `${tag} ::-p-text(${text})`, handle)

export const getFirstClassOfElementWithText = (log: LogFunction) => 
        async (reason: Reason, text: string, handle: Handle) => 
        log(`Get the class name of the element with text ${text} ${reason}`)(async () => {
        const el = await handle.$(`::-p-text(${text})`)
        const tag = await el?.evaluate(el => el.nodeName.toLowerCase())
        const className = await el?.evaluate(el => el.classList[0])
        return tag + '.' + className
})

export const getFirstClassOfElementWithSelector = (log: LogFunction) =>
        async (reason: Reason, selector: Selector, handle: Handle) =>
        log(`Get the first class name of the element with selector ${selector} ${reason}`)(async () => {
        const el = await handle.$(selector)
        const tag = await el?.evaluate(el => el.nodeName.toLowerCase())
        const className = await el?.evaluate(el => el.classList[0])
        return tag + '.' + className
})

