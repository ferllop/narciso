import { LogEntryFormatter } from "./domain/logger/log-entry-formatter.js"

export const standardLogEntryFormatter: LogEntryFormatter = {
    formatStart: (actionDescription: string) => 'Start: ' + actionDescription,
    formatFinish: (actionDescription: string, result: unknown) => 
        'Finish: ' + actionDescription + 
        (['number', 'string'].includes(typeof result) ? ` with result ${result}` : ''),
    formatError: (actionDescription: string, error: unknown) => 
        `ERROR:  ${actionDescription} failed with error "${error instanceof Error ? error.message : error}"`,
    formatOther: (actionDescription: string) => actionDescription,
}

export const onlyErrorLogEntryFormatter: LogEntryFormatter = {
    ...standardLogEntryFormatter,
    formatStart: () => null,
    formatFinish: () => null,
}
