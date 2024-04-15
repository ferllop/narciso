export type Log = (message: string) => void
export type Logger = {logStart: Log, logFinish: Log, logError: Log}
export type LogFunction = (s: string) => <T>(a: Action<T>) => Promise<T>
type Action<T> = (...args: any[]) => Promise<T>
type ActionDescription = string

export const createLog = 
	(logger: Logger) => (actionName: ActionDescription) => <T>(f: Action<T>): Promise<T> => {
	logger.logStart(`Start "${actionName.trim()}" started`)
	try {
		const result = f()
		logger.logFinish(
			`Finish "${actionName.trim()}" succesfully` +
			(['string', 'number'].includes(typeof result) 
				? ' with result ' + result
				: '')
		)
		return result
	} catch (e: any) {
		logger.logError(`Error in action "${actionName.trim()}": ${e.message}`)
		throw e
	}
}

const doNothing = () => {}
export const noLogLogger: Logger = {logStart: doNothing, logFinish: doNothing, logError: doNothing}
export const onlyOnErrorLogger: Logger = {...noLogLogger, logError: console.error}
export const consoleLogger: Logger = {
	logStart: console.log,
	logFinish: console.log,
	logError: console.error,
}
