import configData from '../config.js'
import { hasFinalLogArgument, parseConfig } from './config/config-parser.js'
import { LogFunction, createLogFunction, onlyErrorLogFormatter, simpleLogFormatter, toConsole } from './logger/logger.js'
import { launch } from 'puppeteer'
import { runner } from './scrapper/runner.js'
import { createScraper } from './scrapper/providers/provider.js'
import { standardFormat } from './logger/log-formatter.js'
import fs from 'node:fs/promises'
import { Review } from './scrapper/review.js'

const logMem: string[] = []
const log = createLogFunction(hasFinalLogArgument() ? simpleLogFormatter : toConsole(simpleLogFormatter), logMem)
const onlyOnErrorLog = createLogFunction(hasFinalLogArgument() ? onlyErrorLogFormatter : toConsole(onlyErrorLogFormatter), logMem)

const config = parseConfig(configData)
const browser = await launch(config.puppeteer)
const scrape = createScraper(log, onlyOnErrorLog, browser)
const reviews = await runner(log, config.webs, scrape)

if (hasFinalLogArgument()) { 
  console.log(standardFormat(logMem).join('\n'))
}

const resultWriter = async (log: LogFunction, reviews: Review[]) => {
    const directory = new URL('../result', import.meta.url)
    await fs.mkdir(directory, { recursive: true })
    const formattedLog = standardFormat(log.getLog()).join('\n')
    await fs.writeFile('./result/reviews.last.log', formattedLog)
    reviews.length && await fs.writeFile('./result/reviews.json', JSON.stringify(reviews, null, 2))
        .catch(err => err && console.error(err))
}
await resultWriter(log, reviews)

await browser.close()
