import fs from 'node:fs/promises'
import { LogFunction } from "./logger/logger.js";
import { Review } from "./review.js";
import { standardFormat } from './logger/log-formatter.js';

export const resultWriter = async (log: LogFunction, reviews: Review[]) => {
    const directory = new URL('../result', import.meta.url)
    await fs.mkdir(directory, { recursive: true })
    const formattedLog = standardFormat(log.getLog()).join('\n')
    await fs.writeFile('./result/reviews.last.log', formattedLog)
    await fs.writeFile('./result/reviews.json', JSON.stringify(reviews, null, 2))
        .catch(err => err && console.error(err))
}
