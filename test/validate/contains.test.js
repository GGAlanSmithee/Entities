// todo add tests for all validate functions

import { expect } from 'chai'
import { contains, containsMsg, } from '../../src/validate/contains'

describe('validate', function() {
    describe('contains', function() {
        test('is a function',  () => {
            expect(contains).to.be.a('function')
        })

        test('returns [true] if [map] contains [key]',  () => {
            const map = new Map([
                ['myKey', 'myVal']
            ])

            expect(contains(map, 'myKey')).to.be.true
        })

        test('returns [false] if [map] does not contain [key]',  () => {
            const map = new Map([
                ['myKey', 'myVal']
            ])

            expect(contains(map, 'myKey1')).to.be.false
            expect(contains(map, null)).to.be.false
            expect(contains(map, undefined)).to.be.false
            expect(contains(map)).to.be.false
            expect(contains(map, [])).to.be.false
            expect(contains(map, {})).to.be.false
            expect(contains(map, 1)).to.be.false
            expect(contains(map, 1.5)).to.be.false
            expect(contains(map, new Map())).to.be.false
        })

        test('returns [false] if [map] is null or undefined',  () => {
            expect(contains(null, 'myKey1')).to.be.false
            expect(contains(undefined, 'myKey1')).to.be.false
        })

        test('returns an object with [success] and [message] if [mapName] is a string',  () => {
            const key1 = 'testKey1'
            const key2 = 'testKey2'
            const key3 = 'testKey3'
            const key4 = 'testKey4'
            const key5 = 'testKey5'
            const key6 = 'testKey6'
            const key7 = 'testKey7'
            const key8 = 'testKey8'
            
            const map = new Map([
                [key1, 'test'],
                [key2, 'test'],
                [key3, 'test'],
                [key4, 'test'],
            ])

            let result = contains(map, key1, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal('"testMap" does not contain "testKey1".')

            result = contains(map, key2, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal('"testMap" does not contain "testKey2".')

            result = contains(map, key3, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal('"testMap" does not contain "testKey3".')

            result = contains(map, key4, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal('"testMap" does not contain "testKey4".')

            result = contains(map, key5, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal('"testMap" does not contain "testKey5".')

            result = contains(map, key6, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal('"testMap" does not contain "testKey6".')
            
            result = contains(map, key7, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal('"testMap" does not contain "testKey7".')

            result = contains(map, key8, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal('"testMap" does not contain "testKey8".')
        })
    })

    describe('containsMsg', () => {
        test('is a function',  () => {
            expect(containsMsg).to.be.a('function')
        })

        test('returns an error message',  () => {
            const msg = (key = '', mapName = '') => `"${mapName}" does not contain "${key}".`.trim()
            
            let testMapName = 'testMap'
            let testKey = 'testKey'

            expect(containsMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = ''
            testKey = 'testKey'

            expect(containsMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = 'testMap'
            testKey = ''

            expect(containsMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = ''
            testKey = ''

            expect(containsMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = null
            testKey = 'testKey'

            expect(containsMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = 'testKey'
            testKey = null

            expect(containsMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = undefined
            testKey = null

            expect(containsMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = undefined
            testKey = 'testKey'

            expect(containsMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = undefined
            testKey = undefined

            expect(containsMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))
        })
    })
})