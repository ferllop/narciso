import { LogEntryFormatter } from "../../../src/domain/logger/log-entry-formatter.js";

export const simpleEntryFormatter: LogEntryFormatter = {
    formatStart: (action: string) => `Start: ${action}`,
    formatFinish: (action: string) => `Finish: ${action}`,
    formatError: (action: string) => `Error: ${action}`,
    formatOther: (action: string) => `Other: ${action}`,
}
