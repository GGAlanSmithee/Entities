import { expect }    from 'chai';
import EntityManager from '../../../src/core/Entity';
import sinon         from 'sinon';

describe('EntityManager', function() {
    describe('registerComponent(component, initializer)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.posComponent  = function() { this.x = 10, this.y = 20 };
            this.infoComponent = { name : 'Tester', age : 99 };
            this.velComponent  = 5.5;
            
            this.posInitializer  = function() { this.x = 20; this.y = 40; };
            this.infoInitializer = function() { this.name = 'Luffy'; this.age = 4; };
            this.velInitializer  = function() { return 2.5; };
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
        
        it('registers a [component] with an [initializer]', () => {
            let id = this.entityManager.registerComponent(this.posComponent, this.posInitializer);
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
            
            id = this.entityManager.registerComponent(this.infoComponent, this.infoInitializer);
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
            
            id = this.entityManager.registerComponent(this.velComponent, this.velInitializer);
            expect(this.entityManager[id]).to.be.an.instanceof(Array);
        });
        
        it('invokes [componentManger].registerComponent with the registered [component]', () => {
            let spy = sinon.spy(this.entityManager.componentManager, 'registerComponent');
            
            this.entityManager.registerComponent(this.posComponent);
            
            expect(spy.calledOnce).to.be.true;
            expect(spy.calledWith(this.posComponent)).to.be.true;
        });
        
        it('invokes [entityFactory].registerInitializer with the [component]s id and [initializer] if [initializer] is a function', () => {
            let spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer');
            
            let id = this.entityManager.registerComponent(this.posComponent, this.posInitializer);
            
            expect(spy.calledOnce).to.be.true;
            expect(spy.calledWith(id, this.posInitializer)).to.be.true;
        });
        
        it('does not invoke [entityFactory].registerInitializer if [initializer] is not a function', () => {
            let spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer');
            
            this.entityManager.registerComponent(this.posComponent);
            this.entityManager.registerComponent(this.infoComponent, []);
            this.entityManager.registerComponent(this.infoComponent, {});
            
            expect(spy.called).to.be.false;
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