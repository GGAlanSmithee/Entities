// todo add tests for all validate functions

import { expect } from 'chai'
import { isDefined, isDefinedMsg, } from '../../src/validate/is-defined'

describe('validate', function() {
    describe('isDefined', function() {
        test('is a function',  () => {
            expect(isDefined).to.be.a('function')
        })

        test('returns [true] if [value] is defined',  () => {
            expect(isDefined([])).to.be.true
            expect(isDefined(new Map())).to.be.true
            expect(isDefined({})).to.be.true
            expect(isDefined(1)).to.be.true
            expect(isDefined(1.5)).to.be.true
            expect(isDefined('')).to.be.true
            expect(isDefined('test')).to.be.true
            expect(isDefined(-1)).to.be.true
            expect(isDefined(0)).to.be.true
        })

        test('returns [false] if [value] is not defined',  () => {
            expect(isDefined()).to.be.false
            expect(isDefined(null)).to.be.false
            expect(isDefined(undefined)).to.be.false
        })

        test('returns an object with [success] and [message] if [name] is a string',  () => {
            const msg = (name = '', value = '') => `"${name}" must be defined. Got "${value}".`.trim()

            let result = isDefined([], 'key')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('key', []))

            result = isDefined(new Map(), 'key')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('key', new Map()))

            result = isDefined({}, 'key')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('key', {}))

            result = isDefined(1, 'key')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('key', 1))
        })

        test('returns an object with [success] and [message] if [name] is not a string',  () => {
            const msg = (name = '', value = '') => `"${name}" must be defined. Got "${value}".`.trim()

            let result = isDefined(null, 'key')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('key', null))

            result = isDefined(undefined, 'key')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('key', undefined))

        })
    })

    describe('isDefinedMsg', () => {
        test('is a function',  () => {
            expect(isDefinedMsg).to.be.a('function')
        })

        test('returns an error message',  () => {
            const msg = (name = '', value = '') => `"${name}" must be defined. Got "${value}".`.trim()

            let name = 'key'

            expect(isDefinedMsg(name, null)).to.equal(msg(name, null))
            expect(isDefinedMsg(name, undefined)).to.equal(msg(name, undefined))
            expect(isDefinedMsg(name)).to.equal(msg(name))
        })
    })
})