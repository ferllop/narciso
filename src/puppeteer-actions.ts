import { Page, ElementHandle, Browser, NodeFor, KeyInput } from "puppeteer"
import { LogFunction } from "./logger.js"


export type Reason = string
export type Tag = string
export type Selector = string
export type Milliseconds = number
export type Handle = ElementHandle | Page
export { Page, Browser }

type Do<T> = (x: T) => Promise<T>
export const pipeAsync = 
        <T>(...fns: Do<T>[]) => async (x: T) => fns.reduce(async (y: T | Promise<T>, f: Do<T>) => f(await y), x)
export const composeAsync = 
        <T>(...fns: Do<T>[]) => async (x: T) => fns.reduceRight(async (y: T | Promise<T>, f: Do<T>) => f(await y), x)

type TriadA = {
        page: Page, 
        selector: Selector, 
        handle: ElementHandle | null
}
type TriadB = {
        page: Page, 
        selector: null, 
        handle: null
}
export type Triad = TriadA | TriadB
export const doActions = 
        (log: LogFunction) => 
        (reason: Reason) => 
        (...fns: Do<Triad>[]) => 
        (x: Triad) => 
        log(reason)(async () => await pipeAsync<Triad>(...fns)(x))

export const Triad = {
        of: (page: Page, selector: Selector | null = null, handle:ElementHandle | null = null): Triad => 
                selector === null
                        ? {page, selector, handle: null}
                        : {page, selector, handle}
}

type Finder = (s: Selector) => ConfiguredFinder 
type ConfiguredFinder = (f: Triad) => Promise<Triad>
export const doFindOne = (log: LogFunction) => (reason: Reason): Finder => 
        (selector: Selector) => ({page}: Triad) => 
        log(`Find one element with selector ${selector} ${reason}`)(async () => {
        const found = await page.$(selector)
        return {page, selector, handle: found}
})

export const doClickOrFailOn = (log: LogFunction) =>
        (reason: Reason) => 
        ({page, selector, handle}: Triad) => 
        log(`Click or fail on element with selector ${selector} ${reason}`)(async () => {
        if (handle === null) {
                throw new Error(`The selector ${selector} was expected not to be found or to be hidden but was found`)
        }
        await handle.click()
        return {page, selector, handle}
})

export const cleanHandle = async ({page}: Triad): Promise<Triad> => ({page, selector: null, handle: null})

export const doWaitForNetworkIdle = (timeout: Milliseconds) => async (triad: Triad): Promise<Triad> => {
    await triad.page.waitForNetworkIdle({timeout})
    return triad
}
export const tap = (fn: (...args: any[]) => any) => (x: any) => {
        fn(x)
        return x
}
export const trace = (...args: string[]) => (x: any) => {
        console.log(...args)
        return x
}
export type Predicate = (t: Triad) => Promise<boolean>
export const doScrollUntil = (log: LogFunction, timeout: Milliseconds) => (reason: Reason) => (predicate: Predicate) => (triad: Triad) => {
        let step = 1
        const action = async () => {
                const result = 
                        await doActions(log)('to do scroll step number ' + step++)(
                                doPressKey(log)('to go at the end of the content')('End'),
                                doWaitForNetworkIdle(timeout),
                        )(triad)
                if (!await predicate(result)) {
                        await action()
                }
                return triad
        }
        return log(`Scroll down until selector "${triad.selector}" is present ${reason}`)(action)
}

export const doPressKey = (log: LogFunction) => (reason: Reason) => (key: KeyInput) => async (triad: Triad) =>
        log(reason)(async () => {
                await triad.page.keyboard.press(key)
                return triad
        })


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

