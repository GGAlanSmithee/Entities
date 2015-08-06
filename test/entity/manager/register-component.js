import { expect }    from 'chai';
import sinon         from 'sinon';
import EntityManager from '../../../src/core/entity';


describe('EntityManager', function() {
    describe('registerComponent(component)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.posComponent  = function() { this.x = 10; this.y = 20; };
            this.infoComponent = { name : 'Tester', age : 99 };
            this.velComponent  = 5.5;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.registerComponent).to.be.a('function');
        });
        
        it('registers a [component]', () => {
            let id = this.entityManager.registerComponent(this.posComponent);
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
            
            id = this.entityManager.registerComponent(this.infoComponent);
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
            
            id = this.entityManager.registerComponent(this.velComponent);
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
        });
        
        it('registers a [component]', () => {
            let id = this.entityManager.registerComponent(this.posComponent);
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
            
            id = this.entityManager.registerComponent(this.infoComponent);
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
            
            id = this.entityManager.registerComponent(this.velComponent);
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
        });
        
        it('invokes [componentManger].registerComponent with the registered [component]', () => {
            let spy = sinon.spy(this.entityManager.componentManager, 'registerComponent');
            
            this.entityManager.registerComponent(this.posComponent);
            
            expect(spy.calledOnce).to.be.true;
            expect(spy.calledWith(this.posComponent)).to.be.true;
        });
        
        it('invokes [entityFactory].registerInitializer with the id of the [component]', () => {
            let spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer');
            
            let id = this.entityManager.registerComponent(this.posComponent);
            
            expect(spy.calledOnce).to.be.true;
            expect(spy.calledWith(id)).to.be.true;
            
            id = this.entityManager.registerComponent(this.infoComponent);
            
            expect(spy.calledTwice).to.be.true;
            expect(spy.calledWith(id)).to.be.true;
            
            id = this.entityManager.registerComponent(this.velComponent);
            
            expect(spy.calledThrice).to.be.true;
            expect(spy.calledWith(id)).to.be.true;
        });
        
        it('the generated initializers can be used to initialize components through build -> withComponent -> create', () => {
            let posComponentId  = this.entityManager.registerComponent(this.posComponent);
            let infoComponentId = this.entityManager.registerComponent(this.infoComponent);
            let velComponentId  = this.entityManager.registerComponent(this.velComponent);
            
            var config = this.entityManager.build()
                                           .withComponent(posComponentId)
                                           .withComponent(infoComponentId)
                                           .withComponent(velComponentId)
                                           .createConfiguration();
                                          
            let entityId = this.entityManager.create(1, config);
            
            expect(this.entityManager[posComponentId][entityId]).property('x').to.equal(10);
            expect(this.entityManager[posComponentId][entityId]).property('y').to.equal(20);
            expect(this.entityManager[infoComponentId][entityId]).property('name').to.equal('Tester');
            expect(this.entityManager[infoComponentId][entityId]).property('age').to.equal(99);
            expect(this.entityManager[velComponentId][entityId]).to.equal(5.5);
            
            this.entityManager[posComponentId][entityId].x = 20;
            this.entityManager[posComponentId][entityId].y = 40;
            this.entityManager[infoComponentId][entityId].name = 'New Tester';
            this.entityManager[infoComponentId][entityId].age = 1;
            this.entityManager[velComponentId][entityId] = -2.5;
            
            expect(this.entityManager[posComponentId][entityId]).property('x').to.equal(20);
            expect(this.entityManager[posComponentId][entityId]).property('y').to.equal(40);
            expect(this.entityManager[infoComponentId][entityId]).property('name').to.equal('New Tester');
            expect(this.entityManager[infoComponentId][entityId]).property('age').to.equal(1);
            expect(this.entityManager[velComponentId][entityId]).to.equal(-2.5);
            
            let oldEntityId = entityId;
            
            this.entityManager.deleteEntity(entityId);
            
            entityId = this.entityManager.create(1, config);
            
            expect(entityId).to.equal(oldEntityId);
            
            expect(this.entityManager[posComponentId][entityId]).property('x').to.equal(10);
            expect(this.entityManager[posComponentId][entityId]).property('y').to.equal(20);
            expect(this.entityManager[infoComponentId][entityId]).property('name').to.equal('Tester');
            expect(this.entityManager[infoComponentId][entityId]).property('age').to.equal(99);
            expect(this.entityManager[velComponentId][entityId]).to.equal(5.5);
        });
        
        it('registers the [component] and creates an array of [capacity] nr of [component]s', () => {
            let id = this.entityManager.registerComponent(this.posComponent);
            
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
            expect(this.entityManager[id]).property('length').to.equal(this.entityManager.capacity);
            
            var posComponent = new this.posComponent();
            
            for (let component of this.entityManager[id]) {
                expect(component).property('x').to.equal(posComponent.x);
                expect(component).property('y').to.equal(posComponent.y);
            }
            
            id = this.entityManager.registerComponent(this.infoComponent);
            
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
            expect(this.entityManager[id]).property('length').to.equal(this.entityManager.capacity);
            
            for (let component of this.entityManager[id]) {
                expect(component).property('name').to.equal(this.infoComponent.name);
                expect(component).property('age').to.equal(this.infoComponent.age);
            }
            
            id = this.entityManager.registerComponent(this.velComponent);
            
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
            expect(this.entityManager[id]).property('length').to.equal(this.entityManager.capacity);
            
            for (let component of this.entityManager[id]) {
                expect(component).to.equal(this.velComponent);
            }
        });
    });
});