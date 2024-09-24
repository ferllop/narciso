import { ActionDescription, LogLineFormatter } from "./log-line-formatter.js"

type Action<T> = (...args: any[]) => Promise<T>
export type Logger = {
	<T>(actionDescription: ActionDescription, a: Action<T>): Promise<T>
	add: (s: string) => void
	getLog: () => string[]
}

export const createLogger =
	(lineFormatter: LogLineFormatter, memory: string[]): Logger => {

	const addLine = (str: string | null) => {
		if (str !== null) 
			memory.push(str)
	}

	const logFunction = async <T>(actionDescription: ActionDescription, f: Action<T>): Promise<T> => {
		addLine(lineFormatter.formatStart(actionDescription))
		try {
			const result = await f()
			addLine(lineFormatter.formatFinish(actionDescription, result))
			return result
		} catch (error: any) {
			addLine(lineFormatter.formatError(actionDescription, error))
			throw error
		}
	}
	logFunction.getLog = () => structuredClone(memory)
	logFunction.add = (s: string) => {
		const str = lineFormatter.formatOther(s)
		str && memory.push(str)
	}
	return logFunction
}

