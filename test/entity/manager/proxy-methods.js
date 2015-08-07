import { expect }                      from 'chai';
import sinon                           from 'sinon';
import EntityManager, { SelectorType } from '../../../src/core/entity';
import { SystemType }                  from '../../../src/core/system';
import * as helpers                    from '../../helpers'

describe('EntityManager', function() {
    describe('proxy methods', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        describe('registerInitializer(component, initializer)', () => {
            it('is a function', () => {
                expect(this.entityManager.registerInitializer).to.be.a('function');
            });
            
            it('invokes [entityFactory].registerInitializer with the corrent arguments', () => {
                let spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer');
                
                let component = 1;
                let initializer = function() {
                    this.x = 10.0;
                };
                
                this.entityManager.registerInitializer(component, initializer);
                
                expect(spy.calledOnce).to.be.true;
                expect(spy.calledWith(component, initializer)).to.be.true;
            });
        });
        
        describe('build', () => {
            it('is a function', () => {
                expect(this.entityManager.build).to.be.a('function');
            });
            
            it('invokes [entityFactory].build', () => {
                let spy = sinon.spy(this.entityManager.entityFactory, 'build');
                
                this.entityManager.build();
                
                expect(spy.calledOnce).to.be.true;
            });
            
            it('returns the [entityManager] instance to allow for method chaining', () => {
                let entityManager = this.entityManager.build();
                
                expect(entityManager).to.equal(this.entityManager);
            });
        });
        
        describe('withComponent(componentId, initializer)', () => {
            it('is a function', () => {
                expect(this.entityManager.withComponent).to.be.a('function');
            });
            
            it('invokes [entityFactory].withComponent with [component] and [initializer]', () => {
                let component   = 1;
                let initializer = function() { return 2; };
                
                let spy = sinon.spy(this.entityManager.entityFactory, 'withComponent');
                
                this.entityManager.withComponent(component, initializer);
                
                expect(spy.calledOnce).to.be.true;
                expect(spy.calledWith(component, initializer)).to.be.true;
            });
            
            it('returns the [entityManager] instance to allow for method chaining', () => {
                let entityManager = this.entityManager.withComponent(1);
                
                expect(entityManager).to.equal(this.entityManager);
            });
        });
        
        describe('createConfiguration()', () => {
            it('is a function', () => {
                expect(this.entityManager.createConfiguration).to.be.a('function');
            });
            
            it('invokes [entityFactory].createConfiguration', () => {
                let spy = sinon.spy(this.entityManager.entityFactory, 'createConfiguration');
                
                this.entityManager.createConfiguration();
                
                expect(spy.calledOnce).to.be.true;
            });
            
            it('returns the current configuration', () => {
                let component   = 1;
                let initializer = function() { return 2; };
                
                this.entityManager.entityFactory.configuration.set(component, initializer);
                
                let configuration = this.entityManager.createConfiguration();
                
                expect(configuration).to.be.an.instanceof(Map);
                expect(configuration).property('size').to.equal(1);
                expect(configuration.get(component)).to.equal(initializer);
            });
        });
        
        describe('create(count, configuration)', () => {
            beforeEach(() => {
                helpers.registerComponent(this.entityManager.componentManager, this.entityManager, { x : 10, y : 20 }, 1);
                helpers.registerComponent(this.entityManager.componentManager, this.entityManager, { name : 'Testing' }, 2);
                helpers.registerComponent(this.entityManager.componentManager, this.entityManager, 5.5, 4);
            });
            
            it('is a function', () => {
                expect(this.entityManager.create).to.be.a('function');
            });
            
            it('invokes [entityFactory].create', () => {
                let spy = sinon.spy(this.entityManager.entityFactory, 'create');
                
                this.entityManager.create();
                
                expect(spy.calledOnce).to.be.true;
            });
            
            it('invokes [entityFactory].create with [entityManager] (this), [count] and [configuration]', () => {
                let component   = 1;
                let initializer = function() { return 2; };
                
                let configuration = new Map();
                configuration.set(component, initializer);
                
                let spy = sinon.spy(this.entityManager.entityFactory, 'create');
                
                let count = 1;
                
                this.entityManager.create(count, configuration);
                
                expect(spy.calledOnce).to.be.true;
                expect(spy.calledWith(this.entityManager, count, configuration)).to.be.true;
            });
            
            it('returns the created entities', () => {
                let component   = 1;
                let initializer = function() { return 2; };
                
                let configuration = new Map();
                configuration.set(component, initializer);
                
                let count = 2;
                
                let entities = this.entityManager.create(count, configuration);
                
                expect(entities).to.be.an.instanceof(Array);
                expect(entities).property('length').to.equal(2);
                expect(this.entityManager.entities[entities[0]]).to.equal(component);
                expect(this.entityManager.entities[entities[1]]).to.equal(component);
            });
        });
         
        describe('registerSystem(callback, components = 0, type = SystemType.Logic, selector = SelectorType.GetWith)', () => {
            it('is a function', () => {
                expect(this.entityManager.registerSystem).to.be.a('function');
            });
            
            it('invokes [systemManager.registerSystem] with the correct parameters', () => {
                let type       = SystemType.Render;
                let selector   = SelectorType.GetWithout;
                let components = 1 | 2 | 4;
                let callback   = function() { this.x = 10.0; };
                
                let spy = sinon.spy(this.entityManager.systemManager, 'registerSystem');
                
                let systemId = this.entityManager.registerSystem(type, selector, components, callback);

                expect(spy.calledOnce).to.be.true;
                expect(spy.calledWith(type, selector, components, callback)).to.be.true;
                expect(systemId).to.equal(1);
            });
        });
        
        describe('removeSystem(systemId)', () => {
            it('is a function', () => {
                expect(this.entityManager.removeSystem).to.be.a('function');
            });
            
            it('invokes [systemManager.removeSystem] with the correct parameters', () => {
                let systemId = 1;
                
                let spy = sinon.spy(this.entityManager.systemManager, 'removeSystem');
                
                this.entityManager.removeSystem(systemId);
                
                expect(spy.calledOnce).to.be.true;
                expect(spy.calledWith(systemId)).to.be.true;
            });
        });
        
        describe('listen(event, callback)', () => {
            it('is a function', () => {
                expect(this.entityManager.listen).to.be.a('function');
            });
            
            it('invokes [eventHandler.listen] with the correct parameters', () => {
                let event    = 'onEvent';
                let callback = function() { this.hi = 'hi'; };
                
                let spy = sinon.spy(this.entityManager.eventHandler, 'listen');
                
                this.entityManager.listen(event, callback);
                
                expect(spy.calledOnce).to.be.true;
                expect(spy.calledWith(event, callback)).to.be.true;
            });
            
            it('returns the id of the added event', () => {
                let event    = 'onEvent';
                let callback = function() { this.hi = 'hi'; };
                
                expect(this.entityManager.listen(event, callback)).to.equal(0);
                expect(this.entityManager.listen(event, callback)).to.equal(1);
            });
        });
        
        describe('stopListen(eventId)', () => {
            it('is a function', () => {
                expect(this.entityManager.stopListen).to.be.a('function');
            });
            
            it('invokes [eventHandler.stopListen] with the correct parameters', () => {
                let eventId = 1;
                
                let spy = sinon.spy(this.entityManager.eventHandler, 'stopListen');
                
                this.entityManager.stopListen(eventId);
                
                expect(spy.calledOnce).to.be.true;
                expect(spy.calledWith(eventId)).to.be.true;
            });
            
            it('returns true when there was an event to stop listen to, and false when not', () => {
                let event    = 'onEvent';
                let callback = function() { this.hi = 'hi'; };
                
                let eventId = this.entityManager.listen(event, callback);
                
                expect(this.entityManager.stopListen(eventId)).to.be.true;
                expect(this.entityManager.stopListen(eventId)).to.be.false;
            });
        });
        
        describe('trigger()', () => {
            it('is a function', () => {
                expect(this.entityManager.trigger).to.be.a('function');
            });
            
            it('invokes [eventHandler.trigger] with the correct parameters and the [entityManager] as the context (this)', () => {
                let event    = 'onEvent';
                let callback = function() { this.hi = 'hi'; };
                
                this.entityManager.listen(event, callback);
                
                let spy = sinon.spy(this.entityManager.eventHandler, 'trigger');
                
                let paramOne = 'one';
                let paramTwo = { name : 'test', age : 99 };
                
                this.entityManager.trigger(event, paramOne, paramTwo);
                
                expect(spy.calledOnce).to.be.true;
                expect(spy.calledOn(this.entityManager)).to.be.true;
                expect(spy.calledWith(event, paramOne, paramTwo)).to.be.true;
            });
            
            it('returns a promise', () => {
                let event    = 'onEvent';
                let callback = function() { this.hi = 'hi'; };
                
                this.entityManager.listen(event, callback);
                
                return expect(this.entityManager.trigger(event)).to.be.an.instanceof(Promise);
            });
        });
        
        describe('triggerDelayed()', () => {
            it('is a function', () => {
                expect(this.entityManager.triggerDelayed).to.be.a('function');
            });
            
            it('invokes [eventHandler.triggerDelayed] with the correct parameters and the [entityManager] as the context (this)', () => {
                let event    = 'onEvent';
                let callback = function() { this.hi = 'hi'; };
                
                this.entityManager.listen(event, callback);
                
                let spy = sinon.spy(this.entityManager.eventHandler, 'triggerDelayed');
                
                let timeout  = 10;
                let paramOne = 'one';
                let paramTwo = { name : 'test', age : 99 };
                
                this.entityManager.triggerDelayed(event, timeout, paramOne, paramTwo);
                
                expect(spy.calledOnce).to.be.true;
                expect(spy.calledOn(this.entityManager)).to.be.true;
                expect(spy.calledWith(event, timeout, paramOne, paramTwo)).to.be.true;
            });
            
            it('returns a promise', () => {
                let event    = 'onEvent';
                let callback = function() { this.hi = 'hi'; };
                
                this.entityManager.listen(event, callback);
                
                return expect(this.entityManager.triggerDelayed(event, 10)).to.be.an.instanceof(Promise);
            });
        });
    });
});