import { expect } from 'chai';
import   SystemManager, { SystemType } from '../../src/core/System';

describe('SystemManager', function() {
    describe('constructor()', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager();
        });
        
        afterEach(() => {
            delete this.systemManager;
        });
        
        it('is a function', () => {
            expect(SystemManager).to.be.a('function');
        });
        
        it('can be used to instantiate a new World', () => {
            expect(this.systemManager).to.be.an.instanceof(SystemManager);
        });
        
        it('instatiates a systems map with a map for each type of system', () => {
            expect(this.systemManager).to.have.property('systems');
            expect(this.systemManager).property('systems').to.be.an.instanceof(Map);
            expect(this.systemManager).property('systems').property('size').to.equal(4);
        });
        
        it('instantiates systems[SystemType.Init] as an empty array', () => {
            let initSystems = this.systemManager.systems.get(SystemType.Init);
            
            expect(initSystems).to.be.an.instanceof(Map);
            expect(initSystems).property('size').to.equal(0);
        });
        
        it('instantiates systems[SystemType.Logic] as an empty array', () => {
            let initSystems = this.systemManager.systems.get(SystemType.Logic);
            
            expect(initSystems).to.be.an.instanceof(Map);
            expect(initSystems).property('size').to.equal(0);
        });
        
        it('instantiates systems[SystemType.Render] as an empty array', () => {
            let initSystems = this.systemManager.systems.get(SystemType.Render);
            
            expect(initSystems).to.be.an.instanceof(Map);
            expect(initSystems).property('size').to.equal(0);
        });
        
        it('instantiates systems[SystemType.CleanUp] as an empty array', () => {
            let initSystems = this.systemManager.systems.get(SystemType.CleanUp);
            
            expect(initSystems).to.be.an.instanceof(Map);
            expect(initSystems).property('size').to.equal(0);
        });
    });
});