export const indentLog = (logLines: string[], indentUnit = '\t') => 
	logLines.map((line, currentIndex) => {
		const testCount = (regex: RegExp, lines: string[]) => 
			lines.reduce((count, line) => regex.test(line) ? count + 1 : count, 0)
		
		const wordStartCount = testCount(/^start:/i, logLines.slice(0, currentIndex+1)) - 1
		const wordFinishCount = testCount(/^finish:/i, logLines.slice(0, currentIndex)) - 1
		const totalCount = wordStartCount - wordFinishCount - 1
		const indent = Array(totalCount < 0 ? 0 : totalCount).fill(indentUnit).join('')
		return indent + line
	})

export const createParagraphsOnLog = (logLines: string[], indentUnit = '.') => 
	logLines.map((line, currentIndex) => {
		if (!new RegExp(`${indentUnit}*finish:`, 'i').test(line)) {
			return line
		}
		return new RegExp(`${indentUnit}*start:`, 'i').test(logLines[currentIndex + 1]) 
				? line + '\n' 
				: line
	})
