import configData from '../config.js'
import { launch } from 'puppeteer'
import { hasFinalLogArgument, parseConfig } from './domain/config/config-parser.js'
import { formatLogEntries } from './domain/logger/log-entries-formatter.js'
import { resultWriter } from './result-writter.js'
import { scrapeWebs } from './domain/runner/scrape-webs.js'
import { onlyErrorLogEntryFormatter, standardLogEntryFormatter } from './entry-formatter.js'

const config = parseConfig(configData)
const browser = await launch(config.puppeteer)
const [entries, reviews] = await scrapeWebs(standardLogEntryFormatter, onlyErrorLogEntryFormatter, browser, config.webs)

if (hasFinalLogArgument()) { 
  console.log(formatLogEntries(entries).join('\n'))
}

await resultWriter(entries, reviews)

await browser.close()
