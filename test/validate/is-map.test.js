import { expect } from 'chai'
import { isMap, isMapMsg, } from '../../src/validate/is-map'

describe('validate', function() {
    describe('isMap(value, name = undefined)', () => {
        test('is a function',  () => {
            expect(isMap).to.be.a('function')
        })

        test('returns [true] if [value] is an map',  () => {
            expect(isMap(new Map())).to.be.true
            expect(isMap(new Map([[1, 'test' ], [ 2, 'test again']]))).to.be.true
        })

        test('returns [false] if [value] is not an map',  () => {
            expect(isMap()).to.be.false
            expect(isMap(null)).to.be.false
            expect(isMap(undefined)).to.be.false
            expect(isMap({})).to.be.false
            expect(isMap(new Array())).to.be.false
            expect(isMap('')).to.be.false
            expect(isMap('1,2,3,4')).to.be.false
            expect(isMap(1)).to.be.false
            expect(isMap(1.5)).to.be.false
        })

        test('returns an object with [success] and [message] if [name] is a string',  () => {
            let result = isMap(new Map(), 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(`"testMap" must be a map. Got "${typeof new Map()}".`)

            const testMap = new Map([['a', { val: 'value'}],['b', { val: 'another value'}]])

            result = isMap(testMap, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(`"testMap" must be a map. Got "${typeof testMap}".`)
        })

        test('returns an object with [success] and [message] if [name] is not a string',  () => {
            let result = isMap(1, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(`"testMap" must be a map. Got "${typeof 1}".`)

            result = isMap([], 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(`"testMap" must be a map. Got "${typeof new Map()}".`)

            result = isMap({}, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(`"testMap" must be a map. Got "${typeof {}}".`)
        })
    })

    describe('isMapMsg', () => {
        test('is a function',  () => {
            expect(isMapMsg).to.be.a('function')
        })

        test('returns an error message',  () => {
            const msg = (name = '', value = '') => `"${name}" must be a map. Got "${typeof value}".`.trim()
            
            const name = 'testMap'

            expect(isMapMsg(name, {})).to.equal(msg(name, {}))
            expect(isMapMsg(name, [])).to.equal(msg(name, []))
            expect(isMapMsg(name, null)).to.equal(msg(name, null))
            expect(isMapMsg(name, '')).to.equal(msg(name, ''))
            expect(isMapMsg(name, 123)).to.equal(msg(name, 123))
            expect(isMapMsg(null, new Map())).to.equal(msg(null, new Map()))
            expect(isMapMsg(undefined, new Map())).to.equal(msg(undefined, new Map()))
        })
    })
})