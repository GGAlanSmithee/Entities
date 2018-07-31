import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'
import { SystemType }    from '../../../src/core/system-manager'

describe('EntityManager', function() {
    describe('registerLogicSystem(components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.position = 'position'
            
            this.velocity = 'velocity'

            this.entityId = 0
            this.entity = {
                components: [ this.position, this.velocity, ],
                [this.position]: { x: 0, y: 0, },
                [this.velocity]: 2,
            }

            this.entityManager.entities[this.entityId] = this.entity
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.registerLogicSystem).to.be.a('function')
        })
        
        test('invokes [systemManager.registerSystem] with [type] = SystemType.Logic', () => {
            let spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            let components = [ this.position, this.velocity, ]
            let callback   = (entities, { delta }) => { 
                for (let { entity } of entities) {
                    entity.position += entity.velocity * delta
                }
            }
            
            const entityIds = [ this.entityId, ]

            this.entityManager.registerLogicSystem(components, callback)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Logic, components, entityIds, callback)).to.be.true
        })
        
        test('returns the registered systems id', () => {
            let components = [ this.position, this.velocity, ]
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
    })
})