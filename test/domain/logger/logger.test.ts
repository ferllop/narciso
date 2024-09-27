import assert from 'node:assert'
import { describe, it } from 'node:test'
import { Logger } from '../../../src/domain/logger/logger.js'
import { LogEntryFormatter } from '../../../src/domain/logger/log-entry-formatter.js'

const id = <T>(x: T) => x
const simpleEntryFormatter: LogEntryFormatter = {
    formatStart: (action: string) => `Start: ${action}`,
    formatFinish: (action: string) => `Finish: ${action}`,
    formatError: id,
    formatOther: id,
}
const doNothing = async () => {}

describe('Given a logger', () => {

    it('when it logs an action then it puts the action log in the middle of its start and finish messages', async () => {
        const logger = new Logger(simpleEntryFormatter, [])

        await logger.log('A', () => logger.log('B', async () => {}))

        assert.deepStrictEqual(
            logger.getEntries(), 
            [
                'Start: A',
                'Start: B',
                'Finish: B',
                'Finish: A',
            ])
    })

    
    it('when it logs an action then the starting log is independent', async () => {
        const formatStart = (actionName: string) => "Starting log and action name: " + actionName
        const logger = new Logger({...simpleEntryFormatter, formatStart}, [])

        await logger.log('A', () => logger.log('B', doNothing))

        assert.deepStrictEqual(
            logger.getEntries(),
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
        const logger = new Logger({...simpleEntryFormatter, formatFinish}, [])

        await logger.log('A', () => logger.log('B', doNothing))

        assert.deepStrictEqual(
            logger.getEntries(),
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
        const logger = new Logger({...simpleEntryFormatter, formatFinish}, [])

        await logger.log('A', () => logger.log('B', async () => 'C'))

        assert.deepStrictEqual(
            logger.getEntries(),
            [
                'Start: A',
                'Start: B',
                'Ending log and action name: B with result C',
                'Ending log and action name: A with result C',
            ])
    })
})
