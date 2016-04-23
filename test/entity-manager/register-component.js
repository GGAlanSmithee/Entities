import { expect }    from 'chai';
import sinon         from 'sinon';
import EntityManager from '../../../src/core/entity-manager';


describe('EntityManager', function() {
    describe('registerComponent(key, component)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(100);
            
            this.entityId = 0;
            
            this.pos = 'pos';
            this.posComponent = function() { this.x = 10; this.y = 20; };
            
            this.info = 'info';
            this.infoComponent = { name : 'Tester', age : 99 };
            
            this.vel = 'vel';
            this.velComponent = 5.5;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.registerComponent).to.be.a('function');
        });
        
        it('registers a [component] as [key] on all entities', () => {
            const posObject = new this.posComponent();
            
            for (const entity of this.entityManager.entities) {
                expect(entity).to.not.have.property(this.pos);
                expect(entity).to.not.have.property(this.info);
                expect(entity).to.not.have.property(this.vel);
            }
            
            this.entityManager.registerComponent(this.pos, this.posComponent);
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject);
                expect(entity).to.not.have.property(this.info);
                expect(entity).to.not.have.property(this.vel);
            }
            
            this.entityManager.registerComponent(this.info, this.infoComponent);
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject);
                expect(entity).property(this.info).to.deep.equal(this.infoComponent);
                expect(entity).to.not.have.property(this.vel);
            }
            
            this.entityManager.registerComponent(this.vel, this.velComponent);
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject);
                expect(entity).property(this.info).to.deep.equal(this.infoComponent);
                expect(entity).property(this.vel).to.deep.equal(this.velComponent);
            }
        });
        
        it('overwrites an already registerd component for all enttities', () => {
            for (const entity of this.entityManager.entities) {
                expect(entity).to.not.have.property(this.info);
            }
            
            this.entityManager.registerComponent(this.info, this.infoComponent);
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.info).to.deep.equal(this.infoComponent);
            }
            
            this.entityManager.registerComponent(this.info, this.velComponent);
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.info).to.deep.equal(this.velComponent);
            }
        });
            
        it('invokes [componentManger].registerComponent with [key] and [component]', () => {
            const spy = sinon.spy(this.entityManager.componentManager, 'registerComponent');
            
            this.entityManager.registerComponent(this.pos, this.posComponent);
            
            expect(spy.calledOnce).to.be.true;
            expect(spy.calledWith(this.pos, this.posComponent)).to.be.true;
        });
        
        it('invokes [entityFactory].registerInitializer with the [key] of the [component]', () => {
            const spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer');
            
            this.entityManager.registerComponent(this.pos, this.posComponent);
            
            expect(spy.calledOnce).to.be.true;
            expect(spy.calledWith(this.pos)).to.be.true;
            
            this.entityManager.registerComponent(this.info, this.infoComponent);
            
            expect(spy.calledTwice).to.be.true;
            expect(spy.calledWith(this.info)).to.be.true;
            
            this.entityManager.registerComponent(this.vel, this.velComponent);
            
            expect(spy.calledThrice).to.be.true;
            expect(spy.calledWith(this.vel)).to.be.true;
        });
        
        it('the generated initializers can be used to initialize components through build -> withComponent -> create', () => {
            expect(true).to.be.false;
            
            // this.entityManager.registerComponent(this.pos, this.posComponent);
            // this.entityManager.registerComponent(this.info, this.infoComponent);
            // this.entityManager.registerComponent(this.vel, this.velComponent);
            
            // const config = this.entityManager.build()
            //                                  .withComponent(this.pos)
            //                                  .withComponent(this.info)
            //                                  .withComponent(this.vel)
            //                                  .createConfiguration();
                                          
            // let entityId = this.entityManager.create(1, config);
            
            // expect(this.entityManager[posComponentId][entityId]).property('x').to.equal(10);
            // expect(this.entityManager[posComponentId][entityId]).property('y').to.equal(20);
            // expect(this.entityManager[infoComponentId][entityId]).property('name').to.equal('Tester');
            // expect(this.entityManager[infoComponentId][entityId]).property('age').to.equal(99);
            // expect(this.entityManager[velComponentId][entityId]).to.equal(5.5);
            
            // this.entityManager[posComponentId][entityId].x = 20;
            // this.entityManager[posComponentId][entityId].y = 40;
            // this.entityManager[infoComponentId][entityId].name = 'New Tester';
            // this.entityManager[infoComponentId][entityId].age = 1;
            // this.entityManager[velComponentId][entityId] = -2.5;
            
            // expect(this.entityManager[posComponentId][entityId]).property('x').to.equal(20);
            // expect(this.entityManager[posComponentId][entityId]).property('y').to.equal(40);
            // expect(this.entityManager[infoComponentId][entityId]).property('name').to.equal('New Tester');
            // expect(this.entityManager[infoComponentId][entityId]).property('age').to.equal(1);
            // expect(this.entityManager[velComponentId][entityId]).to.equal(-2.5);
            
            // let oldEntityId = entityId;
            
            // this.entityManager.deleteEntity(entityId);
            
            // entityId = this.entityManager.create(1, config);
            
            // expect(entityId).to.equal(oldEntityId);
            
            // expect(this.entityManager[posComponentId][entityId]).property('x').to.equal(10);
            // expect(this.entityManager[posComponentId][entityId]).property('y').to.equal(20);
            // expect(this.entityManager[infoComponentId][entityId]).property('name').to.equal('Tester');
            // expect(this.entityManager[infoComponentId][entityId]).property('age').to.equal(99);
            // expect(this.entityManager[velComponentId][entityId]).to.equal(5.5);
        });
    });
});