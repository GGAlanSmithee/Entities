import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../src/core/entity-manager'
import { SystemType }    from '../../src/core/system-manager'

describe('EntityManager', function() {
    describe('registerSystem(type, components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.position = 1
            this.positionName = 'position'
            
            this.velocity = 2
            this.velocityName = 'velocity'
            
            this.appearance = 4
            this.appearanceName = 'appearance'

            this.entityManager.componentLookup.set(this.positionName, this.position)
            this.entityManager.componentLookup.set(this.velocityName, this.velocity)
            this.entityManager.componentLookup.set(this.appearanceName, this.appearance)
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.registerSystem).to.be.a('function')
        })
        
        test('registers a system with the correct components', () => {
            const components = this.position | this.velocity
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            this.entityManager.registerSystem(SystemType.Init, components, callback)
            
            const { initSystems, } = this.entityManager.systemManager

            expect(initSystems.size).to.equal(1)
        })

        test('registers a system with the correct components', () => {
            const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            const components = this.appearance
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.appearance = 'test.jpg' // makes no sense
                }
            }
            
            this.entityManager.registerSystem(SystemType.Render, components, callback)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Render, components, callback)).to.be.true
        })
        
        test('returns the registered systems id', () => {
            const components = this.position | this.velocity
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            let systemId = this.entityManager.registerSystem(SystemType.Logic, components, callback)
            
            expect(systemId).to.equal(1)
            
            systemId = this.entityManager.registerSystem(SystemType.Render, components, callback)
            
            expect(systemId).to.equal(2)
        })
        
        test('registers a system given an array of component names', () => {
            const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            const components = this.position | this.velocity | this.appearance
            const componentNames = [ this.positionName, this.velocityName, this.appearanceName ]
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            const systemId = this.entityManager.registerSystem(SystemType.Init, componentNames, callback)
            
            expect(systemId).to.equal(1)
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Init, components, callback)).to.be.true
        })

        test('registers a system given an array of component names, not using all registered components 1', () => {
            const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            const components = this.position | this.velocity
            const componentNames = [ this.positionName, this.velocityName ]
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            const systemId = this.entityManager.registerSystem(SystemType.Init, componentNames, callback)
            
            expect(systemId).to.equal(1)
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Init, components, callback)).to.be.true
        })

        test('registers a system given an array of component names, not using all registered components 2', () => {
            const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            const components = this.position
            const componentNames = [ this.positionName ]
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            const systemId = this.entityManager.registerSystem(SystemType.Logic, componentNames, callback)
            
            expect(systemId).to.equal(1)
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Logic, components, callback)).to.be.true
        })
    })
})