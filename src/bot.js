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
const findOne = async (handle, selector) => handle.$(selector)
const findAll = async (handle, selector) => handle.$$(selector)
const findOneAndEval = async (handle, selector, f) => handle.$eval(selector, f)
const pressKey = async (handle, key) => await handle.keyboard.press(key)
const waitForNetworkIdle = config => async handle => await handle.waitForNetworkIdle(config.puppeteer.timeout)
const goto = async (page, url) => page.goto(url)

export const execute = (/** @type logger */ logger) => async (actionName, action, /** @type boolean */ onlyLogIfError) => {
	if (!onlyLogIfError) {
		logger.logStart(`Start "${actionName}" started`)
	}
	try {
		const result = await action()
		if (!onlyLogIfError) {
			logger.logFinish(
				`Finish "${actionName}" succesfully` +
				(['string', 'number'].includes(typeof result) 
					? ' with result ' + result
					: '')
			)
		}
		return result
	} catch (e) {
		logger.logError(`Error in action "${actionName}": ${e.message}`)
		throw e
	}
}

export const executeClickOrFail = (/** @type logger */ logger, /** @type Milliseconds */ timeout) => async (/** @type string */ reason, handle, selector) => {
	const action = async () => {
		const element = await handle.waitForSelector(selector, {timeout})
		await element.click()
		return element
	}
	const message = `MANDATORY_CLICK_ON_SELECTOR ${selector}` +
		(reason.length > 0 ? ` ${reason}` : '')
	return execute(logger)(message, action, false)
}

export const executeClickIfPresent = (/** @type logger */ logger) => async (reason, handle, selector) => {
	const action = async () => {
		const element = await handle.$(selector)
		if (element) {
			await element.evaluate(b => b.click())
		}
		return element
	}
	const message = `CLICK_ON_SELECTOR_IF_PRESENT ${selector}` +
		(reason.length > 0 ? ` ${reason}` : '')
	return execute(logger)(message, action, true)
}

export const clickOrFailOnTagContainingText = (/** @type logger */ logger, /** @type Milliseconds */ timeout) => async (reason, JSHandle, tag, text) => 
	executeClickOrFail(logger, timeout)(reason, JSHandle, `${tag} ::-p-text(${text})`)

export const getFirstClassOfElementWithText = (/** @type logger */ logger) => async (name, page) => {
	const action = async () => {
		const el = await page.$(`::-p-text(${name})`)
		const tag = await el.evaluate(el => el.nodeName.toLowerCase())
		const className = await el.evaluate(el => el.classList[0])
		return tag + '.' + className
	}
	return execute(logger)(`GET_CLASS_OF_ELEMENT_WITH_TEXT ${name}`, action, false)
}

export const getFirstClassOfElementWithSelector = (/** @type logger */ logger) => async (selector, page) => {
	const action = async () => {
		const el = await page.$(selector)
		const tag = await el.evaluate(el => el.nodeName.toLowerCase())
		const className = await el.evaluate(el => el.classList[0])
		return tag + '.' + className
	}
	return execute(logger)(`GET_CLASS_OF_ELEMENT_WITH_SELECTOR ${selector}`, action, false)
}

export const Bot = (config, /** @type Logger */ logger) => {
	return {
		launchBrowser: launchBrowser(config),
		findOne,
		findAll,
		findOneAndEval,
		pressKey,
		goto,
		waitForNetworkIdle: waitForNetworkIdle(config),
		execute: execute(logger),
		executeClickOrFail: executeClickOrFail(logger, config.puppeteer.timeout),
		executeClickIfPresent: executeClickIfPresent(logger),
		clickOrFailOnTagContainingText: clickOrFailOnTagContainingText(logger, config.puppeteer.timeout),
		getFirstClassOfElementWithText: getFirstClassOfElementWithText(logger),
		getFirstClassOfElementWithSelector: getFirstClassOfElementWithSelector(logger),
	}
}
