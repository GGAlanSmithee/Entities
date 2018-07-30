import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'
import { SystemType }    from '../../../src/core/system-manager'

describe('EntityManager', function() {
    describe('registerInitSystem(components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(50)
            
            this.position = 1
            this.positionName = 'position'
            
            this.velocity = 2
            this.velocityName = 'velocity'

            this.entityId = 0
            this.entity = {
                components: this.position | this.velocity,
                [this.position]: { x: 0, y: 0, },
                [this.velocity]: 2,
            }

            Object.defineProperty(this.entity, this.positionName, { get() { return this[this.position] }, configurable: true })
            Object.defineProperty(this.entity, this.velocityName, { get() { return this[this.velocity] }, configurable: true })

            this.entityManager.entities[this.entityId] = this.entity

            this.entityManager.componentLookup.set(this.positionName, this.position)
            this.entityManager.componentLookup.set(this.velocityName, this.velocity)
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.registerInitSystem).to.be.a('function')
        })
        
        test('invokes [systemManager.registerSystem] with [type] = SystemType.Init', () => {
            const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            const components = this.position | this.velocity
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }

            const entityIds = [ this.entityId, ]

            this.entityManager.registerInitSystem(components, callback)
            
            expect(spy.calledOnce).to.be.true

            expect(spy.calledWith(SystemType.Init, components, entityIds, callback)).to.be.true
        })
        
        test('returns the registered systems id', () => {
            const components = this.position | this.velocity
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            let systemId = this.entityManager.registerInitSystem(components, callback)
            
            expect(systemId).to.equal(1)
            
            systemId = this.entityManager.registerInitSystem(components, callback)
            
            expect(systemId).to.equal(2)
        })
        
        test('registers a system given an array of component names', () => {
            const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')

            const components = this.position | this.velocity
            const componentNames = [ this.positionName, this.velocityName ]
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }

            const entityIds = [ this.entityId, ]
            
            const systemId = this.entityManager.registerInitSystem(componentNames, callback)
            
            expect(systemId).to.equal(1)
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Init, components, entityIds, callback)).to.be.true
        })
    })
})