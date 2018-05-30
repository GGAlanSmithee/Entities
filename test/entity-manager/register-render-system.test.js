import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../src/core/entity-manager'
import { SystemType }    from '../../src/core/system-manager'

describe('EntityManager', function() {
    describe('registerRenderSystem(selectorType, components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.position = 1
            this.positionName = 'position'
            
            this.velocity = 2
            this.velocityName = 'velocity'
            
            this.entityManager.componentLookup.set(this.positionName, this.position)
            this.entityManager.componentLookup.set(this.velocityName, this.velocity)
            
            this.draw = entity => entity
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.registerRenderSystem).to.be.a('function')
        })
        
        test('invokes [systemManager.registerSystem] with [type] = SystemType.Render', () => {
            let spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')

            let components = this.position | this.velocity
            let callback   = (entities) => { 
                for (let { entity } of entities) {
                    this.draw(entity)
                }
            }
            
            this.entityManager.registerRenderSystem(components, callback)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Render, components, callback)).to.be.true
        })
        
        test('returns the registered systems id', () => {
            let components = this.position | this.velocity
            let callback   = (entities) => { 
                for (let { entity } of entities) {
                    this.draw(entity)
                }
            }
            
            let systemId = this.entityManager.registerRenderSystem(components, callback)
            
            expect(systemId).to.equal(1)
            
            systemId = this.entityManager.registerRenderSystem(components, callback)
            
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
            
            const systemId = this.entityManager.registerRenderSystem(componentNames, callback)
            
            expect(systemId).to.equal(1)
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Render, components, callback)).to.be.true
        })
    })
})