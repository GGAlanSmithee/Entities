import { expect }                      from 'chai';
import sinon                           from 'sinon';
import EntityManager, { SelectorType } from '../../../src/core/entity';

describe('EntityManager', function() {
    describe('onRender(opts)', () => {
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
            
            this.opts = {
                delta   : 10,
                value   : 1337,
                context : 'browser'
            };
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.onRender).to.be.a('function');
        });
        
        it('invokes all [renderSystems] with the [entityManager] as context', () => {
            this.entityManager.onRender(this.opts);
            
            expect(this.renderSpy1.calledOnce).to.be.true;
            expect(this.renderSpy1.calledOn(this.entityManager)).to.be.true;
            expect(this.renderSpy1.calledWith(this.entities, this.opts)).to.be.true;
            
            expect(this.renderSpy2.calledOnce).to.be.true;
            expect(this.renderSpy2.calledOn(this.entityManager)).to.be.true;
            expect(this.renderSpy2.calledWith(this.entities, this.opts)).to.be.true;
            
            expect(this.logicSpy1.calledOnce).to.be.false;
            expect(this.logicSpy2.calledOnce).to.be.false;
        });
        
        it('invokes [entityManager.getEntities()] with the correct paramters', () => {
            this.entityManager.onRender(this.opts);
            
            expect(this.entityManager.getEntities.calledTwice).to.be.true;
            
            let renderSystem1 = this.entityManager.systemManager.renderSystems.get(3);
            let renderSystem2 = this.entityManager.systemManager.renderSystems.get(4);
            
            expect(this.entityManager.getEntities.calledWith(renderSystem1.components, renderSystem1.selector)).to.be.true;
            expect(this.entityManager.getEntities.calledWith(renderSystem2.components, renderSystem2.selector)).to.be.true;
        });
    });
});