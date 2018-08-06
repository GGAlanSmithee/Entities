import { expect } from 'chai'
import { doesNotContain, doesNotContainMsg, } from '../../src/validate/does-not-contain'

describe('validate', function() {
    describe('doesNotContain', () => {
        test('is a function',  () => {
            expect(doesNotContain).to.be.a('function')
        })

        test('returns [false] if [map] contains [key]',  () => {
            const map = new Map([
                ['myKey', 'myVal']
            ])

            expect(doesNotContain(map, 'myKey')).to.be.false
        })

        test('returns [true] if [map] does not contain [key]',  () => {
            const map = new Map([
                ['myKey', 'myVal']
            ])

            expect(doesNotContain(map, 'myKey1')).to.be.true
            expect(doesNotContain(map, null)).to.be.true
            expect(doesNotContain(map, undefined)).to.be.true
            expect(doesNotContain(map)).to.be.true
            expect(doesNotContain(map, [])).to.be.true
            expect(doesNotContain(map, {})).to.be.true
            expect(doesNotContain(map, 1)).to.be.true
            expect(doesNotContain(map, 1.5)).to.be.true
            expect(doesNotContain(map, new Map())).to.be.true
        })

        test('returns [false] if [map] is null or undefined',  () => {
            expect(doesNotContain(null, 'myKey1')).to.be.false
            expect(doesNotContain(undefined, 'myKey1')).to.be.false
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

            let result = doesNotContain(map, key1, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal('"testMap" already contains "testKey1".')

            result = doesNotContain(map, key2, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal('"testMap" already contains "testKey2".')

            result = doesNotContain(map, key3, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal('"testMap" already contains "testKey3".')

            result = doesNotContain(map, key4, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.false
            expect(result).property('message').to.equal('"testMap" already contains "testKey4".')

            result = doesNotContain(map, key5, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal('"testMap" already contains "testKey5".')

            result = doesNotContain(map, key6, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal('"testMap" already contains "testKey6".')
            
            result = doesNotContain(map, key7, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal('"testMap" already contains "testKey7".')

            result = doesNotContain(map, key8, 'testMap')

            expect(result).to.be.an('object')
            expect(result).property('success').to.be.true
            expect(result).property('message').to.equal('"testMap" already contains "testKey8".')
        })
    })

    describe('doesNotContainMsg', () => {
        test('is a function',  () => {
            expect(doesNotContainMsg).to.be.a('function')
        })

        test('returns an error message',  () => {
            const msg = (key = '', mapName = '') => `"${mapName}" already contains "${key}".`.trim()
            
            let testMapName = 'testMap'
            let testKey = 'testKey'

            expect(doesNotContainMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = ''
            testKey = 'testKey'

            expect(doesNotContainMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = 'testMap'
            testKey = ''

            expect(doesNotContainMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = ''
            testKey = ''

            expect(doesNotContainMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = null
            testKey = 'testKey'

            expect(doesNotContainMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = 'testKey'
            testKey = null

            expect(doesNotContainMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = undefined
            testKey = null

            expect(doesNotContainMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = undefined
            testKey = 'testKey'

            expect(doesNotContainMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))

            testMapName = undefined
            testKey = undefined

            expect(doesNotContainMsg(testKey, testMapName)).to.equal(msg(testKey, testMapName))
        })
    })
})