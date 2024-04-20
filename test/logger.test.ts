import { beforeEach, describe, it } from 'node:test'
import { LogFunction, createLog } from '../src/logger.js'
import assert from 'node:assert/strict'
import { doNothingAsync } from './helpers.js'

describe('Given a logger', () => {
    let mem: string[] = []
    const appendToMem = (...msgs: string[]) => {
        mem.push( msgs.join(' ').trim())
    }

    beforeEach(() => mem = [])

    it('when it logs an action then it puts the action log in the middle of its start and finish messages', async () => {
        const log: LogFunction = createLog({
            logStart: appendToMem, 
            logFinish: appendToMem,
            logError: appendToMem,
        })

        await log('A')(async () => await log('B')(async () => ''))

        assert.strictEqual(mem[0], 'A', 'row 1')
        assert.strictEqual(mem[1], '  B', 'row 2')
        assert.strictEqual(mem[2], '  B', 'row 3')
        assert.strictEqual(mem[0], 'A', 'row 4')
    })

    it('when it logs an action then the starting log is independent', async () => {
        const startingLog = (actionName: string) => appendToMem("Starting log and action name:", actionName)
        const log = createLog({logStart: startingLog, logFinish: appendToMem, logError: appendToMem})
        await log('A')(async () => await log('B')(doNothingAsync))
        assert.strictEqual(mem[0], 'Starting log and action name: A')
        assert.strictEqual(mem[1], 'Starting log and action name: B')
        assert.strictEqual(mem[2], 'B')
        assert.strictEqual(mem[3], 'A')
    })

    it('when it logs an action then the ending log is independent', async () => {
        const endingLog = (actionName: string, result: string) => 
            appendToMem("Ending log and action name:", actionName, "with result", result)
        const log = createLog({logStart: appendToMem, logFinish: endingLog, logError: appendToMem})
        await log('A')(async () => await log('B')(async () => 'C'))
        assert.strictEqual(mem[0], 'A')
        assert.strictEqual(mem[1], 'B')
        assert.strictEqual(mem[2], 'Ending log and action name: B with result C')
        assert.strictEqual(mem[3], 'Ending log and action name: A with result C')
    })
})
