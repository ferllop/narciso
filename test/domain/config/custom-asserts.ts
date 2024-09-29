import assert from 'node:assert'
import configDataTemplate from '../../../config.example.js'
import { assertArrayContains, assertArrayNotContains } from '../../custom-asserts.js'
import { RawConfig } from '../../../src/domain/config/config.js'
import { parseConfig } from '../../../src/domain/config/config-parser.js'

const assertArgsContains = (argToContain: string, configData: RawConfig, message: string) => 
    assertArrayContains(parseConfig(configData).puppeteer.args, argToContain, message)

const assertArgsNotContains = (argToContain: string, configData: RawConfig, message: string) => 
    assertArrayNotContains(parseConfig(configData).puppeteer.args, argToContain, message)

export const assertConfigWithData = (configData: any) => ({
    isConvertedToArgumentsContaining: (argument: string, message = '') => 
        assertArgsContains(argument, {...configDataTemplate, ...configData}, message),
    isConvertedToArgumentsNotContaining: (argument: string, message = '') => 
        assertArgsNotContains(argument, {...configDataTemplate, ...configData}, message)
})

export const assertPath = (...path: (string|number)[]) => {
    const applyPath =  <T extends Record<PropertyKey, any>, K extends PropertyKey>(obj: T, path: K[]): T | T[K] => {
        if (path.length === 0) {
            return obj
        }

        const [p, ...ps] = path
        return applyPath(obj[p], ps)
    }

    return {
        inConfigWithData: (configData: any) => ({
            hasValue: (value: any, message: string) =>
                assert.strictEqual(
                    applyPath(parseConfig({...configDataTemplate, ...configData}), path), value, message)
        })
    }
}
