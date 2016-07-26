import { expect }       from 'chai'
import { EventHandler } from '../../src/core/event-handler'

describe('EventHandler', function() {
    describe('listen(event, callback)', () => {
        beforeEach(() => {
            this.eventHandler = new EventHandler()
        })
        
        afterEach(() => {
            delete this.eventHandler
        })
        
        it('is a function', () => {
            expect(this.eventHandler.listen).to.be.a('function')
        })
        
        it('adds the [callback] for the [event] and returns an [eventId]', () => {
            let callback = function() {
                this.a = 'A'
                this.b = 'B'
            }
            
            let eventId = this.eventHandler.listen('onEvent', callback)
            expect(eventId).to.equal(0)
            expect(this.eventHandler.events.get('onEvent').has(eventId)).to.be.true
            expect(this.eventHandler.events.get('onEvent').get(eventId)).to.equal(callback)
            
            eventId = this.eventHandler.listen('onEvent', callback)
            expect(eventId).to.equal(1)
            expect(this.eventHandler.events.get('onEvent').has(eventId)).to.be.true
            expect(this.eventHandler.events.get('onEvent').get(eventId)).to.equal(callback)
            
            eventId = this.eventHandler.listen('onEvent', callback)
            expect(eventId).to.equal(2)
            expect(this.eventHandler.events.get('onEvent').has(eventId)).to.be.true
            expect(this.eventHandler.events.get('onEvent').get(eventId)).to.equal(callback)
            
            eventId = this.eventHandler.listen('onAnotherEvent', callback)
            expect(eventId).to.equal(3)
            expect(this.eventHandler.events.get('onEvent').has(eventId)).to.be.false
            expect(this.eventHandler.events.get('onEvent').get(eventId)).to.be.undefined
            expect(this.eventHandler.events.get('onAnotherEvent').has(eventId)).to.be.true
            expect(this.eventHandler.events.get('onAnotherEvent').get(eventId)).to.equal(callback)
        })
        
        it('does not add the [callback] for the [event] if [callback] is not a function', () => {
            let eventId = this.eventHandler.listen('onEvent')
            expect(eventId).to.be.undefined
            expect(this.eventHandler.events.has('onEvent')).to.be.false
            
            this.eventHandler.listen('onEvent', () => { })
            
            eventId = this.eventHandler.listen('onEvent')
            expect(eventId).to.be.undefined
            expect(this.eventHandler.events.has('onEvent')).to.be.true
            expect(this.eventHandler.events.get('onEvent').has(eventId)).to.be.false
        })
        
        it('does not add the [callback] for the [event] if [event] is not a string', () => {
            let eventId = this.eventHandler.listen(1, () => { })
            expect(eventId).to.be.undefined
            expect(this.eventHandler.events.has(1)).to.be.false
            
            eventId = this.eventHandler.listen(null, () => { })
            expect(eventId).to.be.undefined
            expect(this.eventHandler.events.has(1)).to.be.false
            
            eventId = this.eventHandler.listen(undefined, () => { })
            expect(eventId).to.be.undefined
            expect(this.eventHandler.events.has(1)).to.be.false
            
            eventId = this.eventHandler.listen([], () => { })
            expect(eventId).to.be.undefined
            expect(this.eventHandler.events.has(1)).to.be.false
            
            eventId = this.eventHandler.listen({}, () => { })
            expect(eventId).to.be.undefined
            expect(this.eventHandler.events.has(1)).to.be.false
        })
    })
})