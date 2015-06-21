import { expect }                       from 'chai';
import { NoneComponent, ComponentType } from '../../src/core/Component';

describe('Component', () => {
    it('NoneComponent is defined as 0', () => {
        expect(NoneComponent).to.equal(0);
    });
    
    it('ComponentType is defined as an object', () => {
        expect(ComponentType).to.be.an('object');
    });
    
    it('ComponentType.Dynamic is defined as 0', () => {
        expect(ComponentType.Dynamic).to.equal(0);
    });
    
    it('ComponentType.SemiDynamic is defined as 1', () => {
        expect(ComponentType.SemiDynamic).to.equal(1);
    });
    
    it('ComponentType.Static is defined as 2', () => {
        expect(ComponentType.Static).to.equal(2);
    });
});