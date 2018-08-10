import { expect }       from 'chai'
import { EventHandler } from '../../../src/core/event-handler'

describe('EventHandler', function() {
    describe('constructor()', () => {
        beforeEach(() => {
            this.eventHandler = new EventHandler()
        })
        
        afterEach(() => {
            delete this.eventHandler
        })
        
        test('is a function', () => {
            expect(EventHandler).to.be.a('function')
        })
        
        test('can be used to instantiate a new EventHandler', () => {
            expect(this.eventHandler).to.be.an.instanceof(EventHandler)
        })
        
        test('instantiates [events] as a Map', () => {
            expect(this.eventHandler._events).to.be.an.instanceof(Map)
        })
    })
})