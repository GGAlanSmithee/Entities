import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('onRender(opts)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.position     = 1
            this.velocity     = 2
            this.clickable    = 4
            this.spawnable    = 8
            this.interactable = 16
            
            this.entities = []
            this.entities.push({ id: 0, entity: { components: this.position | this.velocity | this.clickable } })
            this.entities.push({ id: 1, entity: { components: this.position | this.velocity | this.clickable } })
            this.entities.push({ id: 2, entity: { components: this.position | this.velocity | this.spawnable } })
            
            this.entityManager.getEntitiesByIds = sinon.stub().returns(this.entities)
            
            this.logicSpy1 = sinon.spy()
            this.entityManager.systemManager.logicSystems.set(1, {
                    callback   : this.logicSpy1,
                    components : this.position | this.velocity | this.clickable
                })
            
            this.logicSpy2 = sinon.spy()
            this.entityManager.systemManager.logicSystems.set(2, {
                    callback   : this.logicSpy2,
                    components : this.position | this.clickable | this.interactable
                })
            
            this.renderSpy1 = sinon.spy()
            this.entityManager.systemManager.renderSystems.set(3, {
                    callback   : this.renderSpy1,
                    components : this.position | this.velocity | this.clickable
                })
            
            this.renderSpy2 = sinon.spy()
            this.entityManager.systemManager.renderSystems.set(4, {
                    callback   : this.renderSpy2,
                    components : this.spawnable
                })
            
            this.opts = {
                delta   : 10,
                value   : 1337,
                context : 'browser'
            }
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.onRender).to.be.a('function')
        })
        
        test('invokes all [renderSystems] with the [entityManager] as context', () => {
            this.entityManager.onRender(this.opts)
            
            expect(this.renderSpy1.calledOnce).to.be.true
            expect(this.renderSpy1.calledOn(this.entityManager)).to.be.true
            expect(this.renderSpy1.calledWith(this.entities, this.opts)).to.be.true
            
            expect(this.renderSpy2.calledOnce).to.be.true
            expect(this.renderSpy2.calledOn(this.entityManager)).to.be.true
            expect(this.renderSpy2.calledWith(this.entities, this.opts)).to.be.true
            
            expect(this.logicSpy1.calledOnce).to.be.false
            expect(this.logicSpy2.calledOnce).to.be.false
        })
        
        test('invokes [entityManager.getEntitiesByIds()] with the correct paramters', () => {
            this.entityManager.onRender(this.opts)
            
            expect(this.entityManager.getEntitiesByIds.calledTwice).to.be.true
            
            let renderSystem1 = this.entityManager.systemManager.renderSystems.get(3)
            let renderSystem2 = this.entityManager.systemManager.renderSystems.get(4)
            
            expect(this.entityManager.getEntitiesByIds.calledWith(renderSystem1.entities)).to.be.true
            expect(this.entityManager.getEntitiesByIds.calledWith(renderSystem2.entities)).to.be.true
        })
    })
})