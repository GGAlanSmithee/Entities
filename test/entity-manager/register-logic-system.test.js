import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../src/core/entity-manager'
import { SystemType }    from '../../src/core/system-manager'

describe('EntityManager', function() {
    describe('registerLogicSystem(selectorType, components, callback)', () => {
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
        
        test('is a function', () => {
            expect(this.entityManager.registerLogicSystem).to.be.a('function')
        })
        
        test('invokes [systemManager.registerSystem] with [type] = SystemType.Logic', () => {
            let spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            let components = this.position | this.velocity
            let callback   = (entities, { delta }) => { 
                for (let { entity } of entities) {
                    entity.position += entity.velocity * delta
                }
            }
            
            this.entityManager.registerLogicSystem(components, callback)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Logic, components, callback)).to.be.true
        })
        
        test('returns the registered systems id', () => {
            let components = this.position | this.velocity
            let callback   = (entities, { delta }) => { 
                for (let { entity } of entities) {
                    entity.position += entity.velocity * delta
                }
            }
            
            let systemId = this.entityManager.registerLogicSystem(components, callback)
            
            expect(systemId).to.equal(1)
            
            systemId = this.entityManager.registerLogicSystem(components, callback)
            
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
            
            const systemId = this.entityManager.registerLogicSystem(componentNames, callback)
            
            expect(systemId).to.equal(1)
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Logic, components, callback)).to.be.true
        })
    })
})