import fs from 'node:fs/promises'
import { Review } from "./domain/scraper/review.js"
import { LogEntries } from './domain/logger/logger.js'
import { formatLogEntries } from './domain/logger/log-entries-formatter.js'

export const resultWriter = async (entries: LogEntries, reviews: Review[]) => {
    await createDirectory('../result')
    await writeLogEntriesToFile(entries)
    await writeReviewsToFile(reviews)
}

const createDirectory = async (directory: string) => {
    const url = new URL(directory, import.meta.url)
    await fs.mkdir(url, { recursive: true })
}

const writeLogEntriesToFile = async (entries: LogEntries) => {
    const formattedLog = formatLogEntries(entries).join('\n')
    await fs.writeFile('./result/reviews.last.log', formattedLog)
}

const writeReviewsToFile = async (reviews: Review[]) => 
    reviews.length && await fs.writeFile('./result/reviews.json', JSON.stringify(reviews, null, 2))
        .catch(err => err && console.error(err))
