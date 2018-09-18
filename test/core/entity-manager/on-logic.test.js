import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('onLogic(opts)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.position     = 'pos'
            this.velocity     = 'vel'
            this.clickable    = 'click'
            this.spawnable    = 'spawn'
            this.interactable = 'int'
            
            this.entities = []
            this.entities.push({ id: 0, entity: { components: [ this.position, this.velocity, this.clickable, ] } })
            this.entities.push({ id: 1, entity: { components: [ this.position, this.velocity, this.clickable, ] } })
            this.entities.push({ id: 2, entity: { components: [ this.position, this.velocity, this.spawnable, ] } })
            
            this.entityManager.getEntitiesByIds = sinon.stub().returns(this.entities)
            
            this.logicSpy1 = sinon.spy()
            this.entityManager._systemManager.logicSystems.set(1, {
                    callback   : this.logicSpy1,
                    components : [ this.position, this.velocity, this.clickable, ]
                })
            
            this.logicSpy2 = sinon.spy()
            this.entityManager._systemManager.logicSystems.set(2, {
                    callback   : this.logicSpy2,
                    components : [ this.position, this.clickable, this.interactable, ]
                })
            
            this.renderSpy1 = sinon.spy()
            this.entityManager._systemManager.renderSystems.set(3, {
                    callback   : this.renderSpy1,
                    components : [ this.position, this.velocity, this.clickable, ]
                })
            
            this.renderSpy2 = sinon.spy()
            this.entityManager._systemManager.renderSystems.set(4, {
                    callback   : this.renderSpy2,
                    components : [ this.position, this.velocity, this.clickable, this.spawnable, ]
                })
            
            this.opts = {
                delta    : 10,
                question : 'How many roads must a man walk down?',
                answer   : 42
            }
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.onLogic).to.be.a('function')
        })
        
        test('invokes all [logicSystems] with the [entityManager] as context', () => {
            this.entityManager.onLogic(this.opts)

            expect(this.logicSpy1.calledOn(this.entityManager)).to.be.true
            expect(this.logicSpy2.calledOn(this.entityManager)).to.be.true
        })

        test('defaults [opts] to an empty object', () => {
            this.entityManager.onLogic()
            
            expect(this.logicSpy1.calledWith(this.entities, {})).to.be.true
            expect(this.logicSpy2.calledWith(this.entities, {})).to.be.true
        })

        test('does not invoke systems of another type', () => {
            this.entityManager.onLogic(this.opts)
            
            expect(this.logicSpy1.calledOnce).to.be.true
            expect(this.logicSpy2.calledOnce).to.be.true

            expect(this.renderSpy1.calledOnce).to.be.false
            expect(this.renderSpy2.calledOnce).to.be.false
        })
        
        test('invokes [entityManager.getEntitiesByIds()] with the correct parameters', () => {
            this.entityManager.onLogic(this.opts)
            
            expect(this.entityManager.getEntitiesByIds.calledTwice).to.be.true
            
            let logicSystem1 = this.entityManager._systemManager.logicSystems.get(1)
            let logicSystem2 = this.entityManager._systemManager.logicSystems.get(2)
            
            expect(this.entityManager.getEntitiesByIds.calledWith(logicSystem1.entities)).to.be.true
            expect(this.entityManager.getEntitiesByIds.calledWith(logicSystem2.entities)).to.be.true
        })
    })
})