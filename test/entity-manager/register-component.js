import { expect }    from 'chai'
import sinon         from 'sinon'
import EntityManager from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('registerComponent(key, component)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(100)
            
            this.entityId = 0
            
            this.pos = 'pos'
            this.posComponent = function() { this.x = 10; this.y = 20 }
            
            this.info = 'info'
            this.infoComponent = { name : 'Tester', age : 99 }
            
            this.vel = 'vel'
            this.velComponent = 5.5
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('is a function', () => {
            expect(this.entityManager.registerComponent).to.be.a('function')
        })
        
        it('registers a [component] as [key] on all entities', () => {
            const posObject = new this.posComponent()
            
            for (const entity of this.entityManager.entities) {
                expect(entity).to.not.have.property(this.pos)
                expect(entity).to.not.have.property(this.info)
                expect(entity).to.not.have.property(this.vel)
            }
            
            this.entityManager.registerComponent(this.pos, this.posComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject)
                expect(entity).to.not.have.property(this.info)
                expect(entity).to.not.have.property(this.vel)
            }
            
            this.entityManager.registerComponent(this.info, this.infoComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject)
                expect(entity).property(this.info).to.deep.equal(this.infoComponent)
                expect(entity).to.not.have.property(this.vel)
            }
            
            this.entityManager.registerComponent(this.vel, this.velComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject)
                expect(entity).property(this.info).to.deep.equal(this.infoComponent)
                expect(entity).property(this.vel).to.deep.equal(this.velComponent)
            }
        })
        
        it('overwrites an already registerd component for all enttities', () => {
            for (const entity of this.entityManager.entities) {
                expect(entity).to.not.have.property(this.info)
            }
            
            this.entityManager.registerComponent(this.info, this.infoComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.info).to.deep.equal(this.infoComponent)
            }
            
            this.entityManager.registerComponent(this.info, this.velComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.info).to.deep.equal(this.velComponent)
            }
        })
            
        it('invokes [componentManger].registerComponent with [key] and [component]', () => {
            const spy = sinon.spy(this.entityManager.componentManager, 'registerComponent')
            
            this.entityManager.registerComponent(this.pos, this.posComponent)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(this.pos, this.posComponent)).to.be.true
        })
        
        it('invokes [entityFactory].registerInitializer with the [key] of the [component]', () => {
            const spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer')
            
            this.entityManager.registerComponent(this.pos, this.posComponent)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(this.pos)).to.be.true
            
            this.entityManager.registerComponent(this.info, this.infoComponent)
            
            expect(spy.calledTwice).to.be.true
            expect(spy.calledWith(this.info)).to.be.true
            
            this.entityManager.registerComponent(this.vel, this.velComponent)
            
            expect(spy.calledThrice).to.be.true
            expect(spy.calledWith(this.vel)).to.be.true
        })
        
        it('the generated initializers can be used to initialize components through build -> withComponent -> create', () => {
            this.entityManager.registerComponent(this.pos, this.posComponent)
            this.entityManager.registerComponent(this.info, this.infoComponent)
            this.entityManager.registerComponent(this.vel, this.velComponent)
            
            const config = 'config';
            this.entityManager.build()
                              .withComponent(this.pos)
                              .withComponent(this.info)
                              .withComponent(this.vel)
                              .registerConfiguration(config)
                                          
            let res = this.entityManager.create(1, config)
            
            expect(res.entity).property(this.pos).to.deep.equal({ x : 10, y : 20 })
            expect(res.entity).property(this.info).to.deep.equal({ name : 'Tester', age : 99 })
            expect(res.entity).property(this.vel).to.equal(5.5)
            
            res.entity.pos  = { x : 20, y : 40 }
            res.entity.info = { name : 'New Tester', age : 1 }
            res.entity.vel  = -2.5
            
            expect(this.entityManager.entities[res.id]).property(this.pos).to.deep.equal({ x : 20, y : 40 })
            expect(this.entityManager.entities[res.id]).property(this.info).to.deep.equal({ name : 'New Tester', age : 1 })
            expect(this.entityManager.entities[res.id]).property(this.vel).to.equal(-2.5)

            let oldId = res.id
            
            this.entityManager.deleteEntity(res.id)
            
            res = this.entityManager.create(1, config)
            
            expect(res.id).to.equal(oldId)
            
            expect(res.entity).property(this.pos).to.deep.equal({ x : 10, y : 20 })
            expect(res.entity).property(this.info).to.deep.equal({ name : 'Tester', age : 99 })
            expect(res.entity).property(this.vel).to.equal(5.5)
            
            expect(this.entityManager.entities[res.id]).property(this.pos).to.deep.equal({ x : 10, y : 20 })
            expect(this.entityManager.entities[res.id]).property(this.info).to.deep.equal({ name : 'Tester', age : 99 })
            expect(this.entityManager.entities[res.id]).property(this.vel).to.equal(5.5)
        })
    })
})