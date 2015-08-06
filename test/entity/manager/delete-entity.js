import { expect }    from 'chai';
import EntityManager from '../../../src/core/entity';
import * as helpers  from '../../helpers';

describe('EntityManager', function() {
    describe('deleteEntity(entity)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.posComponent  = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, { x : 10, y : 20 }, 1);
            this.nameComponent = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, { name : 'Testing' }, 2);
            this.velComponent  = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, 5.5, 4);
            
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
        
        it('removes an entity by setting it to 0', () => {
            this.entityManager.currentMaxEntity = 0;
            
            expect(this.entityManager.entities[this.entity]).to.equal(this.components);
            
            this.entityManager.deleteEntity(this.entity);
            
            expect(this.entityManager.entities[this.entity]).to.equal(0);
        });
        
        it('removes an entity by setting its id to 0 even when [currentMaxEntity] > [entity]', () => {
            expect(this.entityManager.entities[this.entity]).to.equal(this.components);
            
            this.entityManager.deleteEntity(this.entity);
            
            expect(this.entityManager.entities[this.entity]).to.equal(0);
        });
        
        it('exits early when [entity] is more than [maxEntity]', () => {
            let oldLength = this.entityManager.entities.length;
            
            this.entityManager.deleteEntity(this.entityManager.currentMaxEntity + 1);
            
            expect(this.entityManager.entities).property('length').to.equal(oldLength);
        });
        
        it('sets [currentMaxEntity] to the next entity that has components if the deleted entity was the prior highest entity', () => {
            this.entityManager.currentMaxEntity = 50;
            
            this.entityManager.entities[4] = 4;
            this.entityManager.entities[5] = 8;
            this.entityManager.entities[13] = 2;
            
            this.entityManager.entities[50] = 2;
            
            expect(this.entityManager.currentMaxEntity).to.equal(50);
            
            this.entityManager.deleteEntity(50);
            expect(this.entityManager.currentMaxEntity).to.equal(13);
            
            this.entityManager.deleteEntity(25);
            expect(this.entityManager.currentMaxEntity).to.equal(13);
            
            this.entityManager.deleteEntity(13);
            expect(this.entityManager.currentMaxEntity).to.equal(5);
            
            this.entityManager.deleteEntity(2);
            expect(this.entityManager.currentMaxEntity).to.equal(5);
            
            this.entityManager.deleteEntity(5);
            expect(this.entityManager.currentMaxEntity).to.equal(4);
            
            this.entityManager.deleteEntity(1);
            expect(this.entityManager.currentMaxEntity).to.equal(4);
            
            this.entityManager.deleteEntity(4);
            expect(this.entityManager.currentMaxEntity).to.equal(0);
            
            this.entityManager.deleteEntity(0);
            expect(this.entityManager.currentMaxEntity).to.equal(0);
        });
    });
});