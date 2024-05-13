import configData from '../config.js'
import { hasFinalLogArgument, parseConfig } from './config/config-parser.js'
import { createLogFunction, onlyErrorLogFormatter, simpleLogFormatter, toConsole } from './logger/logger.js'
import { launch } from 'puppeteer'
import { runner } from './runner.js'
import { createScraper } from './providers/provider.js'
import { resultWriter } from './result-writter.js'
import { standardFormat } from './logger/log-formatter.js'

const logMem: string[] = []
const log = createLogFunction(hasFinalLogArgument() ? simpleLogFormatter : toConsole(simpleLogFormatter), logMem)
const onlyOnErrorLog = createLogFunction(hasFinalLogArgument() ? onlyErrorLogFormatter : toConsole(onlyErrorLogFormatter), logMem)

const config = parseConfig(configData)
const browser = await launch(config.puppeteer)
const scrape = createScraper(log, onlyOnErrorLog, browser)
const reviews = await runner(log, config, scrape)

if (hasFinalLogArgument()) { 
  console.log(standardFormat(logMem).join('\n'))
}

await resultWriter(log, reviews)

await browser.close()
