import { expect } from 'chai';
import sinon from 'sinon';
import EventHandler from '../../src/core/Event';

describe('EventHandler', function() {
    describe('stopListen(eventId)', () => {
        beforeEach(() => {
            this.eventHandler = new EventHandler();
        });
        
        afterEach(() => {
            delete this.eventHandler;
        });
        
        it('is a function', () => {
            expect(this.eventHandler.stopListen).to.be.a('function');
        });
        
        it('removes callback registered under [eventId]', () => {
            this.eventHandler.events.set('test', new Map());
            this.eventHandler.events.set('testAgain', new Map());
            
            this.eventHandler.events.get('test').set(1, () => { });
            
            expect(this.eventHandler.events.get('test').get(1)).to.not.be.undefined;
            expect(this.eventHandler.stopListen(1)).to.be.true;
            expect(this.eventHandler.events.get('test').get(1)).to.be.undefined;
            expect(this.eventHandler.stopListen(1)).to.be.false;
            
            this.eventHandler.events.get('testAgain').set(2, () => { });
            
            expect(this.eventHandler.events.get('testAgain').get(2)).to.not.be.undefined;
            expect(this.eventHandler.stopListen(2)).to.be.true;
            expect(this.eventHandler.events.get('testAgain').get(2)).to.be.undefined;
            expect(this.eventHandler.stopListen(2)).to.be.false;
        });
        
        it('returns without removing a callback when [eventId] is not an integer', () => {
            this.eventHandler.events.set('test', new Map());
            this.eventHandler.events.set('testAgain', new Map());
            
            this.eventHandler.events.get('test').set(1, () => { });
            this.eventHandler.events.get('testAgain').set(2, () => { });
            
            expect(this.eventHandler.events.get('test').get(1)).to.not.be.undefined;
            expect(this.eventHandler.events.get('testAgain').get(2)).to.not.be.undefined;
            
            this.eventHandler.stopListen();
            
            expect(this.eventHandler.events.get('test').get(1)).to.not.be.undefined;
            expect(this.eventHandler.events.get('testAgain').get(2)).to.not.be.undefined;
            
            this.eventHandler.stopListen(null);
            
            expect(this.eventHandler.events.get('test').get(1)).to.not.be.undefined;
            expect(this.eventHandler.events.get('testAgain').get(2)).to.not.be.undefined;
            
            this.eventHandler.stopListen('not a number');
            
            expect(this.eventHandler.events.get('test').get(1)).to.not.be.undefined;
            expect(this.eventHandler.events.get('testAgain').get(2)).to.not.be.undefined;
            
            this.eventHandler.stopListen([]);
            
            expect(this.eventHandler.events.get('test').get(1)).to.not.be.undefined;
            expect(this.eventHandler.events.get('testAgain').get(2)).to.not.be.undefined;
            
            this.eventHandler.stopListen({});
            
            expect(this.eventHandler.events.get('test').get(1)).to.not.be.undefined;
            expect(this.eventHandler.events.get('testAgain').get(2)).to.not.be.undefined;
            
            this.eventHandler.stopListen(1.4);
            
            expect(this.eventHandler.events.get('test').get(1)).to.not.be.undefined;
            expect(this.eventHandler.events.get('testAgain').get(2)).to.not.be.undefined;
        });
    });
});