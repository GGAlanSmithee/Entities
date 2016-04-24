import { expect }     from 'chai';
import sinon          from 'sinon';
import EntityManager  from '../../src/core/entity-manager';
import { SystemType } from '../../src/core/system-manager';

describe('EntityManager', function() {
    describe('registerRenderSystem(selectorType, components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.position = 'position';
            this.velocity = 'velocity';
            
            this.draw = entity => entity;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.registerRenderSystem).to.be.a('function');
        });
        
        it('invokes [systemManager.registerSystem] with [type] = SystemType.Render', () => {
            let spy = sinon.spy(this.entityManager.systemManager, 'registerSystem');
            
            let system     = 'move';
            let components = [ this.position, this.velocity ];
            let callback   = (entities, { delta }) => { 
                for (let { entity } of entities) {
                    this.draw(entity);
                }
            };
            
            this.entityManager.registerRenderSystem(system, components, callback);
            
            expect(spy.calledOnce).to.be.true;
            expect(spy.calledWith(system, SystemType.Render, components, callback)).to.be.true;
        });
        
        it('returns the registered systems id', () => {
            let system     = 'move';
            let components = [ this.position, this.velocity ];
            let callback   = (entities, { delta }) => { 
                for (let { entity } of entities) {
                    this.draw(entity);
                }
            };
            
            let systemId = this.entityManager.registerRenderSystem(system, components, callback);
            
            expect(systemId).to.equal(system);
            
            systemId = this.entityManager.registerRenderSystem(system, components, callback);
            
            expect(systemId).to.equal(system);
        });
    });
});