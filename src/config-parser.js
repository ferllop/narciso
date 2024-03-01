const isAbsentOrExplicitlyTrue = value => [true, undefined].includes(value)
const isExplicitlyTrue = value => value === true

const parsePuppeteerConfigSection = configData => ({
	args: [ `--lang=${configData.puppeteer?.browserLanguage ?? 'en-US'}`, 
		isAbsentOrExplicitlyTrue(configData.puppeteer?.sandboxBrowser) ? '' : '--no-sandbox', 
		isExplicitlyTrue(configData.puppeteer?.disableSetuidSandbox) ? '--disable-setuid-sandbox' : ''
	],
	headless: isAbsentOrExplicitlyTrue(configData.puppeteer?.headless),
	dumpio : isAbsentOrExplicitlyTrue(configData.puppeteer?.dumpio),
})

const parseWebsConfigSection = configData => configData.webs?.map(web => ({
	...web,
	provider: web.provider ?? new URL(web.url).hostname
}))

export const configParser = configData => ({
	puppeteer: parsePuppeteerConfigSection(configData),
	webs: parseWebsConfigSection(configData),
})
