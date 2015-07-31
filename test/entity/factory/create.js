import { expect }                       from 'chai';
import EntityManager, { EntityFactory } from '../../../src/core/entity';

describe('EntityFactory', function() {
    describe('create(entityManager, count = 1, configuration = undefined)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory();
            this.entityManager = new EntityManager()
            
            this.componentOne = 1;
            this.componentTwo = 2;
            this.componentThree = 8;
            this.componentFour = 32;
            
            this.componentOneInitializer = function() { this.x = 4.0; };
            this.componentTwoInitializer = function() { this.y = 5.0; };
            this.componentThreeInitializer = () => { return 15; };
            this.componentFourInitializer = () => { return "Full Name"; };
            
            this.entityFactory.configuration.set(this.componentOne, this.componentOneInitializer);
            this.entityFactory.configuration.set(this.componentTwo, this.componentTwoInitializer);
            this.entityFactory.configuration.set(this.componentThree, this.componentThreeInitializer);
            this.entityFactory.configuration.set(this.componentFour, this.componentFourInitializer);
            
            this.components = this.componentOne | this.componentTwo | this.componentThree | this.componentFour;
            
            this.entityManager[this.componentOne]   = [];
            this.entityManager[this.componentTwo]   = [];
            this.entityManager[this.componentThree] = [];
            this.entityManager[this.componentFour]  = [];
            
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                this.entityManager[this.componentOne].push(new (function() { this.x = 1.0; })());
                this.entityManager[this.componentTwo].push({ y : 2.0 });
                this.entityManager[this.componentThree].push(1);
                this.entityManager[this.componentFour].push('Name');
            }
        });
        
        afterEach(() => {
            delete this.entityManager;
            delete this.entityFactory;
        });
        
        it('is a function', () => {
            expect(this.entityFactory.create).to.be.a('function');
        });
        
        it('creates an entity according to the current [configuration]', () => {
            let entityId = this.entityFactory.create(this.entityManager)[0];

            expect(this.entityManager.entities[entityId]).to.equal(this.components);
            expect(this.entityManager[this.componentOne][entityId]).property('x').to.equal(4.0);
            expect(this.entityManager[this.componentTwo][entityId]).property('y').to.equal(5.0);
            expect(this.entityManager[this.componentThree][entityId]).to.equal(this.componentThreeInitializer());
            expect(this.entityManager[this.componentFour][entityId]).to.equal(this.componentFourInitializer());
        });
        
        it('does not change a components value if there is no initializer for that component', () => {
            this.entityFactory.configuration.set(this.componentOne, undefined);
            this.entityFactory.configuration.set(this.componentTwo, undefined);
            this.entityFactory.configuration.set(this.componentThree, undefined);
            this.entityFactory.configuration.set(this.componentFour, undefined);
            
            let entityId = this.entityFactory.create(this.entityManager)[0];

            expect(this.entityManager.entities[entityId]).to.equal(this.components);
            expect(this.entityManager[this.componentOne][entityId]).property('x').to.equal(1.0);
            expect(this.entityManager[this.componentTwo][entityId]).property('y').to.equal(2.0);
            expect(this.entityManager[this.componentThree][entityId]).to.equal(1);
            expect(this.entityManager[this.componentFour][entityId]).to.equal("Name");
        });
        
        it('creates an entity from a [configuration]', () => {
            let configuration = this.entityFactory.configuration;
            
            this.entityFactory.configuration = new Map();
            
            let entities = this.entityFactory.create(this.entityManager);
            
            expect(entities).property('length').to.equal(0);
            
            entities = this.entityFactory.create(this.entityManager, 1, configuration);

            expect(entities).property('length').to.equal(1);

            let entityId = entities[0];

            expect(this.entityManager.entities[entityId]).to.equal(this.components);
            expect(this.entityManager[this.componentOne][entityId]).property('x').to.equal(4.0);
            expect(this.entityManager[this.componentTwo][entityId]).property('y').to.equal(5.0);
            expect(this.entityManager[this.componentThree][entityId]).to.equal(this.componentThreeInitializer());
            expect(this.entityManager[this.componentFour][entityId]).to.equal(this.componentFourInitializer());
        });
        
        it('creates [count] number of entities', () => {
            let count = Math.floor(Math.random() * 100);
            expect(this.entityFactory.create(this.entityManager, count)).property('length').to.equal(count);
        });
        
        it('creates [count] number of entities from [configuration]', () => {
            let configuration = this.entityFactory.configuration;
            
            this.entityFactory.configuration = new Map();
            
            let count = Math.floor(Math.random() * 100);
            expect(this.entityFactory.create(this.entityManager, count, configuration)).property('length').to.equal(count);
        });
        
        it('returns an empty array if [entityManager] is not an instance of EntityManager', () => {
            let entities = this.entityFactory.create();
            expect(entities).to.be.an.instanceof(Array);
            expect(entities).property('length').to.equal(0);
            
            entities = this.entityFactory.create(new Map());
            expect(entities).to.be.an.instanceof(Array);
            expect(entities).property('length').to.equal(0);
            
            entities = this.entityFactory.create([]);
            expect(entities).to.be.an.instanceof(Array);
            expect(entities).property('length').to.equal(0);
            
            entities = this.entityFactory.create({});
            expect(entities).to.be.an.instanceof(Array);
            expect(entities).property('length').to.equal(0);
            
            entities = this.entityFactory.create(null);
            expect(entities).to.be.an.instanceof(Array);
            expect(entities).property('length').to.equal(0);
            
            entities = this.entityFactory.create(1);
            expect(entities).to.be.an.instanceof(Array);
            expect(entities).property('length').to.equal(0);
            
            entities = this.entityFactory.create('not a EntityManager instance.');
            expect(entities).to.be.an.instanceof(Array);
            expect(entities).property('length').to.equal(0);
        });
    });
});