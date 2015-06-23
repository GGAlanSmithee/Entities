import { expect } from 'chai';
import   World    from '../../src/core/World';

describe('World', function() {
    describe('getFirstUnusedEntity(returnDetails = false)', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.getFirstUnusedEntity).to.be.a('function');
        });
        
        it('returns 0 when there is no entity added', () => {
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
        });
        
        it('returns correct entityId as more entities are added', () => {
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
            
            for (let i = 0; i < 20; ++i) {
                this.world.entities[i].id = 1;
                expect(this.world.getFirstUnusedEntity()).to.equal(i + 1);
            }
        });
        
        it('returns correct entityId when there is a gap in used entities', () => {
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
            
            for (let i = 0; i < 20; ++i) {
                this.world.entities[i].id = 1;
            }
            
            this.world.entities[10].id = 0;
            
            expect(this.world.getFirstUnusedEntity()).to.equal(10);
            expect(this.world.getFirstUnusedEntity()).to.equal(10);
            
            this.world.entities[15].id = 0;
            
            expect(this.world.getFirstUnusedEntity()).to.equal(10);
            expect(this.world.getFirstUnusedEntity()).to.equal(10);
            
            this.world.entities[10].id = 1;
            
            expect(this.world.getFirstUnusedEntity()).to.equal(15);
            expect(this.world.getFirstUnusedEntity()).to.equal(15);
            
            this.world.entities[15].id = 1;
            
            expect(this.world.getFirstUnusedEntity()).to.equal(20);
            expect(this.world.getFirstUnusedEntity()).to.equal(20);
            
            this.world.entities[0].id = 0;
            
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
        });
        
        it('returns [capacity] when there is no entities left in the world', () => {
            for (let i = 0; i < this.world.capacity; ++i) {
                this.world.entities[i].id = 1;
            }
            
            expect(this.world.getFirstUnusedEntity()).to.equal(this.world.capacity);
        });
        
        it('returns details of an entity when [returnDetails] = true', () => {
            let entity = this.world.getFirstUnusedEntity(true);
            
            expect(entity).to.be.an('object');
            expect(entity.id).to.equal(0);
        });
        
         it('returns null when there is no entities left in the world and [returnDetails] = true', () => {
            for (let i = 0; i < this.world.capacity; ++i) {
                this.world.entities[i].id = 1;
            }
            
            expect(this.world.getFirstUnusedEntity(true)).to.be.null;
        });
    });
});