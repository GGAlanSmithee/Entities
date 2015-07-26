import { expect }        from 'chai';
import   EntityManager   from '../../../src/core/Entity';
import   * as helpers    from '../../Helpers';

describe('EntityManager', function() {
    describe('newEntity(components)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.posComponent  = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, { x : 10, y : 20 }, 1);
            this.nameComponent = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, { name : 'Testing' }, 2);
            this.velComponent  = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, 5.5, 4);
            
            this.components = this.posComponent | this.nameComponent | this.velComponent;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.newEntity).to.be.a('function');
        });
        
        it('adds and returns an entity, given correct [components] input', () => {
            let entity = this.entityManager.newEntity(this.components);
            
            expect(entity).to.not.be.null;
            expect(entity).to.equal(0);
        });
        
        it('does not add an entity and returns [capacity], given wrong [components] input', () => {
            let entity = this.entityManager.newEntity();
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.newEntity('not a number');
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.newEntity('');
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.newEntity(null);
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.newEntity(-1);
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.newEntity(0);
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.newEntity({});
            
            expect(entity).to.equal(this.entityManager.capacity);
            
            entity = this.entityManager.newEntity([]);
            
            expect(entity).to.equal(this.entityManager.capacity);
        });
        
        it('returns an index', () => {
            let entity = this.entityManager.newEntity(this.components, false);
            expect(entity).to.be.a('number');
            
            entity = this.entityManager.newEntity(this.components);
            expect(entity).to.be.a('number');
        });
        
        it('set entities[entityId] to [components]', () => {
            let entityId = this.entityManager.newEntity(this.components);
            
            expect(this.entityManager.entities[entityId]).to.equal(this.components);
        });
        
        it('returns capacity and does not add an entity if there is no more space in the entityManager', () => {
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                this.entityManager.newEntity(1 | 16 | 32);
            }
            
            let entityId = this.entityManager.newEntity(1 | 16 | 32);
            expect(entityId).to.equal(this.entityManager.capacity);
            
            entityId = this.entityManager.newEntity(1 | 16 | 32);
            expect(entityId).to.equal(this.entityManager.capacity);
            
            entityId = this.entityManager.newEntity(1 | 16 | 32);
            expect(entityId).to.equal(this.entityManager.capacity);
            
            entityId = this.entityManager.newEntity(1 | 16 | 32);
            expect(entityId).to.equal(this.entityManager.capacity);
        });
        
        it('increases [currentMaxEntity] if [entityId] is larger than [currentMaxEntity]', () => {
            this.entityManager.currentMaxEntity = 0;
            
            let entityId = this.entityManager.newEntity(this.components);
            
            expect(entityId).to.equal(0);
            expect(this.entityManager.currentMaxEntity).to.equal(0);
            
            entityId = this.entityManager.newEntity(this.components);
            
            expect(entityId).to.equal(1);
            expect(this.entityManager.currentMaxEntity).to.equal(1);
            
            entityId = this.entityManager.newEntity(this.components);
            
            expect(entityId).to.equal(2);
            expect(this.entityManager.currentMaxEntity).to.equal(2);
            
            this.entityManager.entities[1] = 0;
            
            entityId = this.entityManager.newEntity(this.components);
            
            expect(entityId).to.equal(1);
            expect(this.entityManager.currentMaxEntity).to.equal(2);
        });
    });
});