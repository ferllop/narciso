import { Page, ElementHandle, Browser, NodeFor, KeyInput } from "puppeteer"
import { LogFunction } from "./logger.js"
export { Page, Browser }

export type Reason = string
export type Tag = string
export type Selector = string
export type Milliseconds = number
export type Handle = ElementHandle | Page

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
export const Triad = {
        of: (page: Page, selector: Selector | null = null, handle:ElementHandle | null = null): Triad => 
                selector === null
                        ? {page, selector, handle: null}
                        : {page, selector, handle},
        getOrElse: <T>(onFound: (x: NodeFor<Selector>) => T, onNotFound: () => T) => async ({handle}: Triad) => 
                handle === null ? onNotFound() : await handle.evaluate(onFound),

        withHandle: (selector: Selector, handle: ElementHandle) => ({page}: TriadA): Triad => ({page, selector, handle})
}

export const selectorByText = (cssSelector: Selector, rejectCookiesText: string) => `${cssSelector} ::-p-text(${rejectCookiesText})`

export const doActions = 
        (log: LogFunction) => 
        (reason: Reason) => 
        (...fns: Do<Triad>[]) => 
        (x: Triad) => 
        log(reason)(async () => await pipeAsync<Triad>(...fns)(x))

export const doFindOne = (log: LogFunction) => (reason: Reason) => (selector: Selector) => ({page}: Triad) => 
        log(`Find one element with selector ${selector} ${reason}`)(async () => {
        const found = await page.$(selector)
        return {page, selector, handle: found}
})

export const doFindAll = (log: LogFunction) => (reason: Reason) => (selector: Selector) => ({page}: Triad): Promise<Triad[]> =>
        log(`Find all elements with selector ${selector} ${reason}`)(async () => {
        const findings = await page.$$(selector)
        return findings.map(f => ({page, selector, handle: f}))
})

export const doFindOneInHandle = (log: LogFunction) => (reason: Reason) => (selector: Selector) => ({page, handle}: Triad) => 
        log(`Find one element with selector ${selector} ${reason}`)(async () => {
        if (handle === null) {
                return {page, selector, handle}
        }
        const found = await handle.$(selector)
        return {page, selector, handle: found}
})

export const doClickIfPresent = (log: LogFunction) => 
        (reason: Reason) => 
        (triad: Triad) =>
        log(`Click on selector ${triad.selector} if is present ${reason}`)(async () => {
        if (triad.handle !== null) {
                await triad.handle.evaluate(h => (h as HTMLElement).click())
        }
        return triad
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

export const doWaitForNetworkIdle = (timeout: Milliseconds) => async (triad: Triad): Promise<Triad> => {
    await triad.page.waitForNetworkIdle({timeout})
    return triad
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

