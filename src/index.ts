import configData from '../config.js'
import { launch } from 'puppeteer'
import { log, onlyOnErrorLog } from './logger.js'
import { hasFinalLogArgument, parseConfig } from './domain/config/config-parser.js'
import { scrapeWebs } from './domain/scraper/scraper.js'
import { standardFormat } from './domain/logger/final-log-formatter.js'
import { resultWriter } from './result-writter.js'

const config = parseConfig(configData)
const browser = await launch(config.puppeteer)
const reviews = await scrapeWebs(log, onlyOnErrorLog, browser, config.webs)

if (hasFinalLogArgument()) { 
  console.log(standardFormat(log.getLog()).join('\n'))
}

await resultWriter(log.getLog(), reviews)

await browser.close()
