import { Page, ElementHandle, Browser, KeyInput } from "puppeteer"
import { LogFunction } from "./logger.js"
export { Page, ElementHandle, Browser }

export type Reason = string
export type Tag = string
export type Selector = string
export type Milliseconds = number
export type Handle = ElementHandle | Page

export const goto = (url: string) => async (page: Page) => {
  await page.goto(url) 
  return page
}

export const pressKey = (log: LogFunction) => (reason: Reason, key: KeyInput) => async (page: Page) =>
  log(reason)(async () => {
  await page.keyboard.press(key)
  return page
})

export const waitForNetworkIdle = (timeout: Milliseconds, page: Page) => async () => {
  await page.waitForNetworkIdle({timeout})
  return page
}

export const evalOrElse = <T>(onFound: (x: Element) => T, onNotFound: () => T) => 
  async (handle: ElementHandle | null) => 
  handle === null ? onNotFound() : await handle.evaluate(onFound)

export const selectorByText = (cssSelector: Selector, rejectCookiesText: string) => `${cssSelector} ::-p-text(${rejectCookiesText})`

export const clickIfPresent = (log: LogFunction) => 
  (reason: Reason) => 
  (handle: ElementHandle | null) =>
  log(`Click on element previously found if is present ${reason}`)(async () => {
  if (handle !== null) {
    await handle.evaluate(h => (h as HTMLElement).click())
  }
  return handle
})

export const clickOrFail = (log: LogFunction) =>
  (reason: Reason) => 
  (handle: ElementHandle | null) => 
  log(`Click or fail on element previously found ${reason}`)(async () => {
  if (handle === null) {
    throw new Error(`The selector of the element was expected not to be found or to be hidden but was found`)
  }
  await handle.evaluate(h => (h as HTMLElement).click())
  return handle
})

export const findOne = (log: LogFunction) => (reason: Reason) => (selector: Selector) => (handle: Handle) => 
  log(`Find one element with selector ${selector} ${reason}`)
(async () => await handle.$(selector))

export const findAll = (log: LogFunction) => (reason: Reason) => (selector: Selector) => (page: Handle): Promise<ElementHandle[]> =>
  log(`Find all elements with selector ${selector} ${reason}`)(async () => {
  return await page.$$(selector)
})

export type Predicate = (t: Handle) => Promise<boolean>
export const scrollUntil = (log: LogFunction, timeout: Milliseconds) => (predicate: Predicate) => async (page: Page) => {
  let step = 1
  const action = async () => {
    const result = await log('to do scroll step number ' + step++)(async () => 
      pressKey(log)('to go at the end of the content', 'End')(page)
        .then(waitForNetworkIdle(timeout, page)))
      if (!await predicate(result)) {
        await action()
      }
      return page
    }
  return await action()
}

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
