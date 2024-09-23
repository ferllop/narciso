export const standardFormat = (log: string[]) => createParagraphsOnLog(indentLog(log))

export const indentLog = (logLines: string[], indentUnit = '\t') => 
	logLines.map((line, currentLineIndex) => {
		const startWordCount = countCoincidences(/^start:/i, logLines.slice(0, currentLineIndex+1))
		const finishWordCount = countCoincidences(/^finish:/i, logLines.slice(0, currentLineIndex))
		const indentationSize = /^(start|finish)/i.test(line) 
			? startWordCount - finishWordCount - 1
			: startWordCount - finishWordCount
		const indentation = Array(indentationSize).fill(indentUnit).join('')
		return indentation + line
	})

const countCoincidences = (regex: RegExp, lines: string[]) => 
	lines.reduce((count, line) => regex.test(line) ? count + 1 : count, 0)
	


export const createParagraphsOnLog = (logLines: string[], indentUnit = '.') => 
	logLines.map((line, currentIndex) => {
		if (!new RegExp(`${indentUnit}*finish:`, 'i').test(line)) {
			return line
		}
		return new RegExp(`${indentUnit}*start:`, 'i').test(logLines[currentIndex + 1]) 
				? line + '\n' 
				: line
	})
