import { describe, it } from 'node:test'
import { assertConfigWithData, assertPath } from './custom-asserts.js'

describe('given puppeteer config parser', () => {
    it('when reading config to set puppeteer browser language but it is absent \
        then sets the language to american english', () => {
        assertConfigWithData({ puppeteer: {}})
            .isConvertedToArgumentsContaining('--lang=en-US')
    })

    it('when reading config to set puppeteer browser language \
        then outputs the full puppeteer argument', () => {
        assertConfigWithData({ puppeteer: { browserLanguage: 'es-ES'}})
            .isConvertedToArgumentsContaining('--lang=es-ES')
    })

    it('when reading config to run puppeteer with a sandboxed browser or not \
        then only outputs argument to run unsandboxed if its not true or absent', () => {
        const toDisableSandbox = '--no-sandbox'

        assertConfigWithData({ puppeteer: {} })
            .isConvertedToArgumentsNotContaining(toDisableSandbox, "when don't exists")

        assertConfigWithData({ puppeteer: { sandboxBrowser: true }})
            .isConvertedToArgumentsNotContaining(toDisableSandbox, 'when is explicitly true')

        assertConfigWithData({ puppeteer: { sandboxBrowser: false }})
            .isConvertedToArgumentsContaining(toDisableSandbox, 'when is explicitly false')

        assertConfigWithData({ puppeteer: { sandboxBrowser: 'anything' }})
            .isConvertedToArgumentsContaining(toDisableSandbox, 'when is anything else')

        assertConfigWithData({ puppeteer: { sandboxBrowser: null }})
            .isConvertedToArgumentsContaining(toDisableSandbox, 'when is null')
    })

    it('when reading config to run puppeteer with a sandboxed setuid or not \
        then only outputs argument to disable it if its explicitly set to true', () => {
        const toDisableSetuidSandbox = '--disable-setuid-sandbox'

        assertConfigWithData({puppeteer: {}})
            .isConvertedToArgumentsNotContaining(toDisableSetuidSandbox, 'when is absent')
        
        assertConfigWithData({ puppeteer: { disableSetuidSandbox: true } })
            .isConvertedToArgumentsContaining(toDisableSetuidSandbox, 'when is explicitly true')

        assertConfigWithData({ puppeteer: { disableSetuidSandbox: false } })
            .isConvertedToArgumentsNotContaining(toDisableSetuidSandbox, 'when is explicitly false')

        assertConfigWithData({ puppeteer: { disableSetuidSandbox: 'anything' } })
            .isConvertedToArgumentsNotContaining(toDisableSetuidSandbox, 'when is anything else')

        assertConfigWithData({ puppeteer: { disableSetuidSandbox: null } })
            .isConvertedToArgumentsNotContaining(toDisableSetuidSandbox, 'when is null')
    })

    it('when reading config to start a headless browser or not \
        then only set the config option to true when is absent or explicitly true \
        otherwise it is setted to false', () => {
        assertPath('puppeteer', 'headless')
            .inConfigWithData({ puppeteer: {}})
            .hasValue(true, "when don't exists")

        assertPath('puppeteer', 'headless')
            .inConfigWithData({ puppeteer: { headless: true }})
            .hasValue(true, 'when is explicitly true')

        assertPath('puppeteer', 'headless')
            .inConfigWithData({ puppeteer: { headless: false }})
            .hasValue(false, 'when is explicitly false')

        assertPath('puppeteer', 'headless')
            .inConfigWithData({ puppeteer: { headless: 'anything' }})
            .hasValue(false, 'when is anything else')

        assertPath('puppeteer', 'headless')
            .inConfigWithData({ puppeteer: { headless: null }})
            .hasValue(false, "when is null")
    })

    it('when reading config to start dumpio or not \
        then only set the config option to true when is absent or explicitly true \
        otherwise it is setted to false', () => {
        assertPath('puppeteer', 'dumpio')
            .inConfigWithData({puppeteer: {} })
            .hasValue(true, "when don't exists")

        assertPath('puppeteer', 'dumpio')
            .inConfigWithData({ puppeteer: { dumpio: true }})
            .hasValue(true, "when is true")

        assertPath('puppeteer', 'dumpio')
            .inConfigWithData({ puppeteer: { dumpio: false }})
            .hasValue(false, "when is false")

        assertPath('puppeteer', 'dumpio')
            .inConfigWithData({ puppeteer: { dumpio: 'anything' }})
            .hasValue(false, "when is anything else")

        assertPath('puppeteer', 'dumpio')
            .inConfigWithData({ puppeteer: { dumpio: null }})
            .hasValue(false, "when is null")
    })
})

describe('given the web config parser', () => {
    it('when parsing the provider of the web then if the provider is present it gets it from there', () => {
        assertPath('webs', 0, 'provider')
            .inConfigWithData({ webs: [ { url: 'https://google.com/some-uri', provider: 'Explicit Provider'}]})
            .hasValue('Explicit Provider', 'when is present')
    })

    it('when parsing the timeout of the web then if its not provided, the default is 30000', () => {
        assertPath('webs', 0, 'timeout')
            .inConfigWithData({ webs: [ { }]})
            .hasValue(30000, 'when not present')
    })

    it('when parsing the timeout of the web then get its value when present', () => {
        assertPath('webs', 0, 'timeout')
            .inConfigWithData({ webs: [ { timeout: 300 }]})
            .hasValue(300, 'when not present')
    })

    it('when parsing the known review of the web then it parses correctly', () => {
        const knownReview = { authorName: 'Jane', content: 'Was here'}
        assertPath('webs', 0, 'known', 'review', 'authorName')
            .inConfigWithData({ webs: [ { url: 'https://google.com/some-uri', known: { review: knownReview }}]})
            .hasValue(knownReview.authorName, 'when is present')
        assertPath('webs', 0, 'known', 'review', 'content')
            .inConfigWithData({ webs: [ { url: 'https://google.com/some-uri', known: { review: knownReview }}]})
            .hasValue(knownReview.content, 'when is present')
    })
})
