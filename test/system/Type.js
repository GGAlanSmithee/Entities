import { expect }     from 'chai';
import { SystemType } from '../../src/core/System';

describe('SystemType', () => {
    it('is defined as an object', () => {
        expect(SystemType).to.be.an('object');
    });
    
    it('SystemType.Logic is defined as 0', () => {
        expect(SystemType.Logic).to.equal(0);
    });
    
    it('SystemType.Render is defined as 1', () => {
        expect(SystemType.Render).to.equal(1);
    });
});