import { expect }                      from 'chai';
import sinon                           from 'sinon';
import EntityManager, { SelectorType } from '../../../src/core/entity-manager';

describe('EntityManager', function() {
    describe('onInit(opts)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.entities = [];
            this.entities.push(1 | 2 | 4);
            this.entities.push(1 | 2 | 4);
            this.entities.push(1 | 4 | 8);
            
            this.entityManager.getEntities = sinon.stub().returns(this.entities);
            
            this.logicSpy1 = sinon.spy();
            this.entityManager.systemManager.logicSystems.set(1, {
                    callback   : this.logicSpy1,
                    selector   : SelectorType.GetWith,
                    components : 1 | 2 | 4
                });
            
            this.logicSpy2 = sinon.spy();
            this.entityManager.systemManager.logicSystems.set(2, {
                    callback   : this.logicSpy2,
                    selector   : SelectorType.GetWithOnly,
                    components : 1 | 4 | 16
                });
            
            this.initSpy1 = sinon.spy();
            this.entityManager.systemManager.initSystems.set(3, {
                    callback   : this.initSpy1,
                    selector   : SelectorType.GetWithout,
                    components : 1 | 2 | 4
                });
            
            this.initSpy2 = sinon.spy();
            this.entityManager.systemManager.initSystems.set(4, {
                    callback   : this.initSpy2,
                    selector   : SelectorType.GetWith,
                    components : 8
                });
            
            this.opts = {
                delta : 10,
                test: false,
                controller: 'game'
            };
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.onInit).to.be.a('function');
        });
        
        it('invokes all [initSystems] with the [entityManager] as context', () => {
            this.entityManager.onInit(this.opts);
            
            expect(this.initSpy1.calledOnce).to.be.true;
            expect(this.initSpy1.calledOn(this.entityManager)).to.be.true;
            expect(this.initSpy1.calledWith(this.entities, this.opts)).to.be.true;
            
            expect(this.initSpy2.calledOnce).to.be.true;
            expect(this.initSpy2.calledOn(this.entityManager)).to.be.true;
            expect(this.initSpy2.calledWith(this.entities, this.opts)).to.be.true;
            
            expect(this.logicSpy1.calledOnce).to.be.false;
            expect(this.logicSpy2.calledOnce).to.be.false;
        });
        
        it('invokes [entityManager.getEntities()] with the correct paramters', () => {
            this.entityManager.onInit(this.opts);
            
            expect(this.entityManager.getEntities.calledTwice).to.be.true;
            
            let initSystem1 = this.entityManager.systemManager.initSystems.get(3);
            let initSystem2 = this.entityManager.systemManager.initSystems.get(4);
            
            expect(this.entityManager.getEntities.calledWith(initSystem1.components, initSystem1.selector)).to.be.true;
            expect(this.entityManager.getEntities.calledWith(initSystem2.components, initSystem2.selector)).to.be.true;
        });
    });
});