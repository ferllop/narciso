import fs from 'node:fs/promises'
import { standardFormat } from "./domain/logger/final-log-formatter.js"
import { Review } from "./domain/scraper/review.js"

export const resultWriter = async (log: string[], reviews: Review[]) => {
    await createDirectory('../result')
    await writeLogToFile(log)
    await writeReviewsToFile(reviews)
}

const createDirectory = async (directory: string) => {
    const url = new URL(directory, import.meta.url)
    await fs.mkdir(url, { recursive: true })
}

const writeLogToFile = async (log: string[]) => {
    const formattedLog = standardFormat(log).join('\n')
    await fs.writeFile('./result/reviews.last.log', formattedLog)
}

const writeReviewsToFile = async (reviews: Review[]) => 
    reviews.length && await fs.writeFile('./result/reviews.json', JSON.stringify(reviews, null, 2))
        .catch(err => err && console.error(err))
