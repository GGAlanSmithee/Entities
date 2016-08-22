import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../src/core/entity-manager'
import { SystemType }    from '../../src/core/system-manager'

describe('EntityManager', function() {
    describe('registerRenderSystem(selectorType, components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.position = 1
            this.velocity = 2
            
            this.draw = entity => entity
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('is a function', () => {
            expect(this.entityManager.registerRenderSystem).to.be.a('function')
        })
        
        it('invokes [systemManager.registerSystem] with [type] = SystemType.Render', () => {
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
        
        it('returns the registered systems id', () => {
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
    })
})