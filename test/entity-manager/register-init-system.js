import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../src/core/entity-manager'
import { SystemType }    from '../../src/core/system-manager'

describe('EntityManager', function() {
    describe('registerInitSystem(selectorType, components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.position = 1
            this.positionName = 'position'
            
            this.velocity = 2
            this.velocityName = 'velocity'
            
            this.entityManager.componentLookup.set(this.positionName, this.position)
            this.entityManager.componentLookup.set(this.velocityName, this.velocity)
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('is a function', () => {
            expect(this.entityManager.registerInitSystem).to.be.a('function')
        })
        
        it('invokes [systemManager.registerSystem] with [type] = SystemType.Init', () => {
            const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            const components = this.position | this.velocity
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            this.entityManager.registerInitSystem(components, callback)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Init, components, callback)).to.be.true
        })
        
        it('returns the registered systems id', () => {
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
        
        it('registers a system given an array of component names', () => {
            const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            const components = this.position | this.velocity
            const componentNames = [ this.positionName, this.velocityName ]
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            const systemId = this.entityManager.registerInitSystem(componentNames, callback)
            
            expect(systemId).to.equal(1)
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Init, components, callback)).to.be.true
        })
    })
})