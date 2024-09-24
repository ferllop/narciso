import { describe, it } from "node:test"
import { assertArraysAreEqual } from "../../custom-asserts.js"
import { createParagraphsOnLog } from "../../../src/domain/logger/final-log-formatter.js"

describe('given createParagraphsOnLog function, when it receives a log as its input', () => {
    it('separate sibling log blocks with empty lines', async () => {
        const log = [
            'Start: A',
            'Start: B',
            'Start: C',
            'Finish: C',
            'Start: D',
            'Finish: D',
            'Start: E',
            'Finish: E',
            'Finish: B',
            'Finish: A',
        ]

        const expectedLog = [
            'Start: A',
            'Start: B',
            'Start: C',
            'Finish: C\n',
            'Start: D',
            'Finish: D\n',
            'Start: E',
            'Finish: E',
            'Finish: B',
            'Finish: A',
        ]
        
        assertArraysAreEqual(createParagraphsOnLog(log), expectedLog)
    })

    it('considers content inside log blocks as not diferent log blocks', async () => {
        const log = [
            'Start: A',
            'Start: B',
            'content in B',
            'Finish: B',
            'Start: C',
            'content in C',
            'Finish: C',
            'Finish: A',
        ]

        const expectedLog = [
            'Start: A',
            'Start: B',
            'content in B',
            'Finish: B\n',
            'Start: C',
            'content in C',
            'Finish: C',
            'Finish: A',
        ]
        
        assertArraysAreEqual(createParagraphsOnLog(log), expectedLog)
    })
})
