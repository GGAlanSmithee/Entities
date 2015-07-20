import { expect }                          from 'chai';
import   EntityManager                     from '../../../src/core/Entity';
import ComponentManager, { ComponentType } from '../../../src/core/Component';
import   * as helpers                      from '../../helpers';

describe('ComponentManager', function() {
    describe('removeComponentFromEntity(entityId, componentId)', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager();
            this.entityManager = new EntityManager();
            
            this.staticComponent      = helpers.registerComponent(this.componentManager, this.entityManager, ComponentType.Static, { x : 10, y : 20 }, 1);
            this.semiDynamicComponent = helpers.registerComponent(this.componentManager, this.entityManager, ComponentType.SemiDynamic, { x : 10, y : 20 }, 2);
            this.dynamicComponent     = helpers.registerComponent(this.componentManager, this.entityManager, ComponentType.Dynamic, { x : 10, y : 20 }, 4);
            
            this.entityId = 0;
            
            helpers.addComponentToEntity(this.entityManager, this.componentManager, this.entityId, this.staticComponent);
            helpers.addComponentToEntity(this.entityManager, this.componentManager, this.entityId, this.semiDynamicComponent);
            helpers.addComponentToEntity(this.entityManager, this.componentManager, this.entityId, this.dynamicComponent);
        });
        
        afterEach(() => {
            delete this.entityManager;
            delete this.componentManager;
        });
        
        it('is a function', () => {
            expect(this.componentManager.removeComponentFromEntity).to.be.a('function');
        });
        
        it('removes a component', () => {
            expect(this.entityManager.entities[this.entityId].id & this.staticComponent).to.equal(this.staticComponent);
            expect(this.entityManager.entities[this.entityId].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.entityManager.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId], this.staticComponent);
            
            expect(this.entityManager.entities[this.entityId].id & this.staticComponent).to.not.equal(this.staticComponent);
            expect(this.entityManager.entities[this.entityId].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.entityManager.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId], this.semiDynamicComponent);
            
            expect(this.entityManager.entities[this.entityId].id & this.staticComponent).to.not.equal(this.staticComponent);
            expect(this.entityManager.entities[this.entityId].id & this.semiDynamicComponent).to.not.equal(this.semiDynamicComponent);
            expect(this.entityManager.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId], this.dynamicComponent);
            
            expect(this.entityManager.entities[this.entityId].id & this.staticComponent).to.not.equal(this.staticComponent);
            expect(this.entityManager.entities[this.entityId].id & this.semiDynamicComponent).to.not.equal(this.semiDynamicComponent);
            expect(this.entityManager.entities[this.entityId].id & this.dynamicComponent).to.not.equal(this.dynamicComponent);
        });
        
        it('leaves the actual component but removes its id when a static component is removed', () => {
            expect(this.entityManager.entities[this.entityId]).to.have.property(this.staticComponent);
            expect(this.entityManager.entities[this.entityId]).property(this.staticComponent).to.not.be.null;
            
            this.componentManager.removeComponentFromEntity(this.entityId, this.staticComponent);
            
            expect(this.entityManager.entities[this.entityId]).to.have.property(this.staticComponent);
            expect(this.entityManager.entities[this.entityId]).property(this.staticComponent).to.not.be.null;
        });

        it('leaves the actual component but removes its id when a semi dynamic component is removed', () => {
            expect(this.entityManager.entities[this.entityId]).to.have.property(this.semiDynamicComponent);
            expect(this.entityManager.entities[this.entityId]).property(this.semiDynamicComponent).to.not.be.null;
            
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId], this.semiDynamicComponent);
            
            expect(this.entityManager.entities[this.entityId]).to.have.property(this.semiDynamicComponent);
            expect(this.entityManager.entities[this.entityId]).property(this.semiDynamicComponent).to.not.be.null;
        });
        
        it('removes the actual component and its id when a dyanmic component is removed', () => {
            expect(this.entityManager.entities[this.entityId]).to.have.property(this.dynamicComponent);
            expect(this.entityManager.entities[this.entityId]).property(this.dynamicComponent).to.not.be.null;
            
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId], this.dynamicComponent);
            
            expect(this.entityManager.entities[this.entityId]).to.not.have.property(this.dynamicComponent);
        });
        
        it('does not remove a component if [componentId] is not a valid input', () => {
            expect(this.entityManager.entities[this.entityId].id & this.staticComponent).to.equal(this.staticComponent);
            expect(this.entityManager.entities[this.entityId].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.entityManager.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId], 25);
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId], -1);
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId], 'not a number');
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId]);
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId], null);
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId], []);
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId], {});
            
            expect(this.entityManager.entities[this.entityId].id & this.staticComponent).to.equal(this.staticComponent);
            expect(this.entityManager.entities[this.entityId].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.entityManager.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
        });
        
        it('does not remove a component if [entity] is not an object or null', () => {
            expect(this.entityManager.entities[this.entityId].id & this.staticComponent).to.equal(this.staticComponent);
            expect(this.entityManager.entities[this.entityId].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.entityManager.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.componentManager.removeComponentFromEntity(undefined, 25);
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId].id, this.semiDynamicComponent);
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId].id, 'not a number');
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId].id, this.dynamicComponent);
            this.componentManager.removeComponentFromEntity(null, this.dynamicComponent);
            this.componentManager.removeComponentFromEntity(() => {}, this.dynamicComponent);
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId][this.semiDynamicComponent], this.semiDynamicComponent);
            this.componentManager.removeComponentFromEntity(this.entityManager.entities[this.entityId][this.staticComponent], this.staticComponent);
            
            expect(this.entityManager.entities[this.entityId].id & this.staticComponent).to.equal(this.staticComponent);
            expect(this.entityManager.entities[this.entityId].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.entityManager.entities[this.entityId].id & this.dynamicComponent).to.equal(this.dynamicComponent);
        });
    });
});