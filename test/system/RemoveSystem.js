import { expect } from 'chai';
import   SystemManager from '../../src/core/System';

describe('SystemManager', function() {
    describe('removeSystem(system, type)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager();
        });
        
        afterEach(() => {
            delete this.systemManager;
        });

        it('is a function', () => {
            expect(this.systemManager.removeSystem).to.be.a('function');
        });
    });
});