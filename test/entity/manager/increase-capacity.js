import { expect }    from 'chai';
import EntityManager from '../../../src/core/entity';
import * as helpers  from '../../helpers';

describe('EntityManager', function() {
    describe('increaseCapacity()', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.component  = { x : 10, y : 20 };
            this.componentId = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, this.component, 1);
            
            this.entityId = 0;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.increaseCapacity).to.be.a('function');
        });
        
        it('increases capacity to be twice its old size', () => {
            expect(this.entityManager.capacity).to.equal(1000);
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.capacity).to.equal(2000);
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.capacity).to.equal(4000);
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.capacity).to.equal(8000);
        });

        it('adds entities as capacity is increased', () => {
            expect(this.entityManager.entities).property('length').to.equal(1000);
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.entities).property('length').to.equal(2000);
            
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i]).to.equal(0);
            }
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager.entities).property('length').to.equal(4000);
            
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i]).to.equal(0);
            }
        });
        
        it('adds components to the entityManager as capacity is increased', () => {
            expect(this.entityManager[this.componentId]).property('length').to.equal(1000);
            
            for (let component of this.entityManager[this.componentId]) {
                expect(component).to.equal(this.component);
            }
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager[this.componentId]).property('length').to.equal(2000);
            
            for (let component of this.entityManager[this.componentId]) {
                expect(component).to.be.an('object');
                expect(component).property('x').to.equal(this.component.x);
                expect(component).property('y').to.equal(this.component.y);
            }
            
            this.entityManager.increaseCapacity();
            
            expect(this.entityManager[this.componentId]).property('length').to.equal(4000);
            
            for (let component of this.entityManager[this.componentId]) {
                expect(component).to.be.an('object');
                expect(component).property('x').to.equal(this.component.x);
                expect(component).property('y').to.equal(this.component.y);
            }
        });
    });
});