import { expect } from 'chai'
import { validateAndThrow } from '../../src/validate'

describe('validateAndThrow(error, ...validations)', function() {
    test('is a function',  () => {
        expect(validateAndThrow).to.be.a('function')
    })

    test('does not throw if all [validations] are [success]ful', () => {
        expect(() => {
            validateAndThrow(
                TypeError,
                { success: true, message: 'message one', },
                { success: true, message: 'message two', },
                { success: true, message: 'message three', },
                { success: true, message: 'message four', },
                { success: true, message: 'message five', },
                { success: true, message: 'message six', },
            )
        }).to.not.throw(TypeError)
    })
    
    test('throws error of type [error] if not all [validations] are [success]ful', () => {
        expect(() => {
            validateAndThrow(
                TypeError,
                { success: true, message: 'message one', },
                { success: true, message: 'message two', },
                { success: false, message: 'message three', },
                { success: true, message: 'message four', },
                { success: true, message: 'message five', },
                { success: true, message: 'message six', },
            )
        }).to.throw(TypeError)
    })

    test('throws error with [message] = all failed validations [message]s', () => {
        expect(() => {
            validateAndThrow(
                TypeError,
                { success: false, message: 'message one', },
                { success: true, message: 'message two', },
                { success: false, message: 'message three', },
                { success: true, message: 'message four', },
                { success: false, message: 'message five', },
                { success: false, message: 'message six', },
            )
        }).to.throw(TypeError, 'message one\nmessage three\nmessage five\nmessage six')
    })
})