import { ActionDescription, LogLineFormatter } from "./log-line-formatter.js"

export type Log = string[]
type Action<T> = (...args: any[]) => Promise<T>
export type Logger = {
	<T>(ad: ActionDescription, a: Action<T>): Promise<T>
	add: (s: string) => void
	getLog: () => Log
	withFormatter: (lf: LogLineFormatter) => Logger
}

export const createLogger =
	(lineFormatter: LogLineFormatter, log: Log): Logger => {

	const addLine = (str: string | null) => {
		if (str !== null) 
			log.push(str)
	}

	const logFunction = async <T>(actionDescription: ActionDescription, action: Action<T>): Promise<T> => {
		addLine(lineFormatter.formatStart(actionDescription))
		try {
			const result = await action()
			addLine(lineFormatter.formatFinish(actionDescription, result))
			return result
		} catch (error: any) {
			addLine(lineFormatter.formatError(actionDescription, error))
			throw error
		}
	}

	logFunction.getLog = () => structuredClone(log)

	logFunction.add = (s: string) => {
		const str = lineFormatter.formatOther(s)
		str && log.push(str)
	}

	logFunction.withFormatter = (lineFormatter: LogLineFormatter) => createLogger(lineFormatter, log)

	return logFunction
}

