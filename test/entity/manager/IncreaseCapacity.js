import { expect }        from 'chai';
import EntityManager     from '../../../src/core/Entity';
import { ComponentType } from '../../../src/core/Component';
import * as helpers      from '../../helpers';

describe('EntityManager', function() {
    describe('increaseCapacity()', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.staticComponent      = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, ComponentType.Static, { x : 10, y : 20 }, 1);
            this.semiDynamicComponent = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, ComponentType.SemiDynamic, { x : 10, y : 20 }, 2);
            this.dynamicComponent     = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, ComponentType.Dynamic, { x : 10, y : 20 }, 4);
            
            this.entityId = 0;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.increaseCapacity).to.be.a('function');
        });
        
        it('increases capacity to be twice its old size', () => {
            expect(this.entityManager.capacity).to.equal(1000);
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.capacity).to.equal(2000);
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.capacity).to.equal(4000);
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.capacity).to.equal(8000);
        });

        it('adds entities as capacity is increased', () => {
            expect(this.entityManager.entities).property('length').to.equal(1000);
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.entities).property('length').to.equal(2000);
            
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i]).to.be.an('object');
            }
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.entities).property('length').to.equal(4000);
            
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i]).to.be.an('object');
            }
        });
        
        it('adds static components to entities as capacity is increased', () => {
            expect(this.entityManager.entities).property('length').to.equal(1000);
            
            for (let entity of this.entityManager.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.have.property(this.staticComponent);
            }
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.entities).property('length').to.equal(2000);
            
            for (let entity of this.entityManager.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.have.property(this.staticComponent);
            }
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.entities).property('length').to.equal(4000);
            
            for (let entity of this.entityManager.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.have.property(this.staticComponent);
            }
        });
        
        it('does not add semiDynamic and dynamic components to entities as capacity is increased', () => {
            expect(this.entityManager.entities).property('length').to.equal(1000);
            
            for (let entity of this.entityManager.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.not.have.property(this.semiDynamicComponent);
                expect(entity).to.not.have.property(this.dynamicComponent);
            }
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.entities).property('length').to.equal(2000);
            
            for (let entity of this.entityManager.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.not.have.property(this.semiDynamicComponent);
                expect(entity).to.not.have.property(this.dynamicComponent);
            }
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.entities).property('length').to.equal(4000);
            
            for (let entity of this.entityManager.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.not.have.property(this.semiDynamicComponent);
                expect(entity).to.not.have.property(this.dynamicComponent);
            }
        });
        
        it('increses capacity even if there are no [components]', () => {
            this.entityManager.componentManager.components = [];
            
            expect(this.entityManager.entities).property('length').to.equal(1000);
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.entities).property('length').to.equal(2000);
            
            this.entityManager.componentManager.components = new Map();
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.entities).property('length').to.equal(4000);
        });
    });
});