export type RawPuppeteerConfig = {
	browserLanguage?: string
	headless?: boolean
	dumpio?: boolean
	sandboxBrowser?: boolean,
	disableSetuidSandbox?: boolean,
}

export type PuppeteerConfig = Omit<RawPuppeteerConfig, 'browserLanguage' | 'sandboxBrowser' | 'disableSetuidSandbox'> & {
	args: string[]
}


