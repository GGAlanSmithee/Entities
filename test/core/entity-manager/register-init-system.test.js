import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'
import { SystemType }    from '../../../src/core/system-manager'

describe('EntityManager', function() {
    describe('registerInitSystem(name, components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(50)
            
            this.position = 'position'
            
            this.velocity = 'velocity'

            this.entityId = 0
            this.entity = {
                id: this.entityId,
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
            expect(this.entityManager.registerInitSystem).to.be.a('function')
        })
        
        test('invokes [systemManager.registerSystem] with [type] = SystemType.Init', () => {
            const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
            
            const name       = 'initTestSystem'
            const components = [ this.position, this.velocity ]
            const callback   = (entities) => { 
                for (const { entity } of entities) {
                    entity.position = { x : 5, y : 5 }
                    entity.velocity = -2
                }
            }

            const entityIds = [ this.entityId, ]

            this.entityManager.registerInitSystem(name, components, callback)
            
            expect(spy.calledOnce).to.be.true

            expect(spy.calledWith(SystemType.Init, name, components, entityIds, callback)).to.be.true
        })
    })
})