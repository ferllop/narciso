import { ActionDescription, LogLineFormatter } from "./log-line-formatter.js"

type Action<T> = (...args: any[]) => Promise<T>
export type Entries = string[]
export type Log = Logger['log']

export class Logger {

	constructor(private lineFormatter: LogLineFormatter, private memory: Entries) {
	}

	private addLine(str: string | null) {
		if (str !== null) 
			this.memory.push(str)
	}

	public log<T>(actionDescription: ActionDescription): void 
	public async log<T>(actionDescription: ActionDescription, action: Action<T>): Promise<T>
	public async log<T>(actionDescription: ActionDescription, action?: Action<T>) {
		if (!action) {
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

	public getLog() {
		return structuredClone(this.memory)
	}

	public withFormatter(lineFormatter: LogLineFormatter) {
		return new Logger(lineFormatter, this.memory)
	}

}
