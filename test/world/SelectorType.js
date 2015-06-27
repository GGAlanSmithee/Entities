import { expect }        from 'chai';
import { SelectorType } from '../../src/core/World';

describe('SelectorrType', function() {
    it('is an object', () => {
        expect(SelectorType).to.be.an('object');
    });
});