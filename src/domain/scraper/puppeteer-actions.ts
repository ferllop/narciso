import { Page, ElementHandle, Browser, KeyInput } from "puppeteer"
import { Log } from "../logger/logger.js"
export { Page, ElementHandle, Browser }

export type ActionDescription = string
export type Tag = string
export type Selector = string
export type Milliseconds = number
export type Handle = ElementHandle | Page

export class ErrorWithHTML extends Error {
  constructor(public readonly html: string, message: string) {
    super(message)
  }
}

export const goto = (url: string) => async (page: Page) => {
  await page.goto(url) 
  return page
}

export const pressKey = (log: Log, actionDescription: ActionDescription, key: KeyInput) => async (page: Page) =>
  log(actionDescription, async () => {
    await page.keyboard.press(key)
    return page
})

export const waitForNetworkIdle = (log: Log, timeout: Milliseconds) => async (page: Page) => 
  log('wait for network idle', async () => {
    await page.waitForNetworkIdle({timeout})
    return page
})

export const waitForNavigation = (log: Log, timeout: Milliseconds) => async (page: Page) =>
  log('wait for navigation', async () => {
    await page.waitForNavigation({timeout})
    return page
})

export const waitForSelector = (log: Log, selector: Selector, timeout: Milliseconds) => async (handle: Handle) => 
  log('wait for selector ' + selector, async () => {
    await handle.waitForSelector(selector, {timeout})
    return handle
})

export const evalOrElse = <T>(onFound: (x: Element) => T, onNotFound: () => T) => 
  async (handle: ElementHandle | null) => 
  handle === null ? onNotFound() : await handle.evaluate(onFound)

export const selectorByText = (cssSelector: Selector, text: string) => 
  `${cssSelector ? cssSelector + ' ' : ''}::-p-text(${text})`

export const click = (log: Log, actionDescription: ActionDescription) => 
  (handle: ElementHandle) =>
  log(`Click on element previously found ${actionDescription}`, async () => {
    await handle.evaluate(h => (h as HTMLElement).click())
    return handle
})

export const clickIfPresent = (log: Log, actionDescription: ActionDescription) => 
  (handle: ElementHandle | null) =>
  log(`Click on element previously found if is present ${actionDescription}`, async () => {
  if (handle !== null) {
    await handle.evaluate(h => (h as HTMLElement).click())
  }
  return handle
})

export const ifPresent = <T extends ElementHandle>(log: Log, action: (handle: T) => Promise<Handle>) =>
  (handle: T | null) =>
  log(`If present`, async () => 
      handle === null 
        ? null 
        : await action(handle))

export const findOne = (log: Log, actionDescription: ActionDescription) => (selector: Selector) => (handle: Handle) => 
  log(`Find one element with selector ${selector} ${actionDescription}`, async () => await handle.$(selector))

export const findOneOrFail = (log: Log, actionDescription: ActionDescription) => (selector: Selector) => (handle: Handle) => 
  log(`Find or fail one element with selector ${selector} ${actionDescription}`, async () => {
    const found = await handle.$(selector)
    if (found === null) {
      let html: string = handle instanceof Page 
        ? await handle.content()
        : await handle.evaluate(el => el.outerHTML)
      throw new ErrorWithHTML(html, `The element with selector ${selector} was not found`)
    }
    return found
})

export const findAll = (log: Log, actionDescription: ActionDescription) => (selector: Selector) => (page: Handle): Promise<ElementHandle[]> =>
  log(`Find all elements with selector ${selector} ${actionDescription}`, async () => await page.$$(selector))

export type Predicate = (t: Handle) => Promise<boolean>
export const scrollUntil = (log: Log, timeout: Milliseconds) => (predicate: Predicate) => async (page: Page) => {
  const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))
  const action = async (step: number): Promise<Page> => {
    await log('to do scroll step number ' + step, async () => { 
      await pressKey(log, 'to go at the end of the content', 'End')(page)
      await sleep(1000)
    })
    if (await predicate(page)) {
      return page
    }
    if (step > 100 || step > timeout) {
      throw new Error(`Too much steps. Step ${timeout} has been reached and its limit is the smallest of 100 or ${timeout}`)
    }
    return await action(step + 1)
  }

  return await action(1)
}

export const getFirstClassOfElementWithSelector = (log: Log, actionDescription: ActionDescription, selector: Selector, handle: Handle) =>
  log(`Get the first class name of the element with selector ${selector} ${actionDescription}`, async () => {
  const el = await handle.$(selector)
  if (!el) {
    throw new Error(`The element with selector ${selector} was not found`)
  }
  const tag = await el?.evaluate(el => el.nodeName.toLowerCase())
  const className = await el?.evaluate(el => el.classList[0])
  return tag + '.' + className
})

export const getFirstClassOfElementWithText = async (log: Log, actionDescription: ActionDescription, text: string, handle: Handle) => 
  getFirstClassOfElementWithSelector(log, actionDescription, `::-p-text(${text})`, handle) 

export const consoleToConsole = (page: Page) => {
  page
    .on('console', message => console.log(`${message.type().substring(0, 3).toUpperCase()} ${message.text()}`))
    .on('pageerror', ({ message }) => console.log(message))
    .on('response', response => console.log(`${response.status()} ${response.url()}`))
    .on('requestfailed', request => console.log(`${request.failure()?.errorText} ${request.url()}`))
  return page
}
