import { expect } from 'chai';
import EventHandler from '../../src/core/Event';

describe('EventHandler', function() {
    describe('getNextEventId()', () => {
        beforeEach(() => {
            this.eventHandler = new EventHandler();
            this.eventHandler.events.set('onTest', new Map());
            this.eventHandler.events.set('onTestAgain', new Map());
            this.eventHandler.events.set('onAnotherTest', new Map());
        });
        
        afterEach(() => {
            delete this.eventHandler;
        });

        it('is a function', () => {
            expect(this.eventHandler.getNextEventId).to.be.a('function');
        });
        
        it('returns 0 when there is no event registered', () => {
            expect(this.eventHandler.getNextEventId()).to.equal(0);
        });
        
        it('returns the next available event id', () => {
            this.eventHandler.events.get('onTest').set(1, () => { });
            this.eventHandler.events.get('onTestAgain').set(2, () => { });
            this.eventHandler.events.get('onAnotherTest').set(10, () => { });
            this.eventHandler.events.get('onTest').set(11, () => { });
            this.eventHandler.events.get('onTestAgain').set(22, () => { });
            this.eventHandler.events.get('onAnotherTest').set(13, () => { });
            
            expect(this.eventHandler.getNextEventId()).to.equal(23);
            
            this.eventHandler.events.get('onTestAgain').set(20, () => { });
            
            expect(this.eventHandler.getNextEventId()).to.equal(23);
            
            this.eventHandler.events.get('onTest').set(23, () => { });
            this.eventHandler.events.get('onTestAgain').set(24, () => { });
            this.eventHandler.events.get('onAnotherTest').set(25, () => { });
            
            expect(this.eventHandler.getNextEventId()).to.equal(26);
            
            expect(this.eventHandler.getNextEventId()).to.equal(26);
        });
    });
});