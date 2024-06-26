export type FormatLog = (str: string, ...thing: unknown[]) => string | null
export type LogFormatter = Record<'formatStart' | 'formatFinish' | 'formatError' | 'formatOther', FormatLog>

type ActionDescription = string
type Action<T> = (...args: any[]) => Promise<T>
export type LogFunction = {
	<T>(actionDescription: ActionDescription, a: Action<T>): Promise<T>
	add: (s: string) => void
	getLog: () => string[]
}

export const createLogFunction =
	(logger: LogFormatter, memory: string[] = []): LogFunction => {

	const addLine = (str: string | null) => {
		if (str !== null) 
			memory.push(str)
	}

	const logFunction = async <T>(actionDescription: ActionDescription, f: Action<T>): Promise<T> => {
		addLine(logger.formatStart(actionDescription))
		try {
			const result = await f()
			addLine(logger.formatFinish(actionDescription, result))
			return result
		} catch (error: any) {
			addLine(logger.formatError(actionDescription, error))
			throw error
		}
	}
	logFunction.getLog = () => structuredClone(memory)
	logFunction.add = (s: string) => {
		const str = logger.formatOther(s)
		str && memory.push(str)
	}
	return logFunction
}

export const tap = (f: (...args: any[]) => any) => (logger: LogFormatter): LogFormatter => ({
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

export const toConsole = tap(console.log)

export const simpleLogFormatter: LogFormatter = {
	formatStart: (actionDescription: string) => 
		'Start: ' + actionDescription,

	formatFinish: (actionDescription: string, result: any) => 
		'Finish: ' + actionDescription + 
		(['number', 'string'].includes(typeof result) 
			? ` with result ${result}` 
			: ''),

	formatError: (actionDescription: string, error: any) => 
		`ERROR:  ${actionDescription} failed with error "${error instanceof Error ? error.message : error}"`,

	formatOther: (actionDescription: string) => actionDescription,
}

export const onlyErrorLogFormatter : LogFormatter = {...simpleLogFormatter, formatStart: () => null, formatFinish: () => null}

