import configData from '../config.js'
import { hasSilentArgument, parseConfig } from './config/config-parser.js'
import { createLogFunction, onlyErrorLogFormatter, simpleLogFormatter, toConsole } from './logger/logger.js'
import { launch } from 'puppeteer'
import { runner } from './runner.js'
import { createScraper } from './providers/provider.js'
import { resultWriter } from './result-writter.js'

const logMem: string[] = []
const log = createLogFunction(hasSilentArgument() ? simpleLogFormatter : toConsole(simpleLogFormatter), logMem)
const onlyOnErrorLog = createLogFunction(hasSilentArgument() ? onlyErrorLogFormatter : toConsole(onlyErrorLogFormatter), logMem)

const config = parseConfig(configData)
const browser = await launch(config.puppeteer)
const scrape = createScraper(log, onlyOnErrorLog, browser)
const reviews = await runner(log, config, scrape)

await resultWriter(log, reviews)

await browser.close()
