import { expect } from 'chai'
import { validate } from '../../src/validate'

describe('validate(...validations)', function() {
    test('is a function',  () => {
        expect(validate).to.be.a('function')
    })

    test('returns an object with a [success] and a [message] property', () => {
        const validation = validate()

        expect(validation).to.be.an('object')
        expect(validation).property('success').to.be.a('boolean')
        expect(validation).property('message').to.be.a('string')
    })
    
    test('sets [success] to true, if all [validations] are [success]ful', () => {
        const validation = validate(
            { success: true, message: 'message one', },
            { success: true, message: 'message two', },
            { success: true, message: 'message three', },
            { success: true, message: 'message four', },
            { success: true, message: 'message five', },
            { success: true, message: 'message six', },
        )

        expect(validation).to.be.an('object')
        expect(validation).property('success').to.be.true
    })

    test('sets [validation.success] to false, if one or more of [validations] is not [success]ful', () => {
        const validation = validate(
            { success: true, message: 'message one', },
            { success: true, message: 'message two', },
            { success: false, message: 'message three', },
            { success: true, message: 'message four', },
            { success: true, message: 'message five', },
            { success: true, message: 'message six', },
        )

        expect(validation).to.be.an('object')
        expect(validation).property('success').to.be.false
    })

    test('sets [validation.message] to all failed validations [message]', () => {
        const validation = validate(
            { success: true, message: 'message one', },
            { success: false, message: 'message two', },
            { success: false, message: 'message three', },
            { success: true, message: 'message four', },
            { success: false, message: 'message five', },
            { success: true, message: 'message six', },
        )

        const message = 'message two\nmessage three\nmessage five'

        expect(validation).to.be.an('object')
        expect(validation).property('success').to.be.false
        expect(validation).property('message').to.equal(message)
    })
})