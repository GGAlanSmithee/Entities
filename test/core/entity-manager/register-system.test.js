import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'
import { SystemType }    from '../../../src/core/system-manager'

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

            this.stats = 8
            this.statsName = 'stats'

            this.entityManager.componentLookup.set(this.positionName, this.position)
            this.entityManager.componentLookup.set(this.velocityName, this.velocity)
            this.entityManager.componentLookup.set(this.appearanceName, this.appearance)
            this.entityManager.componentLookup.set(this.statsName, this.stats)

            this.entityId1 = 0
            this.entity1 = {
                components: this.position | this.velocity | this.stats,
            }

            this.entityId2 = 1
            this.entity2 = {
                components: this.position | this.stats,
            }

            this.entityId3 = 2
            this.entity3 = {
                components: this.position | this.velocity | this.stats,
            }

            this.entityId4 = 3
            this.entity4 = {
                components: this.position,
            }

            this.entityId5 = 4
            this.entity5 = {
                components: 0,
            }

            this.entityId6 = 5
            this.entity6 = {
                components: this.position | this.velocity | this.appearance,
            }

            this.entityId7 = 6
            this.entity7 = {
                components: this.position | this.velocity | this.appearance,
            }

            this.entityManager.entities[this.entityId1] = this.entity1
            this.entityManager.entities[this.entityId2] = this.entity2
            this.entityManager.entities[this.entityId3] = this.entity3
            this.entityManager.entities[this.entityId4] = this.entity4
            this.entityManager.entities[this.entityId5] = this.entity5
            this.entityManager.entities[this.entityId6] = this.entity6
            this.entityManager.entities[this.entityId7] = this.entity7
        })
        
        afterEach(() => {
            delete this.entityManager
        })

        test('is a function', () => {
            expect(this.entityManager.registerSystem).to.be.a('function')
        })
        
        test('invokes [systemManager.registerSystem] with the correct parameters', () => {
            const type       = SystemType.Render
            const components = this.position | this.velocity | this.stats
            
            const callback = function(entities, { delta }) { 
                for (const { entity } of entities) {
                    entity.position += entity.velocity * delta
                }
            }
            
            const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            const systemId = this.entityManager.registerSystem(type, components, callback)
            
            const entityIds = [this.entityId1, this.entityId3]
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(type, components, entityIds, callback)).to.be.true
            expect(systemId).to.equal(1)
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
        
        test('invokes [systemManager.registerSystem] with the correct component ids, given component names', () => {
            const type           = SystemType.Render
            const components     = this.position | this.velocity | this.stats
            const componentNames = [ this.positionName, this.velocityName, this.statsName ]
            
            const callback = function(entities, { delta }) { 
                for (const { entity } of entities) {
                    entity.position += entity.velocity * delta
                }
            }
            
            const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            const systemId = this.entityManager.registerSystem(type, componentNames, callback)

            const entityIds = [this.entityId1, this.entityId3]

            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(type, components, entityIds, callback)).to.be.true
            expect(systemId).to.equal(1)
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
            
            // excludes entity 7 (id=6) since currentMaxEntity is = 5
            const entityIds = [this.entityId6]

            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Render, components, entityIds, callback)).to.be.true

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
            
            // excludes entity 7 (id=6) since currentMaxEntity is = 5
            const entityIds = [this.entityId6]

            expect(systemId).to.equal(1)
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Init, components, entityIds, callback)).to.be.true
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
            
            // excludes entity 7 (id=6) since currentMaxEntity is = 5
            const entityIds = [this.entityId1, this.entityId3, this.entityId6]

            expect(systemId).to.equal(1)
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Init, components, entityIds, callback)).to.be.true
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
            
            // excludes entity 7 (id=6) since currentMaxEntity is = 5
            const entityIds = [this.entityId1, this.entityId2, this.entityId3, this.entityId4, this.entityId6]

            expect(systemId).to.equal(1)
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Logic, components, entityIds, callback)).to.be.true
        })
    })
})