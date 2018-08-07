import { expect } from 'chai'
import { isArray, isArrayMsg, } from '../../src/validate/is-array'

describe('validate', function() {
    describe('isArray(value, name = undefined)', () => {
        test('is a function',  () => {
            expect(isArray).to.be.a('function')
        })

        test('returns [true] if [value] is an array',  () => {
            expect(isArray([])).to.be.true
            expect(isArray(new Array())).to.be.true
            expect(isArray(Array.from({ length: 10, }, () => 1))).to.be.true
        })

        test('returns [false] if [value] is not an array',  () => {
            expect(isArray()).to.be.false
            expect(isArray(null)).to.be.false
            expect(isArray(undefined)).to.be.false
            expect(isArray({})).to.be.false
            expect(isArray(new Map())).to.be.false
            expect(isArray('')).to.be.false
            expect(isArray('1,2,3,4')).to.be.false
            expect(isArray(1)).to.be.false
            expect(isArray(1.5)).to.be.false
        })

        test('returns an object with [success] and [message] if [name] is a string',  () => {
            let result = isArray([], 'testArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(`"testArray" must be an array. Got "${typeof []}".`)

            result = isArray(new Array(), 'testArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(`"testArray" must be an array. Got "${typeof new Array()}".`)

            result = isArray(Array.from({ length: 10 }, () => 1), 'testArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(`"testArray" must be an array. Got "${typeof Array.from({ length: 10 }, () => 1)}".`)
        })

        test('returns an object with [success] and [message] if [name] is not a string',  () => {
            let result = isArray(1, 'testArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(`"testArray" must be an array. Got "${typeof 1}".`)

            result = isArray(new Map(), 'testArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(`"testArray" must be an array. Got "${typeof new Map()}".`)

            result = isArray({}, 'testArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(`"testArray" must be an array. Got "${typeof {}}".`)
        })
    })

    describe('isArrayMsg', () => {
        test('is a function',  () => {
            expect(isArrayMsg).to.be.a('function')
        })

        test('returns an error message',  () => {
            const msg = (name = '', value = '') => `"${name}" must be an array. Got "${typeof value}".`.trim()
            
            const name = 'testArray'

            expect(isArrayMsg(name, {})).to.equal(msg(name, {}))
            expect(isArrayMsg(name, new Map())).to.equal(msg(name, new Map()))
            expect(isArrayMsg(name, null)).to.equal(msg(name, null))
            expect(isArrayMsg(name, '')).to.equal(msg(name, ''))
            expect(isArrayMsg(name, 123)).to.equal(msg(name, 123))
            expect(isArrayMsg(null, [])).to.equal(msg(null, []))
            expect(isArrayMsg(undefined, [])).to.equal(msg(undefined, []))
        })
    })
})