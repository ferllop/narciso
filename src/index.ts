import configData from '../config.js'
import { launch } from 'puppeteer'
import { hasFinalLogArgument, parseConfig } from './domain/config/config-parser.js'
import { standardFormat } from './domain/logger/final-log-formatter.js'
import { resultWriter } from './result-writter.js'
import { scrapeWebs } from './domain/runner/scrape-webs.js'
import { onlyErrorLogFormatter, simpleLogFormatter } from './logger.js'

const config = parseConfig(configData)
const browser = await launch(config.puppeteer)
const [log, reviews] = await scrapeWebs(simpleLogFormatter, onlyErrorLogFormatter, browser, config.webs)

if (hasFinalLogArgument()) { 
  console.log(standardFormat(log).join('\n'))
}

await resultWriter(log, reviews)

await browser.close()
