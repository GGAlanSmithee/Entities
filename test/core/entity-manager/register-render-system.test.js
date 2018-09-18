import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'
import { SystemType }    from '../../../src/core/system-manager'

describe('EntityManager', function() {
    describe('registerRenderSystem(components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
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
            
            this.draw = entity => entity
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.registerRenderSystem).to.be.a('function')
        })
        
        test('invokes [systemManager.registerSystem] with [type] = SystemType.Render', () => {
            const spy = sinon.spy(this.entityManager._systemManager, 'registerSystem')

            const name       = 'drawSystem'
            const components = [ this.position, this.velocity, ]
            const callback   = (entities) => { 
                for (let { entity } of entities) {
                    this.draw(entity)
                }
            }

            const entityIds = [ this.entityId, ]

            this.entityManager.registerRenderSystem(name, components, callback)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(SystemType.Render, name, components, entityIds, callback)).to.be.true
        })
    })
})