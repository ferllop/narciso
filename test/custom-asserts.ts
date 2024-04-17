import assert from "node:assert/strict"

export const assertArrayContains = (actualArray: any[], expectedValue: any, message: string = '') => 
    assert.ok(actualArray.some(item => item === expectedValue), message)

export const assertArrayNotContains = (actualArray: any[], expectedValue: any, message: string) => 
    assert.throws(() => assertArrayContains(actualArray, expectedValue), message)

export const assertNotOk = (actual: boolean, message = '') => assert.equal(actual, false, message)

