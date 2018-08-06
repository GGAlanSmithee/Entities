import { expect } from 'chai'
import { isEntityManager, isEntityManagerMsg, } from '../../src/validate/is-entity-manager'
import { EntityManager } from '../../src/core/entity-manager'

describe('validate', function() {
    describe('isEntityManager', () => {
        test('is a function',  () => {
            expect(isEntityManager).to.be.a('function')
        })

        test('returns [true] if [value] is an instance of EntityManager',  () => {
            expect(isEntityManager(new EntityManager())).to.be.true
        })

        test('returns [false] if [value] is not an instance of EntityManager',  () => {
            class Test {}

            expect(isEntityManager(new Test())).to.be.false
            expect(isEntityManager(function () {})).to.be.false
            expect(isEntityManager()).to.be.false
            expect(isEntityManager({})).to.be.false
            expect(isEntityManager(undefined)).to.be.false
            expect(isEntityManager(null)).to.be.false
            expect(isEntityManager([])).to.be.false
            expect(isEntityManager(new Map())).to.be.false
            expect(isEntityManager(1)).to.be.false
            expect(isEntityManager(1.1)).to.be.false
            expect(isEntityManager('')).to.be.false
            expect(isEntityManager('test')).to.be.false
        })

        test('returns an object with [success] and [message] if [name] is a string',  () => {
            const msg = (name = '', value = '') => `${name} must be an instance of EntityManager. Got "${typeof value}".`.trim()

            let result = isEntityManager(new EntityManager(), 'entityManager')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal(msg('entityManager', new EntityManager()))

            result = isEntityManager(new Array(), 'myArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myArray', new Array()))

            result = isEntityManager([], 'myArray')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('myArray', []))

            result = isEntityManager({}, 'obj')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('obj', {}))

            result = isEntityManager(1, 'aNumber')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal(msg('aNumber', 1))
        })
    })

    describe('isEntityManagerMsg', () => {
        test('is a function',  () => {
            expect(isEntityManagerMsg).to.be.a('function')
        })

        test('returns an error message',  () => {
            const msg = (name = '', value = '') => `${name} must be an instance of EntityManager. Got "${typeof value}".`.trim()

            class Test {}

            let name = 'key'
            expect(isEntityManagerMsg(name, new Test())).to.equal(msg(name, new Test()))

            name = 'test'
            expect(isEntityManagerMsg(name, Test)).to.equal(msg(name, Test))

            name = null
            expect(isEntityManagerMsg(name, 1)).to.equal(msg(name, 1))

            name = undefined
            expect(isEntityManagerMsg(name, 'test')).to.equal(msg(name, 'test'))

            name = 'test2'
            expect(isEntityManagerMsg(name, function() { return 'a' })).to.equal(msg(name, function() { return 'a' }))

            name = 'lalala'
            expect(isEntityManagerMsg(name, 1.5)).to.equal(msg(name, 1.5))

            name = 'myName'
            expect(isEntityManagerMsg(name, new Map())).to.equal(msg(name, new Map()))

            name = 'nothing'
            expect(isEntityManagerMsg(name, null)).to.equal(msg(name, null))

            name = 'nill'
            expect(isEntityManagerMsg(name, undefined)).to.equal(msg(name, undefined))

            expect(isEntityManagerMsg()).to.equal(msg())

            name = ''
            expect(isEntityManagerMsg(name, '')).to.equal(msg(name, ''))
        })
    })
})