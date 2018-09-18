import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'
import { SystemType }    from '../../../src/core/system-manager'

describe('EntityManager', function() {
    describe('registerSystem(type, components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.position = 'position'
            
            this.velocity = 'velocity'
            
            this.appearance = 'appearance'

            this.stats = 'stats'

            this.entityId1 = 0
            this.entity1 = {
                id: this.entityId1,
                components: [ this.position, this.velocity, this.stats, ],
            }

            this.entityId2 = 1
            this.entity2 = {
                id: this.entityId2,
                components: [ this.position, this.stats, ],
            }

            this.entityId3 = 2
            this.entity3 = {
                id: this.entityId3,
                components: [ this.position, this.velocity, this.stats, ],
            }

            this.entityId4 = 3
            this.entity4 = {
                id: this.entityId4,
                components: [ this.position, ],
            }

            this.entityId5 = 4
            this.entity5 = {
                id: this.entityId5,
                components: [],
            }

            this.entityId6 = 5
            this.entity6 = {
                id: this.entityId6,
                components: [ this.position, this.velocity, this.appearance, ],
            }

            this.entityId7 = 6
            this.entity7 = {
                id: this.entityId7,
                components: [ this.position, this.velocity, this.appearance, ],
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
            const name       = 'render'
            const components = [ this.position, this.velocity, this.stats ]
            
            const callback = function(entities, { delta }) { 
                for (const { entity } of entities) {
                    entity.position += entity.velocity * delta
                }
            }
            
            const spy = sinon.spy(this.entityManager._systemManager, 'registerSystem')
            
            this.entityManager.registerSystem(type, name, components, callback)
            
            const entityIds = [this.entityId1, this.entityId3]
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(type, name, components, entityIds, callback)).to.be.true
        })
        
        test('registers a system with the correct components', () => {
            const name       = 'init'
            const components =  [ this.position, this.velocity ]
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            this.entityManager.registerSystem(SystemType.Init, name, components, callback)
            
            const { initSystems, } = this.entityManager._systemManager

            expect(initSystems.size).to.equal(1)
            
            const initSystem = initSystems.get(name)

            expect(initSystem.components).to.deep.equal(components)
        })

        test('registers a system with the correct entities', () => {
            const spy = sinon.spy(this.entityManager._systemManager, 'registerSystem')
            
            const name       = 'render'
            const components = [ this.appearance ]
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.appearance = 'test.jpg' // makes no sense
                }
            }
            
            this.entityManager.registerSystem(SystemType.Render, name, components, callback)
            
            const entityIds = [this.entityId6, this.entityId7]

            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Render, name, components, entityIds, callback)).to.be.true

            const { renderSystems, } = this.entityManager._systemManager

            expect(renderSystems.size).to.equal(1)
            
            const renderSystem = renderSystems.get(name)

            expect(renderSystem.entities).to.deep.equal(entityIds)
        })
        
        test('registers a system given an array of components', () => {
            const spy = sinon.spy(this.entityManager._systemManager, 'registerSystem')
            
            const name       = 'initialize'
            const components = [ this.position, this.velocity, this.appearance]
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            this.entityManager.registerSystem(SystemType.Init, name, components, callback)
            
            const entityIds = [this.entityId6, this.entityId7]

            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Init, name, components, entityIds, callback)).to.be.true
        })

        test('registers a render system given an array of components, not using all registered components 1', () => {
            const spy = sinon.spy(this.entityManager._systemManager, 'registerSystem')
            
            const name       = 'initInit'
            const components = [ this.position, this.velocity ]
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            this.entityManager.registerSystem(SystemType.Init, name, components, callback)

            const entityIds = [this.entityId1, this.entityId3, this.entityId6, this.entityId7]

            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Init, name, components, entityIds, callback)).to.be.true
        })

        test('registers a logic system given an array of components, not using all registered components 2', () => {
            const spy = sinon.spy(this.entityManager._systemManager, 'registerSystem')
            
            const name       = 'movement'
            const components = [ this.position ]
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }
            
            this.entityManager.registerSystem(SystemType.Logic, name, components, callback)
            
            const entityIds = [this.entityId1, this.entityId2, this.entityId3, this.entityId4, this.entityId6, this.entityId7]

            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Logic, name, components, entityIds, callback)).to.be.true
        })
    })
})