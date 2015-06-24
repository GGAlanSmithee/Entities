import { expect } from 'chai';
import   World from '../../src/core/World';
import { ComponentType } from '../../src/core/Component';
import { registerComponent, addComponentToEntity } from '../helpers';

describe('World', function() {
    describe('removeComponent(entityId, componentId)', () => {
        beforeEach(() => {
            this.world = new World();
            
            this.staticComponent      = registerComponent(this.world, ComponentType.Static, { x : 10, y : 20 }, 1);
            this.semiDynamicComponent = registerComponent(this.world, ComponentType.SemiDynamic, { x : 10, y : 20 }, 2);
            this.dynamicComponent     = registerComponent(this.world, ComponentType.Dynamic, { x : 10, y : 20 }, 4);
            
            this.entityId = 0;
            
            addComponentToEntity(this.world, this.entityId, this.staticComponent);
            addComponentToEntity(this.world, this.entityId, this.semiDynamicComponent);
            addComponentToEntity(this.world, this.entityId, this.dynamicComponent);
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.removeComponent).to.be.a('function');
        });
        
        it('removes a component', () => {
            expect(this.world.entities[this.entityId].id & this.staticComponent).to.equal(this.staticComponent);
            expect(this.world.entities[this.entityId].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.world.removeComponent(this.entityId, this.staticComponent);
            
            expect(this.world.entities[this.entityId].id & this.staticComponent).to.not.equal(this.staticComponent);
            expect(this.world.entities[this.entityId].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.world.removeComponent(this.entityId, this.semiDynamicComponent);
            
            expect(this.world.entities[this.entityId].id & this.staticComponent).to.not.equal(this.staticComponent);
            expect(this.world.entities[this.entityId].id & this.semiDynamicComponent).to.not.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.world.removeComponent(this.entityId, this.dynamicComponent);
            
            expect(this.world.entities[this.entityId].id & this.staticComponent).to.not.equal(this.staticComponent);
            expect(this.world.entities[this.entityId].id & this.semiDynamicComponent).to.not.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entityId].id & this.dynamicComponent).to.not.equal(this.dynamicComponent);
        });
        
        it('leaves the actual component but removes its id when a static component is removed', () => {
            expect(this.world.entities[this.entityId]).to.have.property(this.staticComponent);
            expect(this.world.entities[this.entityId]).property(this.staticComponent).to.not.be.null;
            
            this.world.removeComponent(this.entityId, this.staticComponent);
            
            expect(this.world.entities[this.entityId]).to.have.property(this.staticComponent);
            expect(this.world.entities[this.entityId]).property(this.staticComponent).to.not.be.null;
        });

        it('leaves the actual component but removes its id when a semi dynamic component is removed', () => {
            expect(this.world.entities[this.entityId]).to.have.property(this.semiDynamicComponent);
            expect(this.world.entities[this.entityId]).property(this.semiDynamicComponent).to.not.be.null;
            
            this.world.removeComponent(this.entityId, this.semiDynamicComponent);
            
            expect(this.world.entities[this.entityId]).to.have.property(this.semiDynamicComponent);
            expect(this.world.entities[this.entityId]).property(this.semiDynamicComponent).to.not.be.null;
        });
        
        it('removes the actual component and its id when a dyanmic component is removed', () => {
            expect(this.world.entities[this.entityId]).to.have.property(this.dynamicComponent);
            expect(this.world.entities[this.entityId]).property(this.dynamicComponent).to.not.be.null;
            
            this.world.removeComponent(this.entityId, this.dynamicComponent);
            
            expect(this.world.entities[this.entityId]).to.have.property(this.dynamicComponent);
            expect(this.world.entities[this.entityId]).property(this.dynamicComponent).to.be.null;
        });
        
        it('does not remove a component when a bad [comonentId] is passed in', () => {
            expect(this.world.entities[this.entityId].id & this.staticComponent).to.equal(this.staticComponent);
            expect(this.world.entities[this.entityId].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.world.removeComponent(this.entityId, 25);
            this.world.removeComponent(this.entityId, -1);
            this.world.removeComponent(this.entityId, 'not a number');
            this.world.removeComponent(this.entityId);
            this.world.removeComponent(this.entityId, null);
            this.world.removeComponent(this.entityId, []);
            this.world.removeComponent(this.entityId, {});
            
            expect(this.world.entities[this.entityId].id & this.staticComponent).to.equal(this.staticComponent);
            expect(this.world.entities[this.entityId].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
        });
    });
});