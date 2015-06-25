import { expect } from 'chai';
import   World    from '../../src/core/World';
import { ComponentType } from '../../src/core/Component';
import { registerComponent, addComponentToEntity } from '../helpers';

describe('World', function() {
    describe('increaseCapacity()', () => {
        beforeEach(() => {
            this.world = new World();
            
            this.staticComponent      = registerComponent(this.world, ComponentType.Static, { x : 10, y : 20 }, 1);
            this.semiDynamicComponent = registerComponent(this.world, ComponentType.SemiDynamic, { x : 10, y : 20 }, 2);
            this.dynamicComponent     = registerComponent(this.world, ComponentType.Dynamic, { x : 10, y : 20 }, 4);
            
            this.entityId = 0;
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.increaseCapacity).to.be.a('function');
        });
        
        it('increases capacity to be twice its old size', () => {
            expect(this.world.capacity).to.equal(100);
            
            this.world.increaseCapacity();
            
            expect(this.world.capacity).to.equal(200);
            
            this.world.increaseCapacity();
            
            expect(this.world.capacity).to.equal(400);
            
            this.world.increaseCapacity();
            
            expect(this.world.capacity).to.equal(800);
        });

        it('adds entities as capacity is increased', () => {
            expect(this.world.entities).property('length').to.equal(100);
            
            this.world.increaseCapacity();
            
            expect(this.world.entities).property('length').to.equal(200);
            
            for (var i = 0; i < this.world.capacity; ++i) {
                expect(this.world.entities[i]).to.be.an('object');
            }
            
            this.world.increaseCapacity();
            
            expect(this.world.entities).property('length').to.equal(400);
            
            for (var i = 0; i < this.world.capacity; ++i) {
                expect(this.world.entities[i]).to.be.an('object');
            }
        });
        
        it('adds static components to entities as capacity is increased', () => {
            expect(this.world.entities).property('length').to.equal(100);
            
            for (let entity of this.world.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.have.property(this.staticComponent);
            }
            
            this.world.increaseCapacity();
            
            expect(this.world.entities).property('length').to.equal(200);
            
            for (let entity of this.world.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.have.property(this.staticComponent);
            }
            
            this.world.increaseCapacity();
            
            expect(this.world.entities).property('length').to.equal(400);
            
            for (let entity of this.world.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.have.property(this.staticComponent);
            }
        });
        
        it('does not add semiDynamic and dynamic components to entities as capacity is increased', () => {
            expect(this.world.entities).property('length').to.equal(100);
            
            for (let entity of this.world.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.not.have.property(this.semiDynamicComponent);
                expect(entity).to.not.have.property(this.dynamicComponent);
            }
            
            this.world.increaseCapacity();
            
            expect(this.world.entities).property('length').to.equal(200);
            
            for (let entity of this.world.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.not.have.property(this.semiDynamicComponent);
                expect(entity).to.not.have.property(this.dynamicComponent);
            }
            
            this.world.increaseCapacity();
            
            expect(this.world.entities).property('length').to.equal(400);
            
            for (let entity of this.world.entities) {
                expect(entity).property('id').to.equal(0);
                expect(entity).to.not.have.property(this.semiDynamicComponent);
                expect(entity).to.not.have.property(this.dynamicComponent);
            }
        });
        
        it('gracefully exits when there are no [components]', () => {
            this.world.components = [];
            
            expect(this.world.entities).property('length').to.equal(100);
            
            this.world.increaseCapacity();
            
            expect(this.world.entities).property('length').to.equal(200);
            
            this.world.components = new Map();
            
            this.world.increaseCapacity();
            
            expect(this.world.entities).property('length').to.equal(400);
        });
    });
});