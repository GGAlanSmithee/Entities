import { expect }    from 'chai'
import sinon         from 'sinon'
import EntityManager from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('onLogic(opts)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.position     = 'position'
            this.velocity     = 'velocity'
            this.clickable    = 'clickable'
            this.spawnable    = 'spawnable'
            this.interactable = 'interactable'
            
            this.entities = []
            this.entities.push([ this.position, this.velocity, this.clickable ])
            this.entities.push([ this.position, this.velocity, this.clickable ])
            this.entities.push([ this.position, this.velocity, this.spawnable ])
            
            // todo look up mocks / stubs will callback / callthrough
            this.entityManager.getEntities = sinon.stub().returns(this.entities)
            
            this.logicSpy1 = sinon.spy()
            this.entityManager.systemManager.logicSystems.set(1, {
                    callback   : this.logicSpy1,
                    components : [ this.position, this.velocity, this.clickable ]
                })
            
            this.logicSpy2 = sinon.spy()
            this.entityManager.systemManager.logicSystems.set(2, {
                    callback   : this.logicSpy2,
                    components : [ this.position, this.clickable, this.interactable ]
                })
            
            this.renderSpy1 = sinon.spy()
            this.entityManager.systemManager.renderSystems.set(3, {
                    callback   : this.renderSpy1,
                    components : [ this.position, this.velocity, this.clickable ]
                })
            
            this.renderSpy2 = sinon.spy()
            this.entityManager.systemManager.renderSystems.set(4, {
                    callback   : this.renderSpy2,
                    components : [ this.position, this.velocity, this.clickable, this.spawnable ]
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
        
        it('is a function', () => {
            expect(this.entityManager.onLogic).to.be.a('function')
        })
        
        it('invokes all [logicSystems] with the [entityManager] as context', () => {
            this.entityManager.onLogic(this.opts)
            
            expect(this.logicSpy1.calledOnce).to.be.true
            expect(this.logicSpy1.calledOn(this.entityManager)).to.be.true
            expect(this.logicSpy1.calledWith(this.entities, this.opts)).to.be.true
            
            expect(this.logicSpy2.calledOnce).to.be.true
            expect(this.logicSpy2.calledOn(this.entityManager)).to.be.true
            expect(this.logicSpy2.calledWith(this.entities, this.opts)).to.be.true
            
            expect(this.renderSpy1.calledOnce).to.be.false
            expect(this.renderSpy2.calledOnce).to.be.false
        })
        
        it('invokes [entityManager.getEntities()] with the correct paramters', () => {
            this.entityManager.onLogic(this.opts)
            
            expect(this.entityManager.getEntities.calledTwice).to.be.true
            
            let logicSystem1 = this.entityManager.systemManager.logicSystems.get(1)
            let logicSystem2 = this.entityManager.systemManager.logicSystems.get(2)
            
            expect(this.entityManager.getEntities.calledWith(logicSystem1.components)).to.be.true
            expect(this.entityManager.getEntities.calledWith(logicSystem2.components)).to.be.true
        })
    })
})