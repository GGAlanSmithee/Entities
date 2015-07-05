import { expect } from 'chai';
import   SystemManager, { SystemType } from '../../src/core/System';

describe('SystemManager', function() {
    describe('getNextSystemId()', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager();
        });
        
        afterEach(() => {
            delete this.systemManager;
        });

        it('is a function', () => {
            expect(this.systemManager.getNextSystemId).to.be.a('function');
        });
        
        it('returns 0 when there is no system registered', () => {
            expect(this.systemManager.getNextSystemId()).to.equal(0);
        });
        
        it('returns the next available system id', () => {
            this.systemManager.systems.get(SystemType.Init).set(1, () => { });
            this.systemManager.systems.get(SystemType.Logic).set(2, () => { });
            this.systemManager.systems.get(SystemType.Init).set(3, () => { });
            this.systemManager.systems.get(SystemType.Render).set(4, () => { });
            this.systemManager.systems.get(SystemType.Render).set(5, () => { });
            this.systemManager.systems.get(SystemType.Init).set(6, () => { });
            
            expect(this.systemManager.getNextSystemId()).to.equal(7);
            
            this.systemManager.systems.delete(SystemType.Init);
            this.systemManager.systems.delete(SystemType.Render);
            this.systemManager.systems.get(SystemType.Logic).set(10, () => { });
            
            expect(this.systemManager.getNextSystemId()).to.equal(11);
            
            expect(this.systemManager.getNextSystemId()).to.equal(11);
        });
    });
});