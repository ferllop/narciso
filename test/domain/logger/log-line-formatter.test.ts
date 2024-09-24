import { describe, it } from "node:test"
import { assertArraysAreEqual } from "../../custom-asserts.js"
import { indentLog } from "../../../src/domain/logger/final-log-formatter.js"

describe('given indentLog function, when it receives a log as input', () => {
    it('indents child log blocks', async () => {
        const inputLog = [
            'Start: A',
            'Start: B',
            'Start: C',
            'Finish: C',
            'Finish: B',
            'Finish: A',
        ]

        const expectedLog = [
            'Start: A',
            '> Start: B',
            '> > Start: C',
            '> > Finish: C',
            '> Finish: B',
            'Finish: A',
        ]

        assertArraysAreEqual(indentLog(inputLog, '> '), expectedLog)
    })

    it('gives same indentation to sibling log blocks', async () => {
        const log = [
            'Start: A',
            'Start: B',
            'Finish: B',
            'Start: C',
            'Finish: C',
            'Start: D',
            'Finish: D',
            'Finish: A',
        ]

        const expectedLog = [
            'Start: A',
            '> Start: B',
            '> Finish: B',
            '> Start: C',
            '> Finish: C',
            '> Start: D',
            '> Finish: D',
            'Finish: A',
        ]

        assertArraysAreEqual(indentLog(log, '> '), expectedLog)
    })

    it('gives same indentation to sibling log blocks deeply nested', async () => {
        const log = [
            'Start: A',
            'Start: B',
            'Start: C',
            'Start: D',
            'Finish: D',
            'Start: E',
            'Finish: E',
            'Start: F',
            'Finish: F',
            'Finish: C',
            'Finish: B',
            'Finish: A',
        ]

        const expectedLog = [
            'Start: A',
            '> Start: B',
            '> > Start: C',
            '> > > Start: D',
            '> > > Finish: D',
            '> > > Start: E',
            '> > > Finish: E',
            '> > > Start: F',
            '> > > Finish: F',
            '> > Finish: C',
            '> Finish: B',
            'Finish: A',
        ]

        assertArraysAreEqual(indentLog(log, '> '), expectedLog)
    })

    it('does not creates indentation below lines not starting with the words "start" or "finish"', async () => {
        const log = [
            'some text',
            'start: A',
            'start: B',
            'finish: B',
            'finish: A',
        ]

        const expectedLog = [
            'some text',
            'start: A',
            '> start: B',
            '> finish: B',
            'finish: A',
        ]

        assertArraysAreEqual(indentLog(log, '> '), expectedLog)
    })

    it('puts text belonging to a block indented inside the log block', async () => {
        const log = [
            'start: A',
            'start: B',
            'some text',
            'finish: B',
            'finish: A',
        ]

        const expectedLog = [
            'start: A',
            '> start: B',
            '> > some text',
            '> finish: B',
            'finish: A',
        ]

        assertArraysAreEqual(indentLog(log, '> '), expectedLog)
    })

    it('detect words "start" or "finish" in a case insensitive manner', async () => {
        const log = [
            'START: A',
            'staRT: B',
            'STArt: C',
            'fiNISh: C',
            'finiSh: B',
            'FInisH: A',
        ]

        const expectedLog = [
            'START: A',
            '> staRT: B',
            '> > STArt: C',
            '> > fiNISh: C',
            '> finiSh: B',
            'FInisH: A',
        ]

        assertArraysAreEqual(indentLog(log, '> '), expectedLog)
    })

    it('when a line contains "start" or "finish" but not start with that word, it is not considered a new block', async () => {
        const log = [
            'start: A',
            'start: B',
            'some start',
            'finish: B',
            'start: C',
            'some finish',
            'finish: C',
            'finish: A',
        ]

        const expectedLog = [
            'start: A',
            '> start: B',
            '> > some start',
            '> finish: B',
            '> start: C',
            '> > some finish',
            '> finish: C',
            'finish: A',
        ]

        assertArraysAreEqual(indentLog(log, '> '), expectedLog)
    })

    it('empty lines are not indented', async () => {
        const log = [
            'start: A',
            '',
            'start: B',
            'some start',
            'finish: B',
            'start: C',
            'some finish',
            'finish: C',
            'finish: A',
        ]

        const expectedLog = [
            'start: A',
            '',
            '> start: B',
            '> > some start',
            '> finish: B',
            '> start: C',
            '> > some finish',
            '> finish: C',
            'finish: A',
        ]

        assertArraysAreEqual(indentLog(log, '> '), expectedLog)
    })
})
