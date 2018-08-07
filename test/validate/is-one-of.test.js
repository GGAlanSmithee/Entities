import { expect } from 'chai'
import { isOneOf, isOneOfMsg, } from '../../src/validate/is-one-of'

describe('validate', function() {
    beforeAll(() => {
        this.TestType = {
            Type0 : 0,
            Type1 : 1,
            Type2 : 2
        }
    })

    describe('isOneOf(Type, value, name = undefined)', () => {
        test('is a function',  () => {
            expect(isOneOf).to.be.a('function')
        })

        test('returns [true] if [value] is one of [Type]',  () => {
            expect(isOneOf(this.TestType, this.TestType.Type0)).to.be.true
            expect(isOneOf(this.TestType, this.TestType.Type1)).to.be.true
            expect(isOneOf(this.TestType, this.TestType.Type2)).to.be.true
            expect(isOneOf(this.TestType, 0)).to.be.true
            expect(isOneOf(this.TestType, 1)).to.be.true
            expect(isOneOf(this.TestType, 2)).to.be.true
        })

        test('returns [true] if [value] is not one of [Type]',  () => {
            expect(isOneOf(this.TestType, '0')).to.be.false
            expect(isOneOf(this.TestType, '1')).to.be.false
            expect(isOneOf(this.TestType, '2')).to.be.false
            expect(isOneOf(this.TestType, '')).to.be.false
            expect(isOneOf(this.TestType, {})).to.be.false
            expect(isOneOf(this.TestType, [])).to.be.false
            expect(isOneOf(this.TestType, new Map())).to.be.false
            expect(isOneOf(this.TestType, undefined)).to.be.false
            expect(isOneOf(this.TestType, null)).to.be.false
            expect(isOneOf(this.TestType)).to.be.false
            expect(isOneOf(this.TestType, -1)).to.be.false
            expect(isOneOf(this.TestType, 3)).to.be.false
            expect(isOneOf(null, this.TestType.Type0)).to.be.false
            expect(isOneOf(undefined, this.TestType.Type0)).to.be.false
            expect(isOneOf()).to.be.false
            expect(isOneOf([], this.TestType.Type0)).to.be.false
            expect(isOneOf({}, this.TestType.Type0)).to.be.false
            expect(isOneOf(new Map(), this.TestType.Type0)).to.be.false
        })

        test('returns an object with [success] and [message] if [name] is a string',  () => {
            const msg = (values = '', name = '', value = '') => `"${name}" must be one of ${values}. Got "${value}".`.trim()
            
            let obj = this.TestType
            let value = this.TestType.Type1
            let values = Object.keys(obj).map(k => obj[k]).join(', ')
            let result = isOneOf(obj, value, 'TestType')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg(values, 'TestType', value))

            obj = {}
            value = this.TestType.Type1
            values = Object.keys(obj).map(k => obj[k]).join(', ')
            result = isOneOf(obj, value, 'TestType')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg(values, 'TestType', value))

            obj = []
            value = this.TestType.Type1
            values = Object.keys(obj).map(k => obj[k]).join(', ')
            result = isOneOf(obj, value, 'TestType')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg(values, 'TestType', value))

            obj = ''
            value = []
            values = Object.keys(obj).map(k => obj[k]).join(', ')
            result = isOneOf(obj, value, 'TestType')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg(values, 'TestType', value))

            obj = {}
            value = []
            values = Object.keys(obj).map(k => obj[k]).join(', ')
            result = isOneOf(obj, value, 'TestType')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg(values, 'TestType', value))

            obj = ''
            value = undefined
            values = Object.keys(obj).map(k => obj[k]).join(', ')
            result = isOneOf(obj, value, 'TestType')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg(values, 'TestType', value))

            obj = {}
            value = '2'
            values = Object.keys(obj).map(k => obj[k]).join(', ')
            result = isOneOf(obj, value, 'TestType')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg(values, 'TestType', value))

            obj = this.TestType
            value = undefined
            values = Object.keys(obj).map(k => obj[k]).join(', ')
            result = isOneOf(obj, value, null)

            expect(result).to.not.be.an('object')
            expect(result).to.be.false

            obj = null
            value = undefined
            values = undefined
            result = isOneOf(obj, value, 'TestType')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg(values, 'TestType', value))
        })
    })

    describe('isOneOfMsg', () => {
        test('is a function',  () => {
            expect(isOneOfMsg).to.be.a('function')
        })

        test('returns an error message',  () => {
            const msg = (values = '', name = '', value = '') => `"${name}" must be one of ${values}. Got "${value}".`.trim()

            let obj = this.TestType
            let value = this.TestType.Type1
            let values = Object.keys(obj).map(k => obj[k]).join(', ')
            let name = 'type'
            
            expect(isOneOfMsg(values, name, value)).to.equal(msg(values, name, value))

            obj = {}
            value = this.TestType.Type1
            values = Object.keys(obj).map(k => obj[k]).join(', ')
            name = 'type'
            
            expect(isOneOfMsg(values, name, value)).to.equal(msg(values, name, value))

            obj = {}
            value = ''
            values = Object.keys(obj).map(k => obj[k]).join(', ')
            name = 'type'
            
            expect(isOneOfMsg(values, name, value)).to.equal(msg(values, name, value))

            obj = {}
            value = this.TestType.Type1
            values = ''
            name = 'type'
            
            expect(isOneOfMsg(values, name, value)).to.equal(msg(values, name, value))

            obj = {}
            value = undefined
            values = Object.keys(obj).map(k => obj[k]).join(', ')
            name = 'type'
            
            expect(isOneOfMsg(values, name, value)).to.equal(msg(values, name, value))

            obj = []
            value = null
            values = Object.keys(obj).map(k => obj[k]).join(', ')
            name = undefined
            
            expect(isOneOfMsg(values, name, value)).to.equal(msg(values, name, value))
        })
    })
})