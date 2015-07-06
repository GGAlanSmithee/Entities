import { expect } from 'chai';
import EventHandler from '../../src/core/Event';
import sinon from 'sinon';

describe('EventHandler', function() {
    describe('promise(callback, context, args, timeout)', () => {
        beforeEach(() => {
            this.eventHandler = new EventHandler();
        });
        
        afterEach(() => {
            delete this.eventHandler;
        });
        
        it('is a function', () => {
            expect(this.eventHandler.promise).to.be.a('function');
        });
        
        it('returns a promise', () => {
            expect(this.eventHandler.promise(() => { }, this, [])).to.be.an.instanceof(Promise);
        });
        
        it('triggers [callback] with [args] on [context] when the promise resolves', () => {
            let callback  = sinon.spy();
            let args      = [];
            args['id']    = 1;
            args['value'] = 'hello';
            args['user']  = 'test';
            
            function context() {
                this.a = 'A';
            }
            
            return this.eventHandler.promise(callback, context, args).then(() => {
                expect(callback.calledOnce).to.be.true;
                expect(callback.calledWith(...args)).to.be.true;
                expect(callback.calledOn(callback)).to.be.false;
                expect(callback.calledOn(context)).to.be.true;
            });
        });
        
        it('triggers [callback] with [args] on [context] after [timeout] when the promise resolves', () => {
            let callback  = sinon.spy();
            let args      = [];
            args['id']    = 1;
            args['value'] = 'hello';
            args['user']  = 'test';
            
            function context() {
                this.a = 'A';
            };
            
            return this.eventHandler.promise(callback, context, args, 1000).then(() => {
                expect(callback.calledOnce).to.be.true;
                expect(callback.calledWith(...args)).to.be.true;
                expect(callback.calledOn(callback)).to.be.false;
                expect(callback.calledOn(context)).to.be.true;
            });
        });
    });
});