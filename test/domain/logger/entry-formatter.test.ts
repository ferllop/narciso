import { describe, it } from "node:test"
import  assert  from "node:assert/strict"
import { LogEntryFormatter, tap } from "../../../src/domain/logger/log-entry-formatter.js"
import { simpleEntryFormatter } from "./test-helpers.js"

class Spy {
    memory: string = 'spy not executed'

    spy (value: string) {
        this.memory = value
    }

    getMemory() {
        return this.memory
    }

    static create() {
        const spyObj = new Spy()
        return [spyObj.spy.bind(spyObj), spyObj.getMemory.bind(spyObj)] as const
    }
}

const testThatExecutes = (method: keyof LogEntryFormatter) => {
    it('executes the passed function giving the log entry to it', () => {
        const [spy, getMem] = Spy.create()
        const x = tap(spy)(simpleEntryFormatter)[method]('some entry', 'dummy parameter')
        assert.strictEqual(getMem(), x)
    })
}

const testThatNotExecutes = (method: keyof LogEntryFormatter) => {
    it('not executes the passed function', () => {
        const nullFormatter = { ...simpleEntryFormatter, [method] : () => null}
        const [spy, getMem] = Spy.create()

        const x = tap(spy)(nullFormatter)[method]('some entry', 'dummy parameter')

        assert.strictEqual(x, null)
        assert.strictEqual(getMem(), 'spy not executed')
    })
}

describe('given the tap function', () => {
    describe('and the formatStart method', () => {
        testThatExecutes('formatStart')
        testThatNotExecutes('formatStart')
    })
    describe('and the formatFinish method', () => {
        testThatExecutes('formatFinish')
        testThatNotExecutes('formatFinish')
    })
    describe('and the formatError method', () => {
        testThatExecutes('formatError')
        testThatNotExecutes('formatError')
    })
    describe('and the formatOther method', () => {
        testThatExecutes('formatOther')
        testThatNotExecutes('formatOther')
    })
})
