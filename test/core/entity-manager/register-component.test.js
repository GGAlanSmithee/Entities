import { expect }              from 'chai'
import sinon                   from 'sinon'
import { isNonEmptyStringMsg } from '../../../src/validate/is-non-empty-string'
import { doesNotContainMsg } from '../../../src/validate/does-not-contain'
import { EntityManager }       from '../../../src/core/entity-manager'

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
        
        test('is a function', () => {
            expect(this.entityManager.registerComponent).to.be.a('function')
        })
        
        test('registers a [component] with its [key] on all entities', () => {
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
      
        test('invokes [componentManger].registerComponent with [component]', () => {
            const spy = sinon.spy(this.entityManager.componentManager, 'registerComponent')
            
            this.entityManager.registerComponent(this.pos, this.posComponent)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(this.pos)).to.be.true
        })
        
        test('invokes [entityFactory].registerInitializer with the [key] of the [component]', () => {
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
        
        test('throws error if there is a component with [key] already registered', () => {
            this.entityManager.registerComponent(this.pos, this.posComponent)
            expect(this.pos).to.equal('pos')
            
            expect(() => { this.entityManager.registerComponent(this.pos, this.posComponent) }).to.throw(
                TypeError,
                doesNotContainMsg(this.pos, 'components')
            )
        })
        
        test('the generated initializers can be used to initialize components through build -> withComponent -> create', () => {
            this.entityManager.registerComponent(this.pos, this.posComponent)
            this.entityManager.registerComponent(this.info, this.infoComponent)
            this.entityManager.registerComponent(this.vel, this.velComponent)
            
            const config = ' myConf'
            
            this.entityManager
                .build()
                .withComponent(this.pos)
                .withComponent(this.info)
                .withComponent(this.vel)
                .registerConfiguration(config)
                                          
            let [ entity, ] = this.entityManager.create(1, config)
            
            expect(entity).property(this.pos).to.deep.equal({ x : 10, y : 20 })
            expect(entity).property(this.info).to.deep.equal({ name : 'Tester', age : 99 })
            expect(entity).property(this.vel).to.equal(5.5)
            
            entity[this.pos]  = { x: 20, y: 40 }
            entity[this.info] = { name: 'New Tester', age: 1 }
            entity[this.vel]  = -2.5
            
            expect(this.entityManager.entities[entity.id]).property(this.pos).to.deep.equal({ x : 20, y : 40 })
            expect(this.entityManager.entities[entity.id]).property(this.info).to.deep.equal({ name : 'New Tester', age : 1 })
            expect(this.entityManager.entities[entity.id]).property(this.vel).to.equal(-2.5)

            const oldId = entity.id
            
            this.entityManager.deleteEntity(entity.id)
            
                entity = this.entityManager.create(1, config)[0]
            
            expect(entity.id).to.equal(oldId)
            
            expect(entity).property(this.pos).to.deep.equal({ x : 10, y : 20 })
            expect(entity).property(this.info).to.deep.equal({ name : 'Tester', age : 99 })
            expect(entity).property(this.vel).to.equal(5.5)
            
            expect(this.entityManager.entities[entity.id]).property(this.pos).to.deep.equal({ x : 10, y : 20 })
            expect(this.entityManager.entities[entity.id]).property(this.info).to.deep.equal({ name : 'Tester', age : 99 })
            expect(this.entityManager.entities[entity.id]).property(this.vel).to.equal(5.5)
        })
        
        test('throws error if [key] is not a non-empty string', () => {
            expect(() => { this.entityManager.registerComponent(undefined, {}) }).to.throw(TypeError, isNonEmptyStringMsg('key', undefined))
            expect(() => { this.entityManager.registerComponent(null, {}) }).to.throw(TypeError, isNonEmptyStringMsg('key', null))
            expect(() => { this.entityManager.registerComponent('', {}) }).to.throw(TypeError, isNonEmptyStringMsg('key', ''))
            expect(() => { this.entityManager.registerComponent(1, {}) }).to.throw(TypeError, isNonEmptyStringMsg('key', 1))
            expect(() => { this.entityManager.registerComponent(1.5, {}) }).to.throw(TypeError, isNonEmptyStringMsg('key', 1.5))
            expect(() => { this.entityManager.registerComponent([], {}) }).to.throw(TypeError, isNonEmptyStringMsg('key', []))
            expect(() => { this.entityManager.registerComponent(['a', 'b'], {}) }).to.throw(TypeError, isNonEmptyStringMsg('key', [ 'a', 'b']))
            expect(() => { this.entityManager.registerComponent(new Map(), {}) }).to.throw(TypeError, isNonEmptyStringMsg('key', new Map()))
        })
    })
})