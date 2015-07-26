import { expect }      from 'chai';
import   EntityManager from '../../../src/core/Entity';
import   sinon         from 'sinon';
import * as helpers    from '../../Helpers'

describe('EntityManager', function() {
    describe('proxy methods', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
        });
        
        afterEach(() => {
            delete this.entityManager;
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
        
        describe('create()', () => {
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
    });
});