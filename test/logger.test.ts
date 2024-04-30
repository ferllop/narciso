import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createLogFunction, createParagraphsOnLog, indentLog, simpleLogFormatter } from '../src/logger.js'
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

describe('given a log', () => {
    it('then it knows how to add indentation to it', async () => {
        const log = [
            'Start: A',
            'Start: B',
            'Start: C',
            'Finish: C',
            'Finish: B',
            'Finish: A',
        ]

        const mem = indentLog(log)
        assert.strictEqual(mem[0], 'Start: A', 'row 1')
        assert.strictEqual(mem[1], '\tStart: B', 'row 2')
        assert.strictEqual(mem[2], '\t\tStart: C', 'row 3')
        assert.strictEqual(mem[3], '\t\tFinish: C', 'row 4')
        assert.strictEqual(mem[4], '\tFinish: B', 'row 5')
        assert.strictEqual(mem[5], 'Finish: A', 'row 6')
    })

    it('then it know how to indent it when there are two siblings log blocks', async () => {
        const date = new Date().toString()
        const log = [
            '#### some heading ####',
            date,
            'Start: A',
            'Start: B',
            'Start: C',
            'Finish: C',
            'Start: D',
            'Finish: D',
            'Finish: B',
            'Finish: A',
        ]

        const mem = indentLog(log, '....')
        assert.strictEqual(mem[0], '#### some heading ####')
        assert.strictEqual(mem[1], date)
        assert.strictEqual(mem[2], 'Start: A', 'row 1')
        assert.strictEqual(mem[3], '....Start: B', 'row 2')
        assert.strictEqual(mem[4], '........Start: C', 'row 3')
        assert.strictEqual(mem[5], '........Finish: C', 'row 4')
        assert.strictEqual(mem[6], '........Start: D', 'row 5')
        assert.strictEqual(mem[7], '........Finish: D', 'row 6')
        assert.strictEqual(mem[8], '....Finish: B', 'row 7')
        assert.strictEqual(mem[9], 'Finish: A', 'row 8')
    })

    it('then it know how to add paragraphs to it', async () => {
        const date = new Date().toString()
        const log = [
            '#### some heading ####',
            date,
            'Start: A',
            'Start: B',
            'Start: C',
            'Finish: C',
            'Start: D',
            'Finish: D',
            'Finish: B',
            'Finish: A',
        ]
        const mem = createParagraphsOnLog(log)
        assert.strictEqual(mem[0], '#### some heading ####')
        assert.strictEqual(mem[1], date)
        assert.strictEqual(mem[2], 'Start: A', 'row 1')
        assert.strictEqual(mem[3], 'Start: B', 'row 2')
        assert.strictEqual(mem[4], 'Start: C', 'row 3')
        assert.strictEqual(mem[5], 'Finish: C\n', 'row 4')
        assert.strictEqual(mem[6], 'Start: D', 'row 5')
        assert.strictEqual(mem[7], 'Finish: D', 'row 6')
        assert.strictEqual(mem[8], 'Finish: B', 'row 7')
        assert.strictEqual(mem[9], 'Finish: A', 'row 8')
    })

})
