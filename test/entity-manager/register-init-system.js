import { expect }     from 'chai';
import sinon          from 'sinon';
import EntityManager  from '../../src/core/entity-manager';
import { SystemType } from '../../src/core/system-manager';

describe('EntityManager', function() {
    describe('registerInitSystem(selectorType, components, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.position = 'position';
            this.velocity = 'velocity';
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.registerInitSystem).to.be.a('function');
        });
        
        it('invokes [systemManager.registerSystem] with [type] = SystemType.Init', () => {
            let spy = sinon.spy(this.entityManager.systemManager, 'registerSystem');
            
            let system     = 'init';
            let components = [ this.position, this.velocity ];
            let callback   = (entities, { delta }) => { 
                for (let { entity } of entities) {
                    entity.position = { x : 5, y : 5 };
                    entity.velocity = -2;
                }
            };
            
            this.entityManager.registerInitSystem(system, components, callback);
            
            expect(spy.calledOnce).to.be.true;
            expect(spy.calledWith(system, SystemType.Init, components, callback)).to.be.true;
        });
        
        it('returns the registered systems id', () => {
            let system     = 'init';
            let components = [ this.position, this.velocity ];
            let callback   = (entities, { delta }) => { 
                for (let { entity } of entities) {
                    entity.position = { x : 5, y : 5 };
                    entity.velocity = -2;
                }
            };
            
            let systemId = this.entityManager.registerInitSystem(system, components, callback);
            
            expect(systemId).to.equal(system);
            
            systemId = this.entityManager.registerInitSystem(system, components, callback);
            
            expect(systemId).to.equal(system);
        });
    });
});