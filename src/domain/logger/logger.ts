import { ActionDescription, LogEntryFormatter } from './log-entry-formatter.js'

type Action<T> = (...args: any[]) => Promise<T>
export type LogEntries = string[]
export type Log = Logger['log']

export class Logger {

	constructor(private lineFormatter: LogEntryFormatter, private logEntries: LogEntries) {
	}

	private addLine(str: string | null) {
		if (str !== null) 
			this.logEntries.push(str)
	}

	public log<T>(actionDescription: ActionDescription): void 
	public async log<T>(actionDescription: ActionDescription, action: Action<T>): Promise<T>
	public async log<T>(actionDescription: ActionDescription, action?: Action<T>) {
		if (action === undefined) {
			this.addLine(this.lineFormatter.formatOther(actionDescription))
			return
		}

		this.addLine(this.lineFormatter.formatStart(actionDescription))
		try {
			const result = await action()
			this.addLine(this.lineFormatter.formatFinish(actionDescription, result))
			return result
		} catch (error: any) {
			this.addLine(this.lineFormatter.formatError(actionDescription, error))
			throw error
		}
	}

	public getEntries() {
		return structuredClone(this.logEntries)
	}

	public withFormatter(lineFormatter: LogEntryFormatter) {
		return new Logger(lineFormatter, this.logEntries)
	}

}
