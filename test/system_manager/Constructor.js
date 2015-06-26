import { expect }      from 'chai';
import   SystemManager from '../../src/core/SystemManager';

describe('SystemManager', function() {
    describe('constructor()', () => {
        it('is a function', () => {
            expect(SystemManager).to.be.a('function');
        });
    });
});