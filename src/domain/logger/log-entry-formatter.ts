export type ActionDescription = string
export type LogEntryFormatter = {
	formatStart: (a: ActionDescription) => string | null
	formatFinish: (a: ActionDescription, result: unknown) => string | null
	formatError: (a: ActionDescription, error: any) => string | null
	formatOther: (a: ActionDescription) => string | null
}

export const tap = (f: (...args: any[]) => any) => (logger: LogEntryFormatter): LogEntryFormatter => ({
	formatStart: (actionDescription: ActionDescription) => {
		const formattedLog = logger.formatStart(actionDescription)
		formattedLog !== null && f(formattedLog)
		return formattedLog
	},
	formatFinish: (actionDescription: ActionDescription, result: any) => {
		const formattedLog = logger.formatFinish(actionDescription, result)
		formattedLog !== null && f(formattedLog)
		return formattedLog
	},	
	formatError: (actionDescription: ActionDescription, error: any) => {
		const formattedLog = logger.formatError(actionDescription, error)
		formattedLog !== null && f(formattedLog)
		return formattedLog
	},
	formatOther: (actionDescription: ActionDescription) => {
		const formattedLog = logger.formatOther(actionDescription)
		formattedLog !== null && f(formattedLog)
		return formattedLog
	},
})

