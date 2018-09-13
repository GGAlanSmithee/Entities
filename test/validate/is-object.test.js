import { expect } from 'chai'
import { isObject, isObjectMsg, } from '../../src/validate/is-object'

describe('validate', function() {
    describe('isObject(value, name = undefined)', () => {
        test('is a function',  () => {
            expect(isObject).to.be.a('function')
        })

        test('returns [true] if [value] is an object',  () => {
            class Test {}

            expect(isObject({})).to.be.true
            expect(isObject(new Object())).to.be.true
            expect(isObject(new Test())).to.be.true
            expect(isObject(Object.assign({ a: '1'}, { b: 2, }))).to.be.true
            expect(isObject({ ...{ val: 'hi, '}, lala: 'dada', })).to.be.true
            expect(isObject(Object.create({ name: 'nameless' }))).to.be.true
        })

        test('returns [false] if [value] is not an object',  () => {
            expect(isObject('')).to.be.false
            expect(isObject(null)).to.be.false
            expect(isObject(undefined)).to.be.false
            expect(isObject()).to.be.false
            expect(isObject([])).to.be.false
            expect(isObject(1)).to.be.false
            expect(isObject(1.5)).to.be.false
            expect(isObject(new Map())).to.be.false
            expect(isObject(function() { return 'test' })).to.be.false
        })

        test('returns an object with [success] and [message] if [name] is a string',  () => {
            const msg = (name = '', value = '') => `${name} must be an object. Got "${typeof value}".`.trim()

            class Test {}

            function func1 () { return false }

            let result = isObject(func1, 'myFunc')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myFunc', func1))

            result = isObject(new Test(), 'test')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('test', new Test()))

            result = isObject(new Array(), 'myArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myArray', new Array()))

            result = isObject([], 'myArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myArray', []))

            result = isObject({}, 'obj')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('obj', {}))

            result = isObject(1, 'aNumber')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('aNumber', 1))

            result = isObject('', 'empty')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('empty', ''))

            result = isObject('stringaling', 'aString')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('aString', 'stringaling'))
        })
    })

    describe('isObjectMsg', () => {
        test('is a function',  () => {
            expect(isObjectMsg).to.be.a('function')
        })

        test('returns an error message',  () => {
            const msg = (name = '', value = '') => `${name} must be an object. Got "${typeof value}".`.trim()
            
            class Test {}
            
            let name = 'key'
            expect(isObjectMsg(name, new Test())).to.equal(msg(name, new Test()))

            name = 'test'
            expect(isObjectMsg(name, Test)).to.equal(msg(name, Test))

            name = null
            expect(isObjectMsg(name, {})).to.equal(msg(name, {}))

            name ='myObj'
            expect(isObjectMsg(name, Object.create({ test: 'test', }))).to.equal(msg(name, Object.create({ test: 'test', })))

            name = undefined
            expect(isObjectMsg(name, 'test')).to.equal(msg(name, 'test'))

            name = 'test2'
            expect(isObjectMsg(name, function() { return 'a' })).to.equal(msg(name, function() { return 'a' }))

            name = 'lalala'
            expect(isObjectMsg(name, 1.5)).to.equal(msg(name, 1.5))

            name = 'myName'
            expect(isObjectMsg(name, new Map())).to.equal(msg(name, new Map()))

            expect(isObjectMsg(null, null)).to.equal(msg(null, null))
            
            name = 'empty'
            expect(isObjectMsg(name, undefined)).to.equal(msg(name, undefined))

            name = 'testing'
            expect(isObjectMsg(name, '')).to.equal(msg(name, ''))

            expect(isObjectMsg(undefined, {})).to.equal(msg(undefined, {}))

            name = 'aNonEmptyString!'
            expect(isObjectMsg(name, 'i am not empty!')).to.equal(msg(name, 'i am not empty!'))
        })
    })
})