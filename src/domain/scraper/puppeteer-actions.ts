import { Page, ElementHandle, Browser, KeyInput } from "puppeteer"
import { Log } from "../logger/logger.js"
export { Page, ElementHandle, Browser }

export type Reason = string
export type Tag = string
export type Selector = string
export type Milliseconds = number
export type Handle = ElementHandle | Page
export class ErrorWithHTML extends Error {
  constructor(public readonly html: string, message: string) {
    super(message)
  }
}

export const tap = <T>(f: (x: T) => Promise<any>) => async (x: T): Promise<T> => {
  await f(x)
  return x
}

export const goto = (url: string) => async (page: Page) => {
  await page.goto(url) 
  return page
}

export const pressKey = (log: Log, reason: Reason, key: KeyInput) => async (page: Page) =>
  log(reason, async () => {
  await page.keyboard.press(key)
  return page
})

export const waitForNetworkIdle = (timeout: Milliseconds) => async (page: Page) => {
  await page.waitForNetworkIdle({timeout})
  return page
}

export const evalOrElse = <T>(onFound: (x: Element) => T, onNotFound: () => T) => 
  async (handle: ElementHandle | null) => 
  handle === null ? onNotFound() : await handle.evaluate(onFound)

export const selectorByText = (cssSelector: Selector, rejectCookiesText: string) => 
  `${cssSelector ? cssSelector + ' ' : ''}::-p-text(${rejectCookiesText})`

export const click = (log: Log, reason: Reason) => 
  (handle: ElementHandle) =>
  log(`Click on element previously found ${reason}`, async () => {
    await handle.evaluate(h => (h as HTMLElement).click())
    return handle
})

export const clickIfPresent = (log: Log, reason: Reason) => 
  (handle: ElementHandle | null) =>
  log(`Click on element previously found if is present ${reason}`, async () => {
  if (handle !== null) {
    await handle.evaluate(h => (h as HTMLElement).click())
  }
  return handle
})

export const clickOrFail = (log: Log, reason: Reason) => 
  (handle: ElementHandle | null) => 
  log(`Click or fail on element previously found ${reason}`, async () => {
  if (handle === null) {
    throw new Error(`The element was expected to be found`)
  }
  await handle.evaluate(h => (h as HTMLElement).click())
  return handle
})

export const findOne = (log: Log, reason: Reason) => (selector: Selector) => (handle: Handle) => 
  log(`Find one element with selector ${selector} ${reason}`, async () => await handle.$(selector))

export const findOneOrFail = (log: Log, reason: Reason) => (selector: Selector) => (handle: Handle) => 
  log(`Find or fail one element with selector ${selector} ${reason}`, async () => {
    const found = await handle.$(selector)
    if (found === null) {
      let html: string = handle instanceof Page 
        ? await handle.content()
        : await handle.evaluate(el => el.outerHTML)
      throw new ErrorWithHTML(html, `The element was expected to be found`)
    }
    return found
})

export const findAll = (log: Log, reason: Reason) => (selector: Selector) => (page: Handle): Promise<ElementHandle[]> =>
  log(`Find all elements with selector ${selector} ${reason}`, async () => await page.$$(selector))

export type Predicate = (t: Handle) => Promise<boolean>
export const scrollUntil = (log: Log, timeout: Milliseconds) => (predicate: Predicate) => async (page: Page) => {
  let step = 1
  const action = async () => {
    await log('to do scroll step number ' + step++, async () => 
      pressKey(log, 'to go at the end of the content', 'End')(page)
        .then(waitForNetworkIdle(timeout)))
    if (!await predicate(page)) {
      await action()
    }
    return page
  }

  return await action()
}

export const getFirstClassOfElementWithSelector = (log: Log, reason: Reason, selector: Selector, handle: Handle) =>
  log(`Get the first class name of the element with selector ${selector} ${reason}`, async () => {
  const el = await handle.$(selector)
  if (!el) {
    throw new Error(`The element with selector ${selector} was not found`)
  }
  const tag = await el?.evaluate(el => el.nodeName.toLowerCase())
  const className = await el?.evaluate(el => el.classList[0])
  return tag + '.' + className
})

export const getFirstClassOfElementWithText = async (log: Log, reason: Reason, text: string, handle: Handle) => 
  getFirstClassOfElementWithSelector(log, reason, `::-p-text(${text})`, handle) 

export const consoleToConsole = (page: Page) => {
  page
    .on('console', message => console.log(`${message.type().substring(0, 3).toUpperCase()} ${message.text()}`))
    .on('pageerror', ({ message }) => console.log(message))
    .on('response', response => console.log(`${response.status()} ${response.url()}`))
    .on('requestfailed', request => console.log(`${request.failure()?.errorText} ${request.url()}`))
  return page
}
