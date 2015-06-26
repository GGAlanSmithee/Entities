import { expect } from 'chai';
import   SystemManager, { SystemType } from '../../src/core/System';

describe('SystemManager', function() {
    describe('getNextSystemId(type)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager();
        });
        
        afterEach(() => {
            delete this.systemManager;
        });
        
        it('is a function', () => {
            expect(this.systemManager.getNextSystemId).to.be.a('function');
        });
        
        it('returns the correct component id under normal circumstances', () => {
            this.systemManager.systems.get(SystemType.Init).set(1, () => { });
            this.systemManager.systems.get(SystemType.Logic).set(2, () => { });
            this.systemManager.systems.get(SystemType.Init).set(3, () => { });
            this.systemManager.systems.get(SystemType.Render).set(4, () => { });
            this.systemManager.systems.get(SystemType.Render).set(5, () => { });
            this.systemManager.systems.get(SystemType.Init).set(6, () => { });
            
            let nextSystem = this.systemManager.getNextSystemId();
            
            expect(nextSystem).to.equal(7);
            
            this.systemManager.systems.get(SystemType.Logic).set(6, () => { });
            this.systemManager.systems.get(SystemType.CleanUp).set(9, () => { });
            this.systemManager.systems.get(SystemType.Logic).set(11, () => { });
            
            nextSystem = this.systemManager.getNextSystemId();
            
            expect(nextSystem).to.equal(12);
        });
        /*
        it('returns the correct component id when there is a gap in the existing ids', () =>{
            this.world.components.set(1, { });
            this.world.components.set(4, { });
            
            let nextComponent = this.world.getNextComponentId();
            
            expect(nextComponent).to.equal(8);
        });
        
        it('returns the correct component id when only the "None" component exists', () => {
            expect(this.world.getNextComponentId()).to.equal(1);
        });
        
        it('returns the correct component id when there is no prior components', () => {
            this.world.components = new Map();
            expect(this.world.getNextComponentId()).to.equal(0);
        });
        
        it('returns the correct component id when components are null or undefined', () => {
            this.world.components = null;
            expect(this.world.getNextComponentId()).to.equal(0);
            expect(this.world.components).to.be.an.instanceof(Map);
            
            this.world.components = undefined;
            expect(this.world.getNextComponentId()).to.equal(0);
            expect(this.world.components).to.be.an.instanceof(Map);
        });*/
    });
});