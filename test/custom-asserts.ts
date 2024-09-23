import assert from "node:assert/strict"
import { Page } from "../src/puppeteer-actions.js"

 
/* assert.deepStrictEqual from node:assert does not show the failing item isolated making hard to find the difference */
export const assertArraysAreEqual = <T>(actual: T[], expected: T[]) => {
    assert.equal(actual.length, expected.length)
    actual.forEach((line, row) => assert.strictEqual(line, expected[row], `Rows ${row + 1} are not equal`))
}

export const assertArrayContains = (actualArray: any[], expectedValue: any, message: string = '') => 
    assert.ok(actualArray.some(item => item === expectedValue), message)

export const assertArrayNotContains = (actualArray: any[], expectedValue: any, message: string) => 
    assert.throws(() => assertArrayContains(actualArray, expectedValue), message)

export const assertNotOk = (actual: boolean, message = '') => assert.equal(actual, false, message)

export const assertPageBodyEquals = async (page: Page, bodyContent: string, message: string = '') => 
    assert.equal(await page.content(), `<html><head></head><body>${bodyContent}</body></html>`, message)

