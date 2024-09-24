import assert from 'node:assert'
import { describe, it } from 'node:test'
import { createLogFunction } from '../../../src/domain/logger/logger.js'
import { LogLineFormatter } from '../../../src/domain/logger/log-line-formatter.js'

const id = <T>(x: T) => x
const simpleLogFormatter: LogLineFormatter = {
    formatStart: (action: string) => `Start: ${action}`,
    formatFinish: (action: string) => `Finish: ${action}`,
    formatError: id,
    formatOther: id,
}
const doNothing = async () => {}

describe('Given a logger', () => {

    it('when it logs an action then it puts the action log in the middle of its start and finish messages', async () => {
        const log = createLogFunction(simpleLogFormatter, [])

        await log('A', () => log('B', async () => {}))

        assert.deepStrictEqual(
            log.getLog(), 
            [
                'Start: A',
                'Start: B',
                'Finish: B',
                'Finish: A',
            ])
    })

    
    it('when it logs an action then the starting log is independent', async () => {
        const formatStart = (actionName: string) => "Starting log and action name: " + actionName
        const log = createLogFunction({...simpleLogFormatter, formatStart}, [])

        await log('A', () => log('B', doNothing))

        assert.deepStrictEqual(
            log.getLog(),
            [
                'Starting log and action name: A',
                'Starting log and action name: B',
                'Finish: B',
                'Finish: A',
            ])
    })

    it('when it logs an action then the ending log is independent', async () => {
        const formatFinish = (actionName: string) => 
            `Ending log and action name: ${actionName}`
        const log = createLogFunction({...simpleLogFormatter, formatFinish}, [])

        await log('A', () => log('B', doNothing))

        assert.deepStrictEqual(
            log.getLog(),
            [
                'Start: A',
                'Start: B',
                'Ending log and action name: B',
                'Ending log and action name: A',
            ])
    })

    it('when it logs an action then the ending log formatter receives the result', async () => {
        const formatFinish = (actionName: string, result: unknown) => 
            `Ending log and action name: ${actionName} with result ${result}`
        const log = createLogFunction({...simpleLogFormatter, formatFinish}, [])

        await log('A', () => log('B', async () => 'C'))

        assert.deepStrictEqual(
            log.getLog(),
            [
                'Start: A',
                'Start: B',
                'Ending log and action name: B with result C',
                'Ending log and action name: A with result C',
            ])
    })
})
