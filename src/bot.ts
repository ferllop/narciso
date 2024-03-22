import puppeteer, { ElementHandle, Page } from "puppeteer"
import { Config } from "./config-parser.js"

type Log = (message: string) => void

export type Logger = {logStart: Log, logFinish: Log, logError: Log}

export type Browser = puppeteer.Browser

export interface Bot {
	launchBrowser: () => Promise<Browser>,
	goto: (p: Page, url: string) => Promise<puppeteer.HTTPResponse | null>,
	pressKey: (p: Page, k: Key) => Promise<void>,
	waitForNetworkIdle: (p: Page) => Promise<void>,
	modifyLogger: (l: Partial<Logger>) => Bot,
	execute: <T>(r: string, a: Action<T>) => Promise<T>,
	scrollDownUntilTextIsLoaded: (r: Reason, p: Page, txt: string) => Promise<void>,
	findOne: (r: Reason, h: Handle, s: Selector) => Promise<puppeteer.ElementHandle | null>,
	findAll: (r: Reason, h: Handle, s: Selector) => Promise<Awaited<puppeteer.ElementHandle>[]>,
	findOneAndEval: <T>(r: Reason, h: Handle, s: Selector, onFound: (el: any) => T, onNotFound: () => T) => Promise<T>,
	findAllAndExecute: <T>(r: Reason, h: Handle, s: Selector, onEach: (el: puppeteer.ElementHandle) => T) => Promise<T[]>,
	clickOrFail: (r: Reason, h: Handle, s: Selector) => Promise<puppeteer.ElementHandle>,
	clickIfPresent: (r: Reason, h: Handle, s: Selector) => Promise<puppeteer.ElementHandle | null>,
	clickOrFailOnTagContainingText: (r: Reason, h: Handle, tag: string, txt: string) => Promise<puppeteer.ElementHandle>,
	getFirstClassOfElementWithText: (r: Reason, p: Page, txt: string) => Promise<string>,
	getFirstClassOfElementWithSelector: (r: Reason, p: Page, s: Selector) => Promise<string>,
}

type Milliseconds = number

type Action<T> = () => Promise<T>
type ActionName = string
export type Handle = ElementHandle | Page
export type Reason = string
export type Selector = string
type Tag = string
type Key = puppeteer.KeyInput

const launchBrowser = (config: Config) => (): Promise<Browser> => puppeteer.launch(config.puppeteer)
const pressKey = async (page: Page, key: Key) => await page.keyboard.press(key)
const waitForNetworkIdle = (config: Config) => async (page: Page) => await page.waitForNetworkIdle({timeout: config.puppeteer.timeout})
const goto = async (page: Page, url: string) => page.goto(url)

export const execute = (logger: Logger) => async <T>(actionName: ActionName, action: Action<T>) => {
	logger.logStart(`Start "${actionName.trim()}" started`)
	try {
		const result = await action()
		logger.logFinish(
			`Finish "${actionName.trim()}" succesfully` +
			(['string', 'number'].includes(typeof result) 
				? ' with result ' + result
				: '')
		)
		return result
	} catch (e: any) {
		logger.logError(`Error in action "${actionName.trim()}": ${e.message}`)
		throw e
	}
}

const findOne = (logger: Logger) => async (reason: Reason, handle: Handle, selector: Selector) => {
	const action = async () => await handle.$(selector)
	const message = `FIND_ONE_ELEMENT_WITH_SELECTOR ${selector} ${reason}`
	return execute(logger)(message, action)
}

const findAll = (logger: Logger) => async (reason: Reason, handle: Handle, selector: Selector) => {
	const action = async () => await handle.$$(selector)
	const message = `FIND_ALL_ELEMENTS_WITH_SELECTOR ${selector} ${reason}`
	return execute(logger)(message, action)
}

const findOneAndEval = (logger: Logger) => async <IN, OUT>(reason: Reason, handle: Handle, selector: Selector, onFound: (x: IN) => OUT, onNotFound: () => OUT) => {
	const action = async () => {
		const element = await handle.$(selector)
		return element 
			? await element.evaluate(onFound)
			: onNotFound()
	}
	const message = `FIND_SELECTOR_AND_EVAL ${selector} ${reason}`
	return execute(logger)(message, action)
}

export const findAllAndExecute = (logger: Logger) => async <OUT>(reason: Reason, handle: Handle, selector: Selector, onEach: (x: puppeteer.ElementHandle) => OUT) => {
	const action = async () => {
		const elements = await handle.$$(selector)
		return await Promise.all(elements.map(onEach))
	}
	const message = `FIND_ALL_SELECTOR_AND_EXECUTE ${selector} ${reason}`
	return execute(logger)(message, action)
}
export const clickOrFail = (logger: Logger, timeout: Milliseconds) => 
	async (reason: Reason, handle: Handle, selector: Selector) => {
	const action = async () => {
		const element = await handle.waitForSelector(selector, {timeout})
		if (element === null) {
			throw new Error(`The selector ${selector} was expected not to be found or to be hidden but was found`)
		}
		await element.click()
		return element
	}
	const message = `MANDATORY_CLICK_ON_SELECTOR ${selector} ${reason}`
	return execute(logger)(message, action)
}

export const clickIfPresent = (logger: Logger) => async (reason: Reason, handle: Handle, selector: Selector) => {
	const action = async () => {
		const element = await handle.$(selector)
		if (element) {
			await element.evaluate(b => b.click())
		}
		return element
	}
	const message = `CLICK_ON_SELECTOR_IF_PRESENT ${selector} ${reason}`
	return execute(logger)(message, action)
}

export const clickOrFailOnTagContainingText = 
	(logger: Logger, timeout: Milliseconds) => 
		async (reason: Reason, JSHandle: Handle, tag: Tag, text: string) => 
			clickOrFail(logger, timeout)(reason, JSHandle, `${tag} ::-p-text(${text})`)

export const scrollDownUntilTextIsLoaded = (logger: Logger, config: Config) => async (reason: Reason, page: Page, text: string) => {
	const action = async () => {
		await pressKey(page, 'End')
		await waitForNetworkIdle(config)(page)
		const element = await findOne(logger)(reason, page, `::-p-text(${text})`)
		if (!element) {
			await action()
		}
	}
	const message = `SCROLL_DOWN_UNTIL_TEXT_IS_PRESENT ${text} ${reason}`
	return execute(logger)(message, action)
}

export const getFirstClassOfElementWithText = (logger: Logger) => async (reason: Reason, handle: Handle, text: string,) => {
	const action = async () => {
		const el = await handle.$(`::-p-text(${text})`)
		const tag = await el?.evaluate(el => el.nodeName.toLowerCase())
		const className = await el?.evaluate(el => el.classList[0])
		return tag + '.' + className
	}
	return execute(logger)(`GET_CLASS_OF_ELEMENT_WITH_TEXT ${text} ${reason}`, action)
}

export const getFirstClassOfElementWithSelector = (logger: Logger) => async (reason: Reason, handle: Handle, selector: Selector) => {
	const action = async () => {
		const el = await handle.$(selector)
		const tag = await el?.evaluate(el => el.nodeName.toLowerCase())
		const className = await el?.evaluate(el => el.classList[0])
		return tag + '.' + className
	}
	return execute(logger)(`GET_CLASS_OF_ELEMENT_WITH_SELECTOR ${selector} ${reason}`, action)
}

const modifyLogger = (logger: Logger, config: Config) => (loggerModifications: Partial<Logger>) => 
	Bot({...logger, ...loggerModifications}, config)

export const Bot = (logger: Logger, config: Config): Bot => {
	return {
		launchBrowser: launchBrowser(config),
		goto,
		pressKey,
		waitForNetworkIdle: waitForNetworkIdle(config),
		modifyLogger: modifyLogger(logger, config),
		execute: execute(logger),
		scrollDownUntilTextIsLoaded: scrollDownUntilTextIsLoaded(logger, config),
		findOne: findOne(logger),
		findAll: findAll(logger),
		findOneAndEval: findOneAndEval(logger),
		findAllAndExecute: findAllAndExecute(logger),
		clickOrFail: clickOrFail(logger, config.puppeteer.timeout),
		clickIfPresent: clickIfPresent(logger),
		clickOrFailOnTagContainingText: clickOrFailOnTagContainingText(logger, config.puppeteer.timeout),
		getFirstClassOfElementWithText: getFirstClassOfElementWithText(logger),
		getFirstClassOfElementWithSelector: getFirstClassOfElementWithSelector(logger),
	}
}
