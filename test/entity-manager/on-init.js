import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('onInit(opts)', () => {
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
            
            this.entityManager.getEntities = sinon.stub().returns(this.entities)
            
            this.logicSpy1 = sinon.spy()
            this.entityManager.systemManager.logicSystems.set(1, {
                    callback   : this.logicSpy1,
                    components : [ this.position, this.velocity, this.clickable ]
                })
            
            this.logicSpy2 = sinon.spy()
            this.entityManager.systemManager.logicSystems.set(2, {
                    callback   : this.logicSpy2,
                    components : [ this.position, this.velocity, this.interactable ]
                })
            
            this.initSpy1 = sinon.spy()
            this.entityManager.systemManager.initSystems.set(3, {
                    callback   : this.initSpy1,
                    components : [ this.position, this.velocity, this.clickable ]
                })
            
            this.initSpy2 = sinon.spy()
            this.entityManager.systemManager.initSystems.set(4, {
                    callback   : this.initSpy2,
                    components : [ this.spawnable ]
                })
            
            this.opts = {
                delta : 10,
                test: false,
                controller: 'game'
            }
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('is a function', () => {
            expect(this.entityManager.onInit).to.be.a('function')
        })
        
        it('invokes all [initSystems] with the [entityManager] as context', () => {
            this.entityManager.onInit(this.opts)
            
            expect(this.initSpy1.calledOnce).to.be.true
            expect(this.initSpy1.calledOn(this.entityManager)).to.be.true
            expect(this.initSpy1.calledWith(this.entities, this.opts)).to.be.true
            
            expect(this.initSpy2.calledOnce).to.be.true
            expect(this.initSpy2.calledOn(this.entityManager)).to.be.true
            expect(this.initSpy2.calledWith(this.entities, this.opts)).to.be.true
            
            expect(this.logicSpy1.calledOnce).to.be.false
            expect(this.logicSpy2.calledOnce).to.be.false
        })
        
        it('invokes [entityManager.getEntities()] with the correct paramters', () => {
            this.entityManager.onInit(this.opts)
            
            expect(this.entityManager.getEntities.calledTwice).to.be.true
            
            let initSystem1 = this.entityManager.systemManager.initSystems.get(3)
            let initSystem2 = this.entityManager.systemManager.initSystems.get(4)
            
            expect(this.entityManager.getEntities.calledWith(initSystem1.components)).to.be.true
            expect(this.entityManager.getEntities.calledWith(initSystem2.components)).to.be.true
        })
    })
})