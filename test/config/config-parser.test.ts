import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseConfig } from "../../src/config/config-parser.js"
import configDataTemplate from '../../config.example.js'
import { assertArrayContains, assertArrayNotContains } from '../custom-asserts.js'
import { RawConfig } from '../../src/config/config.js'

const assertArgsContains = (argToContain: any) => (message: string, configData: RawConfig) => 
    assertArrayContains(parseConfig(configData).puppeteer.args, argToContain, message)

const assertArgsNotContains = (argToContain: any) => (message: string, configData: RawConfig) => 
    assertArrayNotContains(parseConfig(configData).puppeteer.args, argToContain, message)

const assertConfigWithData = (configData: any) => ({
    containsArgument: (argument: any, message = '') => assertArgsContains(argument)(message, {...configDataTemplate, ...configData}),
    notContainsArgument: (argument: any, message = '') => assertArgsNotContains(argument)(message, {...configDataTemplate, ...configData})
})

const assertPath = (...path: (string|number)[]) => {
    const applyPath: any =  (obj: Record<string|number, any>, path: (string|number)[]) => {
        if (path.length === 0) {
            return obj
        }

        const [p, ...ps] = path
        return applyPath(obj[p], ps)
    }

    return {
        inConfigWithData: (configData: any) => ({
            hasValue: (value: any, message: string) => assert.strictEqual(applyPath(parseConfig({...configDataTemplate, ...configData}), path), value, message)
        })
    }
}

describe('given config parser', () => {
    it('when reading config to set puppeteer browser language but it is absent \
        then sets the language to american english', () => {
        assertConfigWithData({ puppeteer: {}})
            .containsArgument('--lang=en-US')
    })

    it('when reading config to set puppeteer browser language \
        then outputs the full puppeteer argument', () => {
        assertConfigWithData({ puppeteer: { browserLanguage: 'es-ES'}})
            .containsArgument('--lang=es-ES')
    })

    it('when reading config to run puppeteer with a sandboxed browser or not \
        then only outputs argument to run unsandboxed if its not true or absent', () => {
        const toDisableSandbox = '--no-sandbox'

        assertConfigWithData({ puppeteer: {} })
            .notContainsArgument(toDisableSandbox, "when don't exists")

        assertConfigWithData({ puppeteer: { sandboxBrowser: true }})
            .notContainsArgument(toDisableSandbox, 'when is explicitly true')

        assertConfigWithData({ puppeteer: { sandboxBrowser: false }})
            .containsArgument(toDisableSandbox, 'when is explicitly false')

        assertConfigWithData({ puppeteer: { sandboxBrowser: 'anything' }})
            .containsArgument(toDisableSandbox, 'when is anything else')

        assertConfigWithData({ puppeteer: { sandboxBrowser: null }})
            .containsArgument(toDisableSandbox, 'when is null')
    })

    it('when reading config to run puppeteer with a sandboxed setuid or not \
        then only outputs argument to disable it if its explicitly set to true', () => {
        const toDisableSetuidSandbox = '--disable-setuid-sandbox'

        assertConfigWithData({puppeteer: {}})
            .notContainsArgument(toDisableSetuidSandbox, 'when is absent')
        
        assertConfigWithData({ puppeteer: { disableSetuidSandbox: true } })
            .containsArgument(toDisableSetuidSandbox, 'when is explicitly true')

        assertConfigWithData({ puppeteer: { disableSetuidSandbox: false } })
            .notContainsArgument(toDisableSetuidSandbox, 'when is explicitly false')

        assertConfigWithData({ puppeteer: { disableSetuidSandbox: 'anything' } })
            .notContainsArgument(toDisableSetuidSandbox, 'when is anything else')

        assertConfigWithData({ puppeteer: { disableSetuidSandbox: null } })
            .notContainsArgument(toDisableSetuidSandbox, 'when is null')
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

describe('given the config parser', () => {
    it('when parsing the provider of the web then if the provider is present it gets it from there', () => {
        assertPath('webs', 0, 'provider')
            .inConfigWithData({ webs: [ { url: 'https://google.com/some-uri', provider: 'Explicit Provider'}]})
            .hasValue('Explicit Provider', 'when is present')
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
