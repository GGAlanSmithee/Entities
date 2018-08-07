import { expect } from 'chai'
import { isNonEmptyString, isNonEmptyStringMsg, } from '../../src/validate/is-non-empty-string'

describe('validate', function() {
    describe('isNonEmptyString(value, name = undefined)', () => {
        test('is a function',  () => {
            expect(isNonEmptyString).to.be.a('function')
        })

        test('returns [true] if [value] is a non empty string',  () => {
            expect(isNonEmptyString('test')).to.be.true
            expect(isNonEmptyString('0')).to.be.true
            expect(isNonEmptyString('null')).to.be.true
            expect(isNonEmptyString('undefined')).to.be.true
            expect(isNonEmptyString(' ')).to.be.true
        })

        test('returns [false] if [value] is not a non empty string',  () => {
            expect(isNonEmptyString('')).to.be.false
            expect(isNonEmptyString(null)).to.be.false
            expect(isNonEmptyString(undefined)).to.be.false
            expect(isNonEmptyString()).to.be.false
            expect(isNonEmptyString([])).to.be.false
            expect(isNonEmptyString(1)).to.be.false
            expect(isNonEmptyString(1.5)).to.be.false
            expect(isNonEmptyString(new Map())).to.be.false
            expect(isNonEmptyString(function() { return 'test' })).to.be.false
            expect(isNonEmptyString({})).to.be.false
        })

        test('returns an object with [success] and [message] if [name] is a string',  () => {
            const msg = (name = '', value = '') => `"${name}" must be a non-empty string. Got "${value}".`.trim()

            class Test {}

            function func1 () { return false }

            let result = isNonEmptyString(func1, 'myFunc')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myFunc', func1))

            const func2 = function() { return true }

            result = isNonEmptyString(func2, 'myFunc')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myFunc', func2))

            const func3 = () => false

            result = isNonEmptyString(func3, 'myFunc')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myFunc', func3))

            const func4 = new Function('numberA', 'numberB',
                'return numberA + numberB'
            )

            result = isNonEmptyString(func4, 'myFunc')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myFunc', func4))

            result = isNonEmptyString(new Test(), 'test')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('test', new Test()))

            result = isNonEmptyString(new Array(), 'myArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myArray', new Array()))

            result = isNonEmptyString([], 'myArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myArray', []))

            result = isNonEmptyString({}, 'obj')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('obj', {}))

            result = isNonEmptyString(1, 'aNumber')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('aNumber', 1))

            result = isNonEmptyString('', 'empty')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('empty', ''))

            result = isNonEmptyString('stringaling', 'aString')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('aString', 'stringaling'))
        })
    })

    describe('isNonEmptyStringMsg', () => {
        test('is a function',  () => {
            expect(isNonEmptyStringMsg).to.be.a('function')
        })

        test('returns an error message',  () => {
            const msg = (name = '', value = '') => `"${name}" must be a non-empty string. Got "${value}".`.trim()
            
            class Test {}
            
            let name = 'key'
            expect(isNonEmptyStringMsg(name, new Test())).to.equal(msg(name, new Test()))

            name = 'test'
            expect(isNonEmptyStringMsg(name, Test)).to.equal(msg(name, Test))

            name = null
            expect(isNonEmptyStringMsg(name, 1)).to.equal(msg(name, 1))

            name = undefined
            expect(isNonEmptyStringMsg(name, 'test')).to.equal(msg(name, 'test'))

            name = 'test2'
            expect(isNonEmptyStringMsg(name, function() { return 'a' })).to.equal(msg(name, function() { return 'a' }))

            name = 'lalala'
            expect(isNonEmptyStringMsg(name, 1.5)).to.equal(msg(name, 1.5))

            name = 'myName'
            expect(isNonEmptyStringMsg(name, new Map())).to.equal(msg(name, new Map()))

            expect(isNonEmptyStringMsg(null, null)).to.equal(msg(null, null))
            
            name = 'empty'
            expect(isNonEmptyStringMsg(name, undefined)).to.equal(msg(name, undefined))

            name = 'testing'
            expect(isNonEmptyStringMsg(name, '')).to.equal(msg(name, ''))

            expect(isNonEmptyStringMsg(undefined, {})).to.equal(msg(undefined, {}))

            name = 'aNonEmptyString!'
            expect(isNonEmptyStringMsg(name, 'i am not empty!')).to.equal(msg(name, 'i am not empty!'))
        })
    })
})