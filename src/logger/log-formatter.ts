export const standardFormat = (log: string[]) => createParagraphsOnLog(indentLog(log))

export const indentLog = (logLines: string[], indentUnit = '\t') => {

	const indentLine = (line: string, currentLineIndex: number) => {
		const startWordCount = countLinesWith(/^start:/i, logLines.slice(0, currentLineIndex + 1))
		const finishWordCount = countLinesWith(/^finish:/i, logLines.slice(0, currentLineIndex))
		const indentationSize = /^(start|finish)/i.test(line) 
			? startWordCount - finishWordCount - 1
			: startWordCount - finishWordCount
		const indentation = Array(indentationSize).fill(indentUnit).join('')
		return indentation + line
	}

	const countLinesWith = (regex: RegExp, lines: string[]) => 
		lines.reduce((count, line) => regex.test(line) ? count + 1 : count, 0)

	return logLines.map(indentLine)
}	


export const createParagraphsOnLog = (logLines: string[], indentUnit = '.') => 
	logLines.map((line, currentIndex) => {
		if (!new RegExp(`${indentUnit}*finish:`, 'i').test(line)) {
			return line
		}
		return new RegExp(`${indentUnit}*start:`, 'i').test(logLines[currentIndex + 1]) 
				? line + '\n' 
				: line
	})
