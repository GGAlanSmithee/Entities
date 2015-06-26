import { expect }     from 'chai';
import { SystemType } from '../../src/core/System';

describe('SystemType', () => {
    it('is defined as an object', () => {
        expect(SystemType).to.be.an('object');
    });
    
    it('SystemType.Init is defined as 0', () => {
        expect(SystemType.Init).to.equal(0);
    });
    
    it('SystemType.Logic is defined as 1', () => {
        expect(SystemType.Logic).to.equal(1);
    });
    
    it('SystemType.Render is defined as 2', () => {
        expect(SystemType.Render).to.equal(2);
    });
    
    it('SystemType.CleanUp is defined as 3', () => {
        expect(SystemType.CleanUp).to.equal(3);
    });
});