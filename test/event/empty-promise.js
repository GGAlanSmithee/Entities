import { expect }   from 'chai';
import EventHandler from '../../src/core/event';

describe('EventHandler', function() {
    describe('emptyPromise()', () => {
        beforeEach(() => {
            this.eventHandler = new EventHandler();
        });
        
        afterEach(() => {
            delete this.eventHandler;
        });
        
        it('is a function', () => {
            expect(this.eventHandler.emptyPromise).to.be.a('function');
        });
        
        it('returns an empty promise', () => {
            expect(this.eventHandler.emptyPromise()).to.be.an.instanceof(Promise);
        });
    });
});