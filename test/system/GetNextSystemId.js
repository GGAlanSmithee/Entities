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
        
        it('returns [maxRegisteredSystemId]', () => {
            expect(this.systemManager.getNextSystemId()).to.equal(0);
        });
        
        it('sets [maxRegisteredSystemId] to 0 and returns it if [maxRegisteredSystemId] is not a number', () => {
            this.systemManager.maxRegisteredSystemId = null;
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(0);
            
            this.systemManager.maxRegisteredSystemId = undefined;
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(0);
            
            this.systemManager.maxRegisteredSystemId = { };
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(0);
            
            this.systemManager.maxRegisteredSystemId = [];
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(0);
            
            this.systemManager.maxRegisteredSystemId = new Map();
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(0);
            
            this.systemManager.maxRegisteredSystemId = 'not a number';
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(0);
            
            this.systemManager.maxRegisteredSystemId = '65';
            expect(this.systemManager.getNextSystemId()).to.equal(0);
            expect(this.systemManager.maxRegisteredSystemId).to.equal(0);
        });
    });
});