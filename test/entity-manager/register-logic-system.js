import { expect }     from 'chai';
import sinon          from 'sinon';
import EntityManager  from '../../src/core/entity-manager';
import { SystemType } from '../../src/core/system-manager';

describe('EntityManager', function() {
    describe('registerLogicSystem(selectorType, components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.position = 'position';
            this.velocity = 'velocity';
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.registerLogicSystem).to.be.a('function');
        });
        
        it('invokes [systemManager.registerSystem] with [type] = SystemType.Logic', () => {
            let spy = sinon.spy(this.entityManager.systemManager, 'registerSystem');
            
            let system     = 'move';
            let components = [ this.position, this.velocity ];
            let callback   = (entities, { delta }) => { 
                for (let { entity } of entities) {
                    entity.position += entity.velocity * delta;
                }
            };
            
            this.entityManager.registerLogicSystem(system, components, callback);
            
            expect(spy.calledOnce).to.be.true;
            expect(spy.calledWith(system, SystemType.Logic, components, callback)).to.be.true;
        });
        
        it('returns the registered systems id', () => {
            let system     = 'move';
            let components = [ this.position, this.velocity ];
            let callback   = (entities, { delta }) => { 
                for (let { entity } of entities) {
                    entity.position += entity.velocity * delta;
                }
            };
            
            let systemId = this.entityManager.registerLogicSystem(system, components, callback);
            
            expect(systemId).to.equal(system);
            
            systemId = this.entityManager.registerLogicSystem(system, components, callback);
            
            expect(systemId).to.equal(system);
        });
    });
});