import { expect } from 'chai'
import { isFunction, isFunctionMsg, } from '../../src/validate/is-function'

describe('validate', function() {
    describe('isFunction', function() {
        test('is a function',  () => {
            expect(isFunction).to.be.a('function')
        })

        test('returns [true] if [value] is a function',  () => {
            function func1 () { return false }
            const func2 = function() { return true }
            const func3 = () => false
            const func4 = new Function('numberA', 'numberB',
                'return numberA + numberB'
            )

            expect(isFunction(func1)).to.be.true
            expect(isFunction(func2)).to.be.true
            expect(isFunction(func3)).to.be.true
            expect(isFunction(func4)).to.be.true
        })

        test('returns [false] if [value] is not a function',  () => {
            class Test {}

            expect(isFunction(new Test())).to.be.false
            expect(isFunction()).to.be.false
            expect(isFunction({})).to.be.false
            expect(isFunction(undefined)).to.be.false
            expect(isFunction(null)).to.be.false
            expect(isFunction([])).to.be.false
            expect(isFunction(new Map())).to.be.false
            expect(isFunction(1)).to.be.false
            expect(isFunction(1.1)).to.be.false
            expect(isFunction('')).to.be.false
            expect(isFunction('test')).to.be.false
        })

        test('returns an object with [success] and [message] if [name] is a string',  () => {
            const msg = (name = '', value = '') => `"${name}" must be a function. Got "${typeof value}".`.trim()

            class Test {}

            function func1 () { return false }

            let result = isFunction(func1, 'myFunc')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('myFunc', func1))

            const func2 = function() { return true }

            result = isFunction(func2, 'myFunc')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('myFunc', func2))

            const func3 = () => false

            result = isFunction(func3, 'myFunc')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('myFunc', func3))

            const func4 = new Function('numberA', 'numberB',
                'return numberA + numberB'
            )

            result = isFunction(func4, 'myFunc')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('myFunc', func4))

            result = isFunction(new Test(), 'entityManager')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('entityManager', new Test()))

            result = isFunction(new Array(), 'myArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myArray', new Array()))

            result = isFunction([], 'myArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myArray', []))

            result = isFunction({}, 'obj')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('obj', {}))

            result = isFunction(1, 'aNumber')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('aNumber', 1))
        })
    })

    describe('isFunctionMsg', () => {
        test('is a function',  () => {
            expect(isFunctionMsg).to.be.a('function')
        })

        test('returns an error message',  () => {
            const msg = (name = '', value = '') => `"${name}" must be a function. Got "${typeof value}".`.trim()
            
            class Test {}
            
            let name = 'key'
            expect(isFunctionMsg(name, new Test())).to.equal(msg(name, new Test()))

            name = 'test'
            expect(isFunctionMsg(name, Test)).to.equal(msg(name, Test))

            name = null
            expect(isFunctionMsg(name, 1)).to.equal(msg(name, 1))

            name = undefined
            expect(isFunctionMsg(name, 'test')).to.equal(msg(name, 'test'))

            name = 'test2'
            expect(isFunctionMsg(name, function() { return 'a' })).to.equal(msg(name, function() { return 'a' }))

            name = 'lalala'
            expect(isFunctionMsg(name, 1.5)).to.equal(msg(name, 1.5))

            name = 'myName'
            expect(isFunctionMsg(name, new Map())).to.equal(msg(name, new Map()))

            expect(isFunctionMsg(null, null)).to.equal(msg(null, null))
            
            name = 'empty'
            expect(isFunctionMsg(name, undefined)).to.equal(msg(name, undefined))

            name = 'testing'
            expect(isFunctionMsg(name, '')).to.equal(msg(name, ''))

            expect(isFunctionMsg(undefined, {})).to.equal(msg(undefined, {}))
        })
    })
})