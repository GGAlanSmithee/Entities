import { expect } from 'chai'
import { isPositiveInteger, isPositiveIntegerMsg, } from '../../src/validate/is-positive-integer'

describe('validate', function() {
    describe('isPositiveInteger(value, name = undefined)', () => {
        test('is a function',  () => {
            expect(isPositiveInteger).to.be.a('function')
        })

        test('returns [true] if [value] is a positive integer',  () => {
            expect(isPositiveInteger(1)).to.be.true
            expect(isPositiveInteger(2)).to.be.true
            expect(isPositiveInteger(0)).to.be.true
            expect(isPositiveInteger(9999999999999999999999999999)).to.be.true
        })

        test('returns [false] if [value] is not a positive integer',  () => {
            expect(isPositiveInteger(-1)).to.be.false
            expect(isPositiveInteger('0')).to.be.false
            expect(isPositiveInteger('1')).to.be.false
            expect(isPositiveInteger(1.5)).to.be.false
            expect(isPositiveInteger(99999999999.99)).to.be.false
            expect(isPositiveInteger(new Map())).to.be.false
            expect(isPositiveInteger([])).to.be.false
            expect(isPositiveInteger({})).to.be.false
            expect(isPositiveInteger(new RegExp('.'))).to.be.false
        })

        test('returns an object with [success] and [message] if [name] is a string',  () => {
            const msg = (name = '', value = '') => `${name} must be a positive integer. Got "${value}".`.trim()

            function func1 () { return false }

            let result = isPositiveInteger(func1, 'myFunc')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myFunc', func1))

            class Test {}

            result = isPositiveInteger(new Test(), 'test')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('test', new Test()))

            result = isPositiveInteger(new Array(), 'myArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myArray', new Array()))

            result = isPositiveInteger([], 'myArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myArray', []))

            result = isPositiveInteger({}, 'obj')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('obj', {}))

            result = isPositiveInteger(1, 'aNumber')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('aNumber', 1))

            result = isPositiveInteger('', 'empty')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('empty', ''))

            result = isPositiveInteger('stringaling', 'aString')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('aString', 'stringaling'))

            result = isPositiveInteger(0, 'numnum')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('numnum', 0))

            result = isPositiveInteger(1.25, 'numnum')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('numnum', 1.25))
        })
    })

    describe('isPositiveIntegerMsg', () => {
        test('is a function',  () => {
            expect(isPositiveIntegerMsg).to.be.a('function')
        })

        test('returns an error message',  () => {
            const msg = (name = '', value = '') => `${name} must be a positive integer. Got "${value}".`.trim()
            
            class Test {}
            
            let name = 'key'
            expect(isPositiveIntegerMsg(name, new Test())).to.equal(msg(name, new Test()))

            name = 'test'
            expect(isPositiveIntegerMsg(name, Test)).to.equal(msg(name, Test))

            name = null
            expect(isPositiveIntegerMsg(name, 1)).to.equal(msg(name, 1))

            name = undefined
            expect(isPositiveIntegerMsg(name, 'test')).to.equal(msg(name, 'test'))

            name = 'test2'
            expect(isPositiveIntegerMsg(name, function() { return 'a' })).to.equal(msg(name, function() { return 'a' }))

            name = 'lalala'
            expect(isPositiveIntegerMsg(name, 1.5)).to.equal(msg(name, 1.5))

            name = 'myName'
            expect(isPositiveIntegerMsg(name, new Map())).to.equal(msg(name, new Map()))

            expect(isPositiveIntegerMsg(null, null)).to.equal(msg(null, null))
            
            name = 'empty'
            expect(isPositiveIntegerMsg(name, undefined)).to.equal(msg(name, undefined))

            name = 'testing'
            expect(isPositiveIntegerMsg(name, '')).to.equal(msg(name, ''))

            expect(isPositiveIntegerMsg(undefined, {})).to.equal(msg(undefined, {}))

            name = 'aNonEmptyString!'
            expect(isPositiveIntegerMsg(name, 'i am not empty!')).to.equal(msg(name, 'i am not empty!'))
        })
    })
})