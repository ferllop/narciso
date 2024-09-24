import { hasFinalLogArgument } from "./domain/config/config-parser.js"
import { LogLineFormatter, tap } from "./domain/logger/log-line-formatter.js"
import { createLogger } from "./domain/logger/logger.js"

const toConsole = tap(console.log)
const selectOutput = (l: LogLineFormatter) => hasFinalLogArgument() ? l : toConsole(l)

const logMem: string[] = []

const simpleLogFormatter: LogLineFormatter = {
    formatStart: (actionDescription: string) => 'Start: ' + actionDescription,
    formatFinish: (actionDescription: string, result: unknown) => 
        'Finish: ' + actionDescription + 
        (['number', 'string'].includes(typeof result) ? ` with result ${result}` : ''),
    formatError: (actionDescription: string, error: unknown) => 
        `ERROR:  ${actionDescription} failed with error "${error instanceof Error ? error.message : error}"`,
    formatOther: (actionDescription: string) => actionDescription,
}
export const log = createLogger(selectOutput(simpleLogFormatter), logMem)

const onlyErrorLogFormatter: LogLineFormatter = {...simpleLogFormatter, formatStart: () => null, formatFinish: () => null}
export const onlyOnErrorLog = createLogger(selectOutput(onlyErrorLogFormatter), logMem)
