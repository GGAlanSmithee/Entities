import { expect }      from 'chai';
import sinon           from 'sinon';
import EntityManager, { SelectorType } from '../../../src/core/Entity';

describe('EntityManager', function() {
    describe('onLogic(delta)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.entities = [];
            this.entities.push(1 | 2 | 4);
            this.entities.push(1 | 2 | 4);
            this.entities.push(1 | 4 | 8);
            
            // todo look up mocks / stubs will callback / callthrough
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
            
            this.renderSpy1 = sinon.spy();
            this.entityManager.systemManager.renderSystems.set(3, {
                    callback   : this.renderSpy1,
                    selector   : SelectorType.GetWithout,
                    components : 1 | 2 | 4
                });
            
            this.renderSpy2 = sinon.spy();
            this.entityManager.systemManager.renderSystems.set(4, {
                    callback   : this.renderSpy2,
                    selector   : SelectorType.GetWith,
                    components : 1 | 2 | 4 |8
                });
            
            this.delta = 10;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.onLogic).to.be.a('function');
        });
        
        it('invokes all [logicSystems] with the [entityManager] as context', () => {
            this.entityManager.onLogic(this.delta);
            
            expect(this.logicSpy1.calledOnce).to.be.true;
            expect(this.logicSpy1.calledOn(this.entityManager)).to.be.true;
            expect(this.logicSpy1.calledWith(this.entities, this.delta)).to.be.true;
            
            expect(this.logicSpy2.calledOnce).to.be.true;
            expect(this.logicSpy2.calledOn(this.entityManager)).to.be.true;
            expect(this.logicSpy2.calledWith(this.entities, this.delta)).to.be.true;
            
            expect(this.renderSpy1.calledOnce).to.be.false;
            expect(this.renderSpy2.calledOnce).to.be.false;
        });
        
        it('invokes [entityManager.getEntities()] with the corrent paramters', () => {
            this.entityManager.onLogic(this.delta);
            
            expect(this.entityManager.getEntities.calledTwice).to.be.true;
            
            let logicSystem1 = this.entityManager.systemManager.logicSystems.get(1);
            let logicSystem2 = this.entityManager.systemManager.logicSystems.get(2);
            
            expect(this.entityManager.getEntities.calledWith(logicSystem1.selector, logicSystem1.components)).to.be.true;
            expect(this.entityManager.getEntities.calledWith(logicSystem2.selector, logicSystem2.components)).to.be.true;
        });
    });
});