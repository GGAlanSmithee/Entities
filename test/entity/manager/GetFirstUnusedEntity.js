import { expect }      from 'chai';
import   EntityManager from '../../../src/core/Entity';

describe('EntityManager', function() {
    describe('getFirstUnusedEntity(returnDetails = false)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.getFirstUnusedEntity).to.be.a('function');
        });
        
        it('returns 0 when there is no entity added', () => {
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(0);
        });
        
        it('returns correct entityId as more entities are added', () => {
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(0);
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(0);
            
            for (let i = 0; i < 20; ++i) {
                this.entityManager.entities[i].id = 1;
                expect(this.entityManager.getFirstUnusedEntity()).to.equal(i + 1);
            }
        });
        
        it('returns correct entityId when there is a gap in used entities', () => {
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(0);
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(0);
            
            for (let i = 0; i < 20; ++i) {
                this.entityManager.entities[i].id = 1;
            }
            
            this.entityManager.entities[10].id = 0;
            
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(10);
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(10);
            
            this.entityManager.entities[15].id = 0;
            
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(10);
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(10);
            
            this.entityManager.entities[10].id = 1;
            
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(15);
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(15);
            
            this.entityManager.entities[15].id = 1;
            
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(20);
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(20);
            
            this.entityManager.entities[0].id = 0;
            
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(0);
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(0);
        });
        
        it('returns [capacity] when there is no entities left in the entityManager', () => {
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                this.entityManager.entities[i].id = 1;
            }
            
            expect(this.entityManager.getFirstUnusedEntity()).to.equal(this.entityManager.capacity);
        });
        
        it('returns details of an entity when [returnDetails] = true', () => {
            let entity = this.entityManager.getFirstUnusedEntity(true);
            
            expect(entity).to.be.an('object');
            expect(entity).property('id').to.equal(0);
        });
        
         it('returns null when there is no entities left in the entityManager and [returnDetails] = true', () => {
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                this.entityManager.entities[i].id = 1;
            }
            
            expect(this.entityManager.getFirstUnusedEntity(true)).to.be.null;
        });
    });
});