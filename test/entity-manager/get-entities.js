import { expect }    from 'chai';
import EntityManager from '../../../src/core/entity-manager';

describe('EntityManager', function() {
    describe('getEntities(components = null)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(100);
            this.entityManager.currentMaxEntity = 20;
            
            this.entityId = 5;
            
            this.position = 'position';
            this.positionComponent = { x : 1, y : 1, z : -2 };
            
            this.velocity = 'velocity';
            this.velocityComponent = 0.25;
            
            this.stats = 'stats';
            this.statsComponent = { xp : 10000, level : 20 };
            
            this.components = [ this.position, this.velocity, this.stats ];
            this.entityManager.componentManager.components.set(this.position, this.positionComponent);
            this.entityManager.componentManager.components.set(this.velocity, this.velocityComponent);
            this.entityManager.componentManager.components.set(this.stats, this.statsComponent);
            
            this.entityManager.entities[this.entityId].components = this.components;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.getEntities).to.be.a('function');
        });
        
        it('returns an iterable of all entities up to [currentMaxEntity]', () => {
            this.entityManager.currentMaxEntity = 20;
            
            let it = this.entityManager.getEntities();
            
            let i = 0;
            while (it.next().done !== true) {
                ++i;
            }
            
            expect(i).to.equal(this.entityManager.currentMaxEntity).and.to.equal(20);
            
            expect(it.next()).property('value').to.be.undefined;
        });
            
        it('for each iteration, returns an object containing the pair of an [id] and [entity]', () => {
            this.entityManager.currentMaxEntity = 20;
            
            let i = 0;
            for (let { id, entity } of this.entityManager.getEntities()) {
                expect(id).to.equal(i);
                expect(entity).to.deep.equal(this.entityManager.entities[i]);
                ++i;
            }
            
            expect(i).to.equal(this.entityManager.currentMaxEntity);
            
            i = 0;
            for (let { id, entity } of this.entityManager.getEntities()) {
                expect(id).to.equal(i);
                expect(entity).to.deep.equal(this.entityManager.entities[i]);
                ++i;
            }
            
            expect(i).to.equal(this.entityManager.currentMaxEntity);
        });
        
        it('when called with [components], only returns entities that has [components]', () => {
            let visited = [];
            
            for (let { id } of this.entityManager.getEntities([ this.position, this.stats ])) {
                visited.push(id);
            }
            
            expect(visited).to.contain(this.entityId).and.property('length').to.equal(1);
            
            this.entityManager.entities[2].components = [ this.position, this.velocity ];
            
            visited = [];
            
            for (let { id } of this.entityManager.getEntities([ this.position, this.stats ])) {
                visited.push(id);
            }
            
            expect(visited).to.contain(this.entityId).and.property('length').to.equal(1);
            
            this.entityManager.entities[2].components = [ this.position, this.velocity, this.stats ];
            
            visited = [];
            
            for (let { id } of this.entityManager.getEntities([ this.position, this.stats ])) {
                visited.push(id);
            }
            
            expect(visited).to.contain(this.entityId).and.to.contain(2).and.property('length').to.equal(2);
            
            this.entityManager.entities[4].components = [ this.velocity ];
            
            visited = [];
            
            for (let { id } of this.entityManager.getEntities([ this.position, this.stats ])) {
                visited.push(id);
            }
            
            expect(visited).to.contain(this.entityId).and.to.contain(2).and.property('length').to.equal(2);
        });
    });
});