import { expect }    from 'chai';
import EntityManager from '../../../src/core/entity-manager';

describe('EntityManager', function() {
    describe('newEntity(components)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(100);
            
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
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.newEntity).to.be.a('function');
        });
        
        it('adds and returns an object containing an id corresponding entity, given correct [components] input', () => {
            let res = this.entityManager.newEntity(this.components);
            
            expect(res.id).to.equal(0);
            expect(res.entity).to.deep.equal(this.entityManager.entities[res.id]);
            
            res = this.entityManager.newEntity(this.components);
            
            expect(res.id).to.equal(1);
            expect(res.entity).to.deep.equal(this.entityManager.entities[res.id]);
        });
        
        it('does not add an entity and returns [capacity], given wrong [components] input', () => {
            expect(() => this.entityManager.newEntity()).to.throw(TypeError, 'components argument must be an array of components.');
            expect(() => this.entityManager.newEntity('not an array')).to.throw(TypeError, 'components argument must be an array of components.');
            expect(() => this.entityManager.newEntity('')).to.throw(TypeError, 'components argument must be an array of components.');
            expect(() => this.entityManager.newEntity(null)).to.throw(TypeError, 'components argument must be an array of components.');
            expect(() => this.entityManager.newEntity(undefined)).to.throw(TypeError, 'components argument must be an array of components.');
            expect(() => this.entityManager.newEntity(0)).to.throw(TypeError, 'components argument must be an array of components.');
            expect(() => this.entityManager.newEntity(-1)).to.throw(TypeError, 'components argument must be an array of components.');
            expect(() => this.entityManager.newEntity(1)).to.throw(TypeError, 'components argument must be an array of components.');
            expect(() => this.entityManager.newEntity(1.5)).to.throw(TypeError, 'components argument must be an array of components.');
            expect(() => this.entityManager.newEntity({})).to.throw(TypeError, 'components argument must be an array of components.');
        });
        
        it('sets the [components] property of entities[entityId] to passed in [components]', () => {
            let { id, entity } = this.entityManager.newEntity(this.components);
            
            expect(this.entityManager.entities[id].components).to.deep.equal(this.components);
            expect(entity.components).to.deep.equal(this.components);
        });
        
        it('returns capacity and does not add an entity if there is no more space in the entityManager', () => {
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                this.entityManager.newEntity([ this.position ]);
            }
            
            let res = this.entityManager.newEntity([ this.position ]);
            expect(res.id).to.equal(this.entityManager.capacity);
            expect(res.entity).to.be.null;
            
            res = this.entityManager.newEntity([ this.position ]);
            expect(res.id).to.equal(this.entityManager.capacity);
            expect(res.entity).to.be.null;
            
            res = this.entityManager.newEntity([ this.position, this.stats ]);
            expect(res.id).to.equal(this.entityManager.capacity);
            expect(res.entity).to.be.null;
            
            res = this.entityManager.newEntity([ this.velocity ]);
            expect(res.id).to.equal(this.entityManager.capacity);
            expect(res.entity).to.be.null;
        });
        
        it('increases [currentMaxEntity] if [entityId] is larger than [currentMaxEntity]', () => {
            this.entityManager.currentMaxEntity = 0;
            
            let res = this.entityManager.newEntity(this.components);
            
            expect(res.id).to.equal(0);
            expect(this.entityManager.currentMaxEntity).to.equal(0);
            
            res = this.entityManager.newEntity(this.components);
            
            expect(res.id).to.equal(1);
            expect(this.entityManager.currentMaxEntity).to.equal(1);
            
            res = this.entityManager.newEntity(this.components);
            
            expect(res.id).to.equal(2);
            expect(this.entityManager.currentMaxEntity).to.equal(2);
            
            this.entityManager.entities[1].components = [];
            
            res = this.entityManager.newEntity(this.components);
            
            expect(res.id).to.equal(1);
            expect(this.entityManager.currentMaxEntity).to.equal(2);
        });
    });
});