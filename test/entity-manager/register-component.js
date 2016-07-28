import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('registerComponent(component)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(100)
            
            this.entityId = 0
            
            this.pos = 1
            this.posComponent = function() { this.x = 10; this.y = 20 }
            
            this.info = 2
            this.infoComponent = { name : 'Tester', age : 99 }
            
            this.vel = 4
            this.velComponent = 5.5
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('is a function', () => {
            expect(this.entityManager.registerComponent).to.be.a('function')
        })
        
        it('registers a [component] as [componentId] on all entities', () => {
            const posObject = new this.posComponent()
            
            for (const entity of this.entityManager.entities) {
                expect(entity).to.not.have.property(this.pos)
                expect(entity).to.not.have.property(this.info)
                expect(entity).to.not.have.property(this.vel)
            }
            
            this.entityManager.registerComponent(this.posComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject)
                expect(entity).to.not.have.property(this.info)
                expect(entity).to.not.have.property(this.vel)
            }
            
            this.entityManager.registerComponent(this.infoComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject)
                expect(entity).property(this.info).to.deep.equal(this.infoComponent)
                expect(entity).to.not.have.property(this.vel)
            }
            
            this.entityManager.registerComponent(this.velComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject)
                expect(entity).property(this.info).to.deep.equal(this.infoComponent)
                expect(entity).property(this.vel).to.deep.equal(this.velComponent)
            }
        })
            
        it('invokes [componentManger].registerComponent with [component]', () => {
            const spy = sinon.spy(this.entityManager.componentManager, 'registerComponent')
            
            this.entityManager.registerComponent(this.posComponent)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(this.posComponent)).to.be.true
        })
        
        it('invokes [entityFactory].registerInitializer with the [id] of the [component]', () => {
            const spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer')
            
            const pos = this.entityManager.registerComponent(this.posComponent)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(pos)).to.be.true
            
            const info = this.entityManager.registerComponent(this.infoComponent)
            
            expect(spy.calledTwice).to.be.true
            expect(spy.calledWith(info)).to.be.true
            
            const vel =  this.entityManager.registerComponent(this.velComponent)
            
            expect(spy.calledThrice).to.be.true
            expect(spy.calledWith(vel)).to.be.true
        })
        
        it('the generated initializers can be used to initialize components through build -> withComponent -> create', () => {
            const pos = this.entityManager.registerComponent(this.posComponent)
            const info = this.entityManager.registerComponent(this.infoComponent)
            const vel = this.entityManager.registerComponent(this.velComponent)
            
            const config = this.entityManager.build()
                                             .withComponent(pos)
                                             .withComponent(info)
                                             .withComponent(vel)
                                             .registerConfiguration()
                                          
            let {entity, id} = this.entityManager.create(1, config)
            
            expect(entity).property(pos).to.deep.equal({ x : 10, y : 20 })
            expect(entity).property(info).to.deep.equal({ name : 'Tester', age : 99 })
            expect(entity).property(vel).to.equal(5.5)
            
            entity[pos]  = { x: 20, y: 40 }
            entity[info] = { name: 'New Tester', age: 1 }
            entity[vel]  = -2.5
            
            expect(this.entityManager.entities[id]).property(pos).to.deep.equal({ x : 20, y : 40 })
            expect(this.entityManager.entities[id]).property(info).to.deep.equal({ name : 'New Tester', age : 1 })
            expect(this.entityManager.entities[id]).property(vel).to.equal(-2.5)

            const oldId = id
            
            this.entityManager.deleteEntity(id)
            
            let res = this.entityManager.create(1, config)
            
            expect(res.id).to.equal(oldId)
            
            expect(res.entity).property(pos).to.deep.equal({ x : 10, y : 20 })
            expect(res.entity).property(info).to.deep.equal({ name : 'Tester', age : 99 })
            expect(res.entity).property(vel).to.equal(5.5)
            
            expect(this.entityManager.entities[res.id]).property(pos).to.deep.equal({ x : 10, y : 20 })
            expect(this.entityManager.entities[res.id]).property(info).to.deep.equal({ name : 'Tester', age : 99 })
            expect(this.entityManager.entities[res.id]).property(vel).to.equal(5.5)
        })
    })
})