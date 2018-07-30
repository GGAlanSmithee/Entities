import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('registerComponent(name, component)', () => {
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
        
        test('is a function', () => {
            expect(this.entityManager.registerComponent).to.be.a('function')
        })
        
        test('registers a [component] as [componentId] on all entities', () => {
            const posObject = new this.posComponent()
            
            for (const entity of this.entityManager.entities) {
                expect(entity).to.not.have.property(this.pos)
                expect(entity).to.not.have.property(this.info)
                expect(entity).to.not.have.property(this.vel)
            }
            
            this.entityManager.registerComponent(this.posName, this.posComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject)
                expect(entity).to.not.have.property(this.info)
                expect(entity).to.not.have.property(this.vel)
            }
            
            this.entityManager.registerComponent(this.infoName, this.infoComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject)
                expect(entity).property(this.info).to.deep.equal(this.infoComponent)
                expect(entity).to.not.have.property(this.vel)
            }
            
            this.entityManager.registerComponent(this.velName, this.velComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject)
                expect(entity).property(this.info).to.deep.equal(this.infoComponent)
                expect(entity).property(this.vel).to.deep.equal(this.velComponent)
            }
        })
        
        test('adds a getter for the [component] by its name on all entities', () => {
            const posObject = new this.posComponent()
            
            for (const entity of this.entityManager.entities) {
                expect(entity).to.not.have.property(this.posName)
                expect(entity).to.not.have.property(this.infoName)
                expect(entity).to.not.have.property(this.velName)
            }
            
            this.entityManager.registerComponent(this.posName, this.posComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.posName).to.deep.equal(posObject)
                expect(entity).to.not.have.property(this.info)
                expect(entity).to.not.have.property(this.vel)
            }
            
            this.entityManager.registerComponent(this.infoName, this.infoComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject)
                expect(entity).property(this.infoName).to.deep.equal(this.infoComponent)
                expect(entity).to.not.have.property(this.vel)
            }
            
            this.entityManager.registerComponent(this.velName, this.velComponent)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posObject)
                expect(entity).property(this.info).to.deep.equal(this.infoComponent)
                expect(entity).property(this.velName).to.deep.equal(this.velComponent)
            }
        })
        
        test('invokes [componentManger].registerComponent with [component]', () => {
            const spy = sinon.spy(this.entityManager.componentManager, 'registerComponent')
            
            this.entityManager.registerComponent(this.posName, this.posComponent)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(this.posComponent)).to.be.true
        })
        
        test('invokes [entityFactory].registerInitializer with the [id] of the [component]', () => {
            const spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer')
            
            const pos = this.entityManager.registerComponent(this.posName, this.posComponent)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(pos)).to.be.true
            
            const info = this.entityManager.registerComponent(this.infoName, this.infoComponent)
            
            expect(spy.calledTwice).to.be.true
            expect(spy.calledWith(info)).to.be.true
            
            const vel =  this.entityManager.registerComponent(this.velName, this.velComponent)
            
            expect(spy.calledThrice).to.be.true
            expect(spy.calledWith(vel)).to.be.true
        })
        
        test('does not re-register a component if there already is a component with the [name] registered', () => {
            let pos = this.entityManager.registerComponent(this.posName, this.posComponent)
            expect(pos).to.equal(1)
            
            pos = this.entityManager.registerComponent(this.posName, this.posComponent)
            expect(pos).to.be.undefined
        })
        
        test('the generated initializers can be used to initialize components through build -> withComponent -> create', () => {
            const pos = this.entityManager.registerComponent(this.posName, this.posComponent)
            const info = this.entityManager.registerComponent(this.infoName, this.infoComponent)
            const vel = this.entityManager.registerComponent(this.velName, this.velComponent)
            
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
        
        test('throws error if [name] is not a non-empty string', () => {
            expect(() => { this.entityManager.registerComponent(undefined, {}) }).to.throw(TypeError, 'name must be a non-empty string.')
            expect(() => { this.entityManager.registerComponent(null, {}) }).to.throw(TypeError, 'name must be a non-empty string.')
            expect(() => { this.entityManager.registerComponent('', {}) }).to.throw(TypeError, 'name must be a non-empty string.')
            expect(() => { this.entityManager.registerComponent(1, {}) }).to.throw(TypeError, 'name must be a non-empty string.')
            expect(() => { this.entityManager.registerComponent(1.5, {}) }).to.throw(TypeError, 'name must be a non-empty string.')
            expect(() => { this.entityManager.registerComponent([], {}) }).to.throw(TypeError, 'name must be a non-empty string.')
            expect(() => { this.entityManager.registerComponent(['a', 'b'], {}) }).to.throw(TypeError, 'name must be a non-empty string.')
            expect(() => { this.entityManager.registerComponent(new Map(), {}) }).to.throw(TypeError, 'name must be a non-empty string.')
        })
    })
})