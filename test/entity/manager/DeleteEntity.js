import { expect }        from 'chai';
import   sinon           from 'sinon';
import   EntityManager   from '../../../src/core/Entity';
import { ComponentType } from '../../../src/core/Component';
import   * as helpers    from '../../helpers';

describe('EntityManager', function() {
    describe('deleteEntity(entity)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.posComponent  = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, ComponentType.Static, { x : 10, y : 20 }, 1);
            this.nameComponent = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, ComponentType.SemiDynamic, { name : 'Testing' }, 2);
            this.velComponent  = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, ComponentType.Dynamic, 5.5, 4);
            
            this.entity = 0;
            
            this.components = this.posComponent | this.nameComponent | this.velComponent;
            
            helpers.addComponentToEntity(this.entityManager, this.entityManager.componentManager, this.entity, this.posComponent);
            helpers.addComponentToEntity(this.entityManager, this.entityManager.componentManager, this.entity, this.nameComponent);
            helpers.addComponentToEntity(this.entityManager, this.entityManager.componentManager, this.entity, this.velComponent);
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.deleteEntity).to.be.a('function');
        });
        
        it('removes an entity by setting its id to 0', () => {
            this.entityManager.currentMaxEntity = 0;
            
            expect(this.entityManager.entities[this.entity]).property('id').to.equal(this.components);
            
            this.entityManager.deleteEntity(this.entity);
            
            expect(this.entityManager.entities[this.entity]).property('id').to.equal(0);
        });
        
        it('removes an entity by setting its id to 0', () => {
            this.entityManager.currentMaxEntity = 1;
            
            expect(this.entityManager.entities[this.entity]).property('id').to.equal(this.components);
            
            this.entityManager.deleteEntity(this.entity);
            
            expect(this.entityManager.entities[this.entity]).property('id').to.equal(0);
        });
        
        it('removes an entity by setting its id to 0 even when [currentMaxEntity] > [entity]', () => {
            expect(this.entityManager.entities[this.entity]).property('id').to.equal(this.components);
            
            this.entityManager.deleteEntity(this.entity);
            
            expect(this.entityManager.entities[this.entity]).property('id').to.equal(0);
        });
        
        it('invokes ComponentManager.removeComponentFromEntity for every component the removed entity has', () => {
            sinon.spy(this.entityManager.componentManager, "removeComponentFromEntity");
            
            this.entityManager.deleteEntity(this.entity);
            
            expect(this.entityManager.componentManager.removeComponentFromEntity.callCount).to.equal(3);
            
            this.entityManager.componentManager.removeComponentFromEntity.restore();
        });
        
        it('exits early when [entity] is more than [maxEntity]', () => {
            let oldLength = this.entityManager.entities.length;
            
            this.entityManager.deleteEntity(this.entityManager.currentMaxEntity + 1);
            
            expect(this.entityManager.entities).property('length').to.equal(oldLength);
        });
    });
});