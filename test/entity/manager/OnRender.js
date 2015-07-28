import { expect }      from 'chai';
import sinon           from 'sinon';
import EntityManager, { SelectorType } from '../../../src/core/Entity';

describe('EntityManager', function() {
    describe('onRender(delta)', () => {
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
                    components : 8
                });
            
            this.delta = 10;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.onRender).to.be.a('function');
        });
        
        it('invokes all [renderSystems] with the [entityManager] as context', () => {
            this.entityManager.onRender(this.delta);
            
            expect(this.renderSpy1.calledOnce).to.be.true;
            expect(this.renderSpy1.calledOn(this.entityManager)).to.be.true;
            expect(this.renderSpy1.calledWith(this.entities, this.delta)).to.be.true;
            
            expect(this.renderSpy2.calledOnce).to.be.true;
            expect(this.renderSpy2.calledOn(this.entityManager)).to.be.true;
            expect(this.renderSpy2.calledWith(this.entities, this.delta)).to.be.true;
            
            expect(this.logicSpy1.calledOnce).to.be.false;
            expect(this.logicSpy2.calledOnce).to.be.false;
        });
        
        it('invokes [entityManager.getEntities()] with the corrent paramters', () => {
            this.entityManager.onRender(this.delta);
            
            expect(this.entityManager.getEntities.calledTwice).to.be.true;
            
            let renderSystem1 = this.entityManager.systemManager.renderSystems.get(3);
            let renderSystem2 = this.entityManager.systemManager.renderSystems.get(4);
            
            expect(this.entityManager.getEntities.calledWith(renderSystem1.selector, renderSystem1.components)).to.be.true;
            expect(this.entityManager.getEntities.calledWith(renderSystem2.selector, renderSystem2.components)).to.be.true;
        });
    });
});