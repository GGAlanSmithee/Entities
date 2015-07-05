import { expect } from 'chai';
import EventHandler from '../../src/core/Event';

describe('EventHandler', function() {
    describe('constructor()', () => {
        beforeEach(() => {
            this.eventHandler = new EventHandler();
        });
        
        afterEach(() => {
            delete this.eventHandler;
        });
        
        it('is a function', () => {
            expect(EventHandler).to.be.a('function');
        });
        
        it('can be used to instantiate a new World', () => {
            expect(this.eventHandler).to.be.an.instanceof(EventHandler);
        });
        
        it('instantiates [events] as a Map', () => {
            expect(this.eventHandler.events).to.be.an.instanceof(Map);
        });
    });
});