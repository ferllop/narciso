import puppeteer from "puppeteer"

/**
* @typedef {(message: string) => void } log
*/

/**
* @typedef {{logStart: log, logFinish: log, logError: log}} Logger
*/

/**
* @type number Milliseconds
*/

const launchBrowser = config => async () => await puppeteer.launch(config.puppeteer)
const pressKey = async (handle, key) => await handle.keyboard.press(key)
const waitForNetworkIdle = config => async handle => await handle.waitForNetworkIdle(config.puppeteer.timeout)
const goto = async (page, url) => page.goto(url)

export const execute = (/** @type logger */ logger) => async (actionName, action) => {
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
	} catch (e) {
		logger.logError(`Error in action "${actionName.trim()}": ${e.message}`)
		throw e
	}
}

const findOne = (/** @type logger */ logger) => async (reason, handle, selector) => {
	const action = async () => await handle.$(selector)
	const message = `FIND_ONE_ELEMENT_WITH_SELECTOR ${selector} ${reason}`
	return execute(logger)(message, action)
}

const findAll = (/** @type logger */ logger) => async (reason, handle, selector) => {
	const action = async () => await handle.$$(selector)
	const message = `FIND_ALL_ELEMENTS_WITH_SELECTOR ${selector} ${reason}`
	return execute(logger)(message, action)
}

const findOneAndEval = (/** @type logger */ logger) => async (reason, handle, selector, onFound, onNotFound) => {
	const action = async () => {
		const element = await handle.$(selector)
		return element 
			? await element.evaluate(onFound)
			: onNotFound()
	}
	const message = `FIND_SELECTOR_AND_EVAL ${selector} ${reason}`
	return execute(logger)(message, action)
}

export const clickOrFail = (/** @type logger */ logger, /** @type Milliseconds */ timeout) => 
	async (/** @type string */ reason, handle, selector) => {
	const action = async () => {
		const element = await handle.waitForSelector(selector, {timeout})
		await element.click()
		return element
	}
	const message = `MANDATORY_CLICK_ON_SELECTOR ${selector} ${reason}`
	return execute(logger)(message, action)
}

export const clickIfPresent = (/** @type logger */ logger) => async (reason, handle, selector) => {
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
	(/** @type logger */ logger, /** @type Milliseconds */ timeout) => 
		async (reason, JSHandle, tag, text) => 
			clickOrFail(logger, timeout)(reason, JSHandle, `${tag} ::-p-text(${text})`)

export const getFirstClassOfElementWithText = (/** @type logger */ logger) => async (name, handle) => {
	const action = async () => {
		const el = await handle.$(`::-p-text(${name})`)
		const tag = await el.evaluate(el => el.nodeName.toLowerCase())
		const className = await el.evaluate(el => el.classList[0])
		return tag + '.' + className
	}
	return execute(logger)(`GET_CLASS_OF_ELEMENT_WITH_TEXT ${name}`, action)
}

export const getFirstClassOfElementWithSelector = (/** @type logger */ logger) => async (selector, handle) => {
	const action = async () => {
		const el = await handle.$(selector)
		const tag = await el.evaluate(el => el.nodeName.toLowerCase())
		const className = await el.evaluate(el => el.classList[0])
		return tag + '.' + className
	}
	return execute(logger)(`GET_CLASS_OF_ELEMENT_WITH_SELECTOR ${selector}`, action)
}

const modifyLogger = (config, logger) => loggerModifications => Bot(config, {...logger, ...loggerModifications})

export const Bot = (config, /** @type Logger */ logger) => {
	return {
		launchBrowser: launchBrowser(config),
		goto,
		pressKey,
		waitForNetworkIdle: waitForNetworkIdle(config),
		modifyLogger: modifyLogger(config, logger),
		execute: execute(logger),
		findOne: findOne(logger),
		findAll: findAll(logger),
		findOneAndEval: findOneAndEval(logger),
		clickOrFail: clickOrFail(logger, config.puppeteer.timeout),
		clickIfPresent: clickIfPresent(logger),
		clickOrFailOnTagContainingText: clickOrFailOnTagContainingText(logger, config.puppeteer.timeout),
		getFirstClassOfElementWithText: getFirstClassOfElementWithText(logger),
		getFirstClassOfElementWithSelector: getFirstClassOfElementWithSelector(logger),
	}
}
