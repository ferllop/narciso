import { describe, it } from 'node:test'
import { createLog } from '../src/logger.js'
import assert from 'node:assert/strict'

const mem: string[] = []
const appendToMem = (msg: string) => mem.push(msg)
const log = createLog({logStart: appendToMem, logFinish: appendToMem, logError: appendToMem})

describe('Given a logger', () => {
    it('when it logs an action then it puts the action log in the middle of its start and finish messages', async () => {
        const theLogName = 'THE_LOG_NAME'
        const theActionName = 'the-action-name'
        const action = () => log(theActionName)(async () => {})
        log(theLogName)(action)
        assert.strictEqual(mem[0], `Start "${theLogName}"`)
        assert.strictEqual(mem[1], `Start "${theActionName}"`)
        assert.strictEqual(mem[2], `Finish "${theActionName}" successfully`)
        assert.strictEqual(mem[3], `Finish "${theLogName}" successfully`)
    })
})
