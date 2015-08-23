import { expect }                      from 'chai';
import sinon                           from 'sinon';
import EntityManager, { SelectorType } from '../../../src/core/entity';
import { SystemType }                  from '../../../src/core/system';

describe('EntityManager', function() {
    describe('registerRenderSystem(selectorType, components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.registerRenderSystem).to.be.a('function');
        });
        
        it('invokes [systemManager.registerSystem] with [type] = SystemType.Render', () => {
            let spy = sinon.spy(this.entityManager.systemManager, 'registerSystem');
            
            let selectorType = SelectorType.GetWith;
            let components   = 1 | 2;
            let callback     = () => { this.x = 20.0; };
            
            this.entityManager.registerRenderSystem(selectorType, components, callback);
            
            expect(spy.calledOnce).to.be.true;
            expect(spy.calledWith(SystemType.Render, selectorType, components, callback)).to.be.true;
        });
        
        it('returns the registered systems id', () => {
            let selectorType = SelectorType.GetWith;
            let components   = 1 | 2;
            let callback     = () => { this.x = 20.0; };
            
            let id = this.entityManager.registerRenderSystem(selectorType, components, callback);
            
            expect(id).to.equal(1);
            
            id = this.entityManager.registerRenderSystem(selectorType, components, callback);
            
            expect(id).to.equal(2);
        });
    });
});