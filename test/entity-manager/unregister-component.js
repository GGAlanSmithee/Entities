import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('unregisterComponent(component)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(10)
            
            this.pos = 1
            this.posName = 'pos'
            this.posComponent = function() { this.x = 10; this.y = 20 }
            
            this.entityManager.componentManager.components.set(this.pos, this.posComponent)
            
            this.entityManager.componentLookup.set(this.posName, this.pos)
            
            for (const entity of this.entityManager.entities) {
                entity[this.pos] = new this.posComponent()
                Object.defineProperty(entity, this.posName, { get() { return this[this.pos] }, configurable: true })
            }
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('is a function', () => {
            expect(this.entityManager.unregisterComponent).to.be.a('function')
        })
        
        it('removes the entry for the [component] in the [EntityManager.componentLookup]', () => {
            expect(this.entityManager.componentLookup.get(this.posName)).to.equal(this.pos)
            
            this.entityManager.unregisterComponent(this.pos)
            
            expect(this.entityManager.componentLookup.get(this.posName)).to.be.undefined
        })
        
        it('removes the entry for the [component] in the [EntityManager.componentLookup] using the components [name]', () => {
            expect(this.entityManager.componentLookup.get(this.posName)).to.equal(this.pos)
            
            this.entityManager.unregisterComponent(this.posName)
            
            expect(this.entityManager.componentLookup.get(this.posName)).to.be.undefined
        })
        
        it('removes a previously registered [component] from all entities', () => {
            const posComponent = new this.posComponent()
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posComponent)
                expect(Object.getOwnPropertyDescriptor(entity, this.posName).get).to.be.a.function
            }
            
            this.entityManager.unregisterComponent(this.pos)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).to.not.have.property(this.pos)
                expect(Object.getOwnPropertyDescriptor(entity, this.posName)).to.be.undefined
            }
        })
        
        it('removes a previously registered [component] from all entities, using the [name] of the [component]', () => {
            const posComponent = new this.posComponent()
            
            for (const entity of this.entityManager.entities) {
                expect(entity).property(this.pos).to.deep.equal(posComponent)
                expect(Object.getOwnPropertyDescriptor(entity, this.posName).get).to.be.a.function
            }
            
            this.entityManager.unregisterComponent(this.posName)
            
            for (const entity of this.entityManager.entities) {
                expect(entity).to.not.have.property(this.pos)
                expect(Object.getOwnPropertyDescriptor(entity, this.posName)).to.be.undefined
            }
        })
        
        it('invokes [ComponentManager.unregisterComponent] with the [id] of the [component]', () => {
            const spy = sinon.spy(this.entityManager.componentManager, 'unregisterComponent')
            
            this.entityManager.unregisterComponent(this.pos)
            
            expect(spy.calledWith(this.pos)).to.be.true
            expect(spy.calledOnce).to.be.true
        })
        
        it('invokes [ComponentManager.unregisterComponent] with the [id] of the [component] when unregistering using [name]', () => {
            const spy = sinon.spy(this.entityManager.componentManager, 'unregisterComponent')
            
            this.entityManager.unregisterComponent(this.posName)
            
            expect(spy.calledWith(this.pos)).to.be.true
            expect(spy.calledOnce).to.be.true
        })
        
        it('invokes [EntityFactory.unregisterInitializer] with the [id] of the [component]', () => {
            const spy = sinon.spy(this.entityManager.entityFactory, 'unregisterInitializer')
            
            this.entityManager.unregisterComponent(this.pos)
            
            expect(spy.calledWith(this.pos)).to.be.true
            expect(spy.calledOnce).to.be.true
        })
        
        it('invokes [EntityFactory.unregisterInitializer] with the [id] of the [component] when unregistering using [name]', () => {
            const spy = sinon.spy(this.entityManager.entityFactory, 'unregisterInitializer')
            
            this.entityManager.unregisterComponent(this.posName)
            
            expect(spy.calledWith(this.pos)).to.be.true
            expect(spy.calledOnce).to.be.true
        })
        
        it('does not invoke [ComponentManager.unregisterComponent] or [EntityFactory.unregisterInitializer] if the [component] is not in the [componentLookup]', () => {
            const compSpy = sinon.spy(this.entityManager.componentManager, 'unregisterComponent')
            const entSpy  = sinon.spy(this.entityManager.entityFactory, 'unregisterInitializer')
            
            this.entityManager.componentLookup = new Map()
            
            this.entityManager.unregisterComponent(this.pos)
            
            expect(compSpy.calledOnce).to.be.false
            expect(entSpy.calledOnce).to.be.false
        })
        
        it('throws an exception if [component] is not an id or name of a registered component', () => {
            expect(() => { this.entityManager.unregisterComponent() }).to.throw(TypeError, 'component must be either an id or name of a registered component.')
            expect(() => { this.entityManager.unregisterComponent(null) }).to.throw(TypeError, 'component must be either an id or name of a registered component.')
            expect(() => { this.entityManager.unregisterComponent(undefined) }).to.throw(TypeError, 'component must be either an id or name of a registered component.')
            expect(() => { this.entityManager.unregisterComponent([]) }).to.throw(TypeError, 'component must be either an id or name of a registered component.')
            expect(() => { this.entityManager.unregisterComponent({}) }).to.throw(TypeError, 'component must be either an id or name of a registered component.')
            expect(() => { this.entityManager.unregisterComponent(new Map()) }).to.throw(TypeError, 'component must be either an id or name of a registered component.')
        })
    })
})