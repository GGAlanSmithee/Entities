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
        
        it('returns [maxRegisteredSystemId] as 0 when there is no system registered', () => {
            expect(this.systemManager.getNextSystemId()).to.equal(0);
        });
        
        it('sets [maxRegisteredSystemId] to 0 and returns it if [maxRegisteredSystemId] is not a number', () => {
            this.systemManager.maxRegisteredSystemId = null;
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(-1);
            
            this.systemManager.maxRegisteredSystemId = undefined;
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(-1);
            
            this.systemManager.maxRegisteredSystemId = { };
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(-1);
            
            this.systemManager.maxRegisteredSystemId = [];
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(-1);
            
            this.systemManager.maxRegisteredSystemId = new Map();
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(-1);
            
            this.systemManager.maxRegisteredSystemId = 'not a number';
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(-1);
            
            this.systemManager.maxRegisteredSystemId = '65';
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(-1);
        });
        
        it('sets [maxRegisteredSystemId] to the correct number when it is lower than the max actually registered id', () => {
            this.systemManager.maxRegisteredSystemId = 5;
            
            this.systemManager.systems.get(SystemType.Init).set(1, () => { });
            this.systemManager.systems.get(SystemType.Logic).set(2, () => { });
            this.systemManager.systems.get(SystemType.Init).set(3, () => { });
            this.systemManager.systems.get(SystemType.Render).set(4, () => { });
            this.systemManager.systems.get(SystemType.Render).set(5, () => { });
            this.systemManager.systems.get(SystemType.Init).set(6, () => { });
            
            expect(this.systemManager.getNextSystemId()).to.equal(7);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(6);
            
            this.systemManager.systems.delete(SystemType.Init);
            this.systemManager.systems.delete(SystemType.Render);
            this.systemManager.systems.get(SystemType.Logic).set(10, () => { });
            
            expect(this.systemManager.getNextSystemId()).to.equal(11);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(10);
            
            expect(this.systemManager.getNextSystemId()).to.equal(11);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(10);
        });
    });
});