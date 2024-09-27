import { LogLineFormatter } from "./domain/logger/log-line-formatter.js"

export const simpleLogFormatter: LogLineFormatter = {
    formatStart: (actionDescription: string) => 'Start: ' + actionDescription,
    formatFinish: (actionDescription: string, result: unknown) => 
        'Finish: ' + actionDescription + 
        (['number', 'string'].includes(typeof result) ? ` with result ${result}` : ''),
    formatError: (actionDescription: string, error: unknown) => 
        `ERROR:  ${actionDescription} failed with error "${error instanceof Error ? error.message : error}"`,
    formatOther: (actionDescription: string) => actionDescription,
}

export const onlyErrorLogFormatter: LogLineFormatter = {
    ...simpleLogFormatter,
    formatStart: () => null,
    formatFinish: () => null,
}
