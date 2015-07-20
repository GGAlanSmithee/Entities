import { expect }                       from 'chai';
import { NoneComponent }                from '../../../src/core/Component';
import EntityManager, { EntityFactory } from '../../../src/core/Entity';
import EventHandler                     from '../../../src/core/Event';
import SystemManager                    from '../../../src/core/System';

describe('EntityManager', function() {
    describe('constructor()', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(EntityManager).to.be.a('function');
        });
        
        it('can be used to instantiate a new EntityManager', () => {
            expect(this.entityManager).to.be.an.instanceof(EntityManager);
        });
        
        it('sets [capacity] to 1000', () => {
            expect(this.entityManager).property('capacity').to.equal(1000);
        });
        
        it('creates 1000 empty entities', () => {
            expect(this.entityManager).property('entities').to.be.an.instanceof(Array);
            expect(this.entityManager).property('entities').property('length').to.equal(1000);
        });
        
        it('sets [currentMaxEntity] to -1', () => {
            expect(this.entityManager.currentMaxEntity).to.equal(-1);
        });
        
        it('instantiates [entityFactory] as an instance of [EntityFactory]', () => {
            expect(this.entityManager).property('entityFactory').to.be.an.instanceof(EntityFactory);
        });
        
        it('instantiates [eventHandler] as an instance of [EventHandler]', () => {
            expect(this.entityManager).property('eventHandler').to.be.an.instanceof(EventHandler);
        });
        
        it('instantiates [systemManager] as an instance of [SystemManager]', () => {
            expect(this.entityManager).property('systemManager').to.be.an.instanceof(SystemManager);
        });
    });
    
    describe('constructor(capacity)', () => {
        beforeEach(() => {
            this.capacity = 2000;
            this.entityManager = new EntityManager(this.capacity);
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('sets [capacity] equal to the passed in value', () => {
            expect(this.entityManager).property('capacity').to.equal(this.capacity);
        });
        
        it('creates [capacity] number of empty entities', () => {
            expect(this.entityManager).property('entities').to.be.an.instanceof(Array);
            expect(this.entityManager).property('entities').property('length').to.equal(this.capacity);
            
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i]).property('id').to.equal(0);
            }
        });
        
        it('sets [currentMaxEntity] to -1', () => {
            expect(this.entityManager.currentMaxEntity).to.equal(-1);
        });
        
        it('sets [capacity] to 1000 (default) on bad input', () => {
            this.entityManager = new EntityManager('bad input');
            
            expect(this.entityManager.capacity).to.equal(1000);
            expect(this.entityManager).property('entities').property('length').to.equal(this.entityManager.capacity);
            
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i]).property('id').to.equal(0);
            }
        });
    });
});