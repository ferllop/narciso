import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createLogFunction, simpleLogFormatter } from '../src/logger.js'
import { doNothingAsync } from './helpers.js'

describe('Given a logger', () => {

    it('when it logs an action then it puts the action log in the middle of its start and finish messages', async () => {
        const log = createLogFunction(simpleLogFormatter)

        await log('A')(async () => await log('B')(async () => {}))

        const mem = log.getLog()
        assert.strictEqual(mem[0], 'Start: A', 'row 1')
        assert.strictEqual(mem[1], 'Start: B', 'row 2')
        assert.strictEqual(mem[2], 'Finish: B', 'row 3')
        assert.strictEqual(mem[3], 'Finish: A', 'row 4')
    })

    it('when it logs an action then the starting log is independent', async () => {
        const formatStart = (actionName: string) => "Starting log and action name: " + actionName
        const log = createLogFunction({...simpleLogFormatter, formatStart})

        await log('A')(async () => await log('B')(doNothingAsync))

        const mem = log.getLog()
        assert.strictEqual(mem[0], 'Starting log and action name: A')
        assert.strictEqual(mem[1], 'Starting log and action name: B')
        assert.strictEqual(mem[2], 'Finish: B')
        assert.strictEqual(mem[3], 'Finish: A')
    })

    it('when it logs an action then the ending log is independent', async () => {
        const formatFinish = (actionName: string, result: unknown) => 
            'Ending log and action name: ' + actionName + (typeof result === 'string' ?  ' with result ' + result : '')
        const log = createLogFunction({...simpleLogFormatter, formatFinish})

        await log('A')(async () => await log('B')(async () => 'C'))

        const mem = log.getLog()
        assert.strictEqual(mem[0], 'Start: A')
        assert.strictEqual(mem[1], 'Start: B')
        assert.strictEqual(mem[2], 'Ending log and action name: B with result C')
        assert.strictEqual(mem[3], 'Ending log and action name: A with result C')
    })
})
