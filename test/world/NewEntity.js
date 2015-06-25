import { expect }            from 'chai';
import   World               from '../../src/core/World';
import { ComponentType }     from '../../src/core/Component';
import { registerComponent } from '../helpers';

describe('World', function() {
    describe('NewEntity(components, returnDetails = false)', () => {
        beforeEach(() => {
            this.world = new World();
            
            this.posComponent  = registerComponent(this.world, ComponentType.Static, { x : 10, y : 20 }, 1);
            this.nameComponent = registerComponent(this.world, ComponentType.Static, { name : 'Testing' }, 2);
            this.velComponent  = registerComponent(this.world, ComponentType.Static, 5.5, 4);
            
            this.components = this.posComponent | this.nameComponent | this.velComponent;
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.newEntity).to.be.a('function');
        });
        
        it('adds and returns an entity, given correct [components] input', () => {
            let entity = this.world.newEntity(this.components);
            
            expect(entity).to.not.be.null;
            
            entity = this.world.newEntity(this.components, true);
            
            expect(entity).to.not.be.null;
        });
        
        it('does not add an entity and returns [capacity], given wrong [components] input', () => {
            let entity = this.world.newEntity();
            
            expect(entity).to.equal(this.world.capacity);
            
            entity = this.world.newEntity('not a number');
            
            expect(entity).to.equal(this.world.capacity);
            
            entity = this.world.newEntity('');
            
            expect(entity).to.equal(this.world.capacity);
            
            entity = this.world.newEntity(null);
            
            expect(entity).to.equal(this.world.capacity);
            
            entity = this.world.newEntity(-1);
            
            expect(entity).to.equal(this.world.capacity);
            
            entity = this.world.newEntity(0);
            
            expect(entity).to.equal(this.world.capacity);
            
            entity = this.world.newEntity({});
            
            expect(entity).to.equal(this.world.capacity);
            
            entity = this.world.newEntity([]);
            
            expect(entity).to.equal(this.world.capacity);
        });
        
        it('does not add an entity and returns null when [returnDetails] = true, given wrong [components] input', () => {
            let entity = this.world.newEntity(undefined, true);
            
            expect(entity).to.be.null;
            
            entity = this.world.newEntity('not a number', true);
            
            expect(entity).to.be.null;
            
            entity = this.world.newEntity('', true);
            
            expect(entity).to.be.null;
            
            entity = this.world.newEntity(null, true);
            
            expect(entity).to.be.null;
            
            entity = this.world.newEntity(-1, true);
            
            expect(entity).to.be.null;
            
            entity = this.world.newEntity(0, true);
            
            expect(entity).to.be.null;
            
            entity = this.world.newEntity({}, true);
            
            expect(entity).to.be.null;
            
            entity = this.world.newEntity([], true);
            
            expect(entity).to.be.null;
        });
        
        it('returns an index when [returnDetails] = falseor omitted', () => {
            let entity = this.world.newEntity(this.components, false);
            expect(entity).to.be.a('number');
            
            entity = this.world.newEntity(this.components);
            expect(entity).to.be.a('number');
        });
        
        it('returns an entity object when [returnDetails] = true', () => {
            let entity = this.world.newEntity(this.components, true);
            expect(entity).to.be.an('object');
        });
        
        it('returns a entity containing [components]', () => {
            let entityIndex = this.world.newEntity(this.components);
            let entity = this.world.entities[entityIndex];
            
            expect(entity).property('id').to.equal(this.components);
            expect(entity).to.have.property(this.posComponent);
            expect(entity).property(this.posComponent).to.not.be.null;
            expect(entity).to.have.property(this.nameComponent);
            expect(entity).property(this.nameComponent).to.not.be.null;
            expect(entity).to.have.property(this.velComponent);
            expect(entity).property(this.velComponent).to.not.be.null;
        });
        
        it('returns a entity only containing registered [components] if on or more [components] are not registered', () => {
            let entityIndex = this.world.newEntity(1 | 16 | 32);
            let entity = this.world.entities[entityIndex];
            
            expect(entity).property('id').to.equal(1);
            expect(entity).to.have.property(1);
            expect(entity).property(1).to.be.an('object');
            expect(entity).to.not.have.property(16);
            expect(entity).to.not.have.property(32);
        });
        
        it('returns capacity and does not add an entity if there is no more space in the world', () => {
            for (let i = 0; i < this.world.capacity; ++i) {
                this.world.newEntity(1 | 16 | 32);
            }
            
            let entityIndex = this.world.newEntity(1 | 16 | 32);
            expect(entityIndex).to.equal(this.world.capacity);
            
            entityIndex = this.world.newEntity(1 | 16 | 32);
            expect(entityIndex).to.equal(this.world.capacity);
            
            entityIndex = this.world.newEntity(1 | 16 | 32);
            expect(entityIndex).to.equal(this.world.capacity);
            
            entityIndex = this.world.newEntity(1 | 16 | 32);
            expect(entityIndex).to.equal(this.world.capacity);
        });
        
        it('returns null and does not add an entity when [returnDetails] = true, and there is no more space in the world', () => {
            for (let i = 0; i < this.world.capacity; ++i) {
                this.world.newEntity(1 | 16 | 32);
            }
            
            let entityIndex = this.world.newEntity(1 | 16 | 32, true);
            expect(entityIndex).to.equal(null);
            
            entityIndex = this.world.newEntity(1 | 16 | 32, true);
            expect(entityIndex).to.equal(null);
            
            entityIndex = this.world.newEntity(1 | 16 | 32, true);
            expect(entityIndex).to.equal(null);
            
            entityIndex = this.world.newEntity(1 | 16 | 32, true);
            expect(entityIndex).to.equal(null);
        });
    });
});