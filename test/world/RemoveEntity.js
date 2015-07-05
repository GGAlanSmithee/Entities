import { expect }        from 'chai';
import   sinon           from 'sinon';
import   World           from '../../src/core/World';
import { ComponentType } from '../../src/core/Component';
import { registerComponent, addComponentToEntity } from '../helpers';

describe('World', function() {
    describe('removeEntity(entity)', () => {
        beforeEach(() => {
            this.world = new World();
            
            this.posComponent  = registerComponent(this.world, ComponentType.Static, { x : 10, y : 20 }, 1);
            this.nameComponent = registerComponent(this.world, ComponentType.Static, { name : 'Testing' }, 2);
            this.velComponent  = registerComponent(this.world, ComponentType.Static, 5.5, 4);
            
            this.entity = 0;
            
            this.components = this.posComponent | this.nameComponent | this.velComponent;
            
            addComponentToEntity(this.world, this.entity, this.posComponent);
            addComponentToEntity(this.world, this.entity, this.nameComponent);
            addComponentToEntity(this.world, this.entity, this.velComponent);
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.removeEntity).to.be.a('function');
        });
        
        it('removes an entity by setting its id to 0', () => {
            this.world.currentMaxEntity = 0;
            
            expect(this.world.entities[this.entity]).property('id').to.equal(this.components);
            
            this.world.removeEntity(this.entity);
            
            expect(this.world.entities[this.entity]).property('id').to.equal(0);
        });
        
        it('removes an entity by setting its id to 0', () => {
            this.world.currentMaxEntity = 1;
            
            expect(this.world.entities[this.entity]).property('id').to.equal(this.components);
            
            this.world.removeEntity(this.entity);
            
            expect(this.world.entities[this.entity]).property('id').to.equal(0);
        });
        
        it('removes an entity by setting its id to 0 even when [currentMaxEntity] > [entity]', () => {
            expect(this.world.entities[this.entity]).property('id').to.equal(this.components);
            
            this.world.removeEntity(this.entity);
            
            expect(this.world.entities[this.entity]).property('id').to.equal(0);
        });
        
        it('invokes removeComponent for every component the removed entity has', () => {
            sinon.spy(this.world, "removeComponent");
            
            this.world.removeEntity(this.entity);
            
            expect(this.world.removeComponent.callCount).to.equal(3);
            
            this.world.removeComponent.restore();
        });
        
        it('exits early when [entity] is more than [maxEntity]', () => {
            
            let oldLength = this.world.entities.length;
            
            this.world.removeEntity(this.world.currentMaxEntity + 1);
            
            expect(this.world.entities).property('length').to.equal(oldLength);
        });
    });
});