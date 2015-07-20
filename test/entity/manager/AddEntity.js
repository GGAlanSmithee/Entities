import { expect }        from 'chai';
import   EntityManager   from '../../../src/core/Entity';
import { ComponentType } from '../../../src/core/Component';
import   * as helpers    from '../../helpers';

describe('EntityManager', function() {
    describe('AddEntity(components, returnDetails = false)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.posComponent  = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, ComponentType.Static, { x : 10, y : 20 }, 1);
            this.nameComponent = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, ComponentType.SemiDynamic, { name : 'Testing' }, 2);
            this.velComponent  = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, ComponentType.Dynamic, 5.5, 4);
            
            this.components = this.posComponent | this.nameComponent | this.velComponent;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.addEntity).to.be.a('function');
        });
        
        it('adds and returns an entity, given correct [components] input', () => {
            let entity = this.entityManager.addEntity(this.components);
            
            expect(entity).to.not.be.null;
            expect(entity).to.equal(0);
            
            entity = this.entityManager.addEntity(this.components, true);
            
            expect(entity).to.be.an.instanceof(Object);
            expect(entity).to.have.property('id');
            expect(entity).property('id').to.equal(this.components);
        });
        
        it('does not add an entity and returns [capacity], given wrong [components] input', () => {
            let entity = this.entityManager.addEntity();
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.addEntity('not a number');
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.addEntity('');
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.addEntity(null);
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.addEntity(-1);
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.addEntity(0);
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.addEntity({});
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.addEntity([]);
            
            expect(entity).to.equal(this.entityManager.capacity);
        });
        
        it('does not add an entity and returns null when [returnDetails] = true, given wrong [components] input', () => {
            let entity = this.entityManager.addEntity(undefined, true);
            
            expect(entity).to.be.null;
            
            entity = this.entityManager.addEntity('not a number', true);
            
            expect(entity).to.be.null;
            
            entity = this.entityManager.addEntity('', true);
            
            expect(entity).to.be.null;
            
            entity = this.entityManager.addEntity(null, true);
            
            expect(entity).to.be.null;
            
            entity = this.entityManager.addEntity(-1, true);
            
            expect(entity).to.be.null;
            
            entity = this.entityManager.addEntity(0, true);
            
            expect(entity).to.be.null;
            
            entity = this.entityManager.addEntity({}, true);
            
            expect(entity).to.be.null;
            
            entity = this.entityManager.addEntity([], true);
            
            expect(entity).to.be.null;
        });
        
        it('returns an index when [returnDetails] = falseor omitted', () => {
            let entity = this.entityManager.addEntity(this.components, false);
            expect(entity).to.be.a('number');
            
            entity = this.entityManager.addEntity(this.components);
            expect(entity).to.be.a('number');
        });
        
        it('returns an entity object when [returnDetails] = true', () => {
            let entity = this.entityManager.addEntity(this.components, true);
            expect(entity).to.be.an('object');
        });
        
        it('returns a entity containing [components]', () => {
            let entityIndex = this.entityManager.addEntity(this.components);
            let entity = this.entityManager.entities[entityIndex];
            
            expect(entity).property('id').to.equal(this.components);
            expect(entity).to.have.property(this.posComponent);
            expect(entity).property(this.posComponent).to.not.be.null;
            expect(entity).to.have.property(this.nameComponent);
            expect(entity).property(this.nameComponent).to.not.be.null;
            expect(entity).to.have.property(this.velComponent);
            expect(entity).property(this.velComponent).to.not.be.null;
        });
        
        it('returns a entity only containing registered [components] if on or more [components] are not registered', () => {
            let entityIndex = this.entityManager.addEntity(1 | 16 | 32);
            let entity = this.entityManager.entities[entityIndex];
            
            expect(entity).property('id').to.equal(1);
            expect(entity).to.have.property(1);
            expect(entity).property(1).to.be.an('object');
            expect(entity).to.not.have.property(16);
            expect(entity).to.not.have.property(32);
        });
        
        it('returns capacity and does not add an entity if there is no more space in the entityManager', () => {
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                this.entityManager.addEntity(1 | 16 | 32);
            }
            
            let entityIndex = this.entityManager.addEntity(1 | 16 | 32);
            expect(entityIndex).to.equal(this.entityManager.capacity);
            
            entityIndex = this.entityManager.addEntity(1 | 16 | 32);
            expect(entityIndex).to.equal(this.entityManager.capacity);
            
            entityIndex = this.entityManager.addEntity(1 | 16 | 32);
            expect(entityIndex).to.equal(this.entityManager.capacity);
            
            entityIndex = this.entityManager.addEntity(1 | 16 | 32);
            expect(entityIndex).to.equal(this.entityManager.capacity);
        });
        
        it('returns null and does not add an entity when [returnDetails] = true, and there is no more space in the entityManager', () => {
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                this.entityManager.addEntity(1 | 16 | 32);
            }
            
            let entityIndex = this.entityManager.addEntity(1 | 16 | 32, true);
            expect(entityIndex).to.equal(null);
            
            entityIndex = this.entityManager.addEntity(1 | 16 | 32, true);
            expect(entityIndex).to.equal(null);
            
            entityIndex = this.entityManager.addEntity(1 | 16 | 32, true);
            expect(entityIndex).to.equal(null);
            
            entityIndex = this.entityManager.addEntity(1 | 16 | 32, true);
            expect(entityIndex).to.equal(null);
        });
    });
});