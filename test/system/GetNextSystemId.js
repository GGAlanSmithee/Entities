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
    });
});