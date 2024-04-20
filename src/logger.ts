export type LogStart = (actionDescription: ActionDescription) => void
export type LogFinish = (actionDescription: ActionDescription, result: any) => void
export type LogError = (actionDescription: ActionDescription, error: any) => void
export type Logger = {logStart: LogStart, logFinish: LogFinish, logError: LogError}
export type LogFunction = (s: string) => <T>(a: Action<T>) => Promise<T>
type Action<T> = (...args: any[]) => Promise<T>
type ActionDescription = string

export const createLog = 
	(logger: Logger) => (actionDescription: ActionDescription) => async <T>(f: Action<T>): Promise<T> => {
	logger.logStart(actionDescription)
	try {
		const result = await f()
		logger.logFinish(actionDescription, result)
		return result
	} catch (error: any) {
		logger.logError(actionDescription, error)
		throw error
	}
}

const doNothing = () => {}
export const noLogLogger: Logger = {logStart: doNothing, logFinish: doNothing, logError: doNothing}
export const onlyOnErrorLogger: Logger = {...noLogLogger, logError: console.error}
export const consoleLogger: Logger = {
	logStart: (...msgs: string[]) => console.log('Start:', ...msgs),
	logFinish: (...msgs: string[]) => {
		console.log('Finish:', ...msgs.filter(msg => ['number', 'string'].includes(typeof msg)))
	},
	logError: console.error,
}
