import { expect } from 'chai';
import { EntityFactory } from '../../../src/core/Entity';
import World from '../../../src/core/World';

describe('EntityFactory', function() {
    describe('method chaining', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory();
            this.world = new World();
            
            this.componentOne = this.world.registerComponent({ x : 10 });
            this.componentTwo = this.world.registerComponent('From component');
            
            this.entityFactory.registerInitializer(this.componentOne, function() { this.x = 20; });
            this.entityFactory.registerInitializer(this.componentTwo, function() { return 'From initializer'; });
        });
        
        afterEach(() => {
            delete this.entityFactory;
            delete this.world;
        });
        
        it('allows for an entity to be created by chained method calls', () => {
            let entities = this.entityFactory.build()
                                             .withComponent(this.componentOne)
                                             .withComponent(this.componentTwo)
                                             .create(this.world);
                                           
            expect(entities).to.be.an.instanceof(Array);
            expect(entities).property('length').to.equal(1);
            
            let entity = entities[0];
            
            expect(entity).to.be.an.instanceof(Object);
            
            expect(entity).to.have.property(this.componentOne);
            expect(entity).property(this.componentOne).property('x').to.equal(20);
            
            expect(entity).to.have.property(this.componentTwo);
            expect(entity).property(this.componentTwo).to.equal('From initializer');
        });
        
        it('allows for overridden configurations when creating an entity by chained method calls', () => {
            let entities = this.entityFactory.build()
                                             .withComponent(this.componentOne, function() { this.x = 200; })
                                             .withComponent(this.componentTwo, () => { return 'From overridden initializer'; })
                                             .create(this.world);
                                           
            expect(entities).to.be.an.instanceof(Array);
            expect(entities).property('length').to.equal(1);
            
            let entity = entities[0];
            
            expect(entity).to.be.an.instanceof(Object);
            
            expect(entity).to.have.property(this.componentOne);
            expect(entity).property(this.componentOne).property('x').to.equal(200);
            
            expect(entity).to.have.property(this.componentTwo);
            expect(entity).property(this.componentTwo).to.equal('From overridden initializer');
        });
        
        it('allows for an entity to be created from a passed in configuration', () => {
            let configuration = this.entityFactory.build()
                                             .withComponent(this.componentOne)
                                             .withComponent(this.componentTwo)
                                             .createConfiguration();
                                           
            this.entityFactory.configuration = new Map();
            
            let entities = this.entityFactory.create(this.world, 1, configuration);
            
            expect(entities).to.be.an.instanceof(Array);
            expect(entities).property('length').to.equal(1);
            
            let entity = entities[0];
            
            expect(entity).to.be.an.instanceof(Object);
            
            expect(entity).to.have.property(this.componentOne);
            expect(entity).property(this.componentOne).property('x').to.equal(20);
            
            expect(entity).to.have.property(this.componentTwo);
            expect(entity).property(this.componentTwo).to.equal('From initializer');
        });
    });
});