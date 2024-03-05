import { describe, it } from 'node:test'
import assert from 'node:assert'
import { configParser } from "../src/config-parser.js"

const assertArrayContains = (actualArray, expectedValue, message) => 
    assert.ok(actualArray.some(item => item === expectedValue), message)
const assertArrayNotContains = (actualArray, expectedValue, message) => 
    assert.throws(() => assertArrayContains(actualArray, expectedValue), message)

const assertArgsContains = argToContain => (message, configData) => 
    assertArrayContains(configParser(configData).puppeteer.args, argToContain, message)
const assertArgsNotContains = argToContain => (message, configData) => 
    assertArrayNotContains(configParser(configData).puppeteer.args, argToContain, message)

const assertConfigWithData = configData => ({
    containsArgument: (argument, message) => assertArgsContains(argument)(message, configData),
    notContainsArgument: (argument, message) => assertArgsNotContains(argument)(message, configData)
})

const assertPath = (...path) => {
    const applyPath =  (obj, path) => {
        if (path.length === 0) {
            return obj
        } 

        const [p, ...ps] = path
        return applyPath(obj[p], ps)
    }

    return {
        inConfigWithData: configData => ({
            hasValue: (value, message) => assert.strictEqual(applyPath(configParser(configData), path), value, message)
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
        
        assertConfigWithData({ puppeteer: {} })
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
    it('when parsing the provider of the web then if the provider is absent it gets it from the url', () => {
        assertPath('webs', 0, 'provider')
            .inConfigWithData({ webs: [ { url: 'https://google.com/some-uri'}]})
            .hasValue('google.com', 'when is absent')
    })

    it('when parsing the provider of the web then if the provider is present it gets it from there', () => {
        assertPath('webs', 0, 'provider')
            .inConfigWithData({ webs: [ { url: 'https://google.com/some-uri', provider: 'Explicit Provider'}]})
            .hasValue('Explicit Provider', 'when is present')
    })
})
