import { expect }       from 'chai';
import ComponentManager from '../../../src/core/component';

describe('ComponentManager', function() {
    describe('constructor()', () => {
        it('is a function', () => {
            expect(ComponentManager).to.be.a('function');
        });
        
        it('can be used to instantiate a [ComponentManager]', () => {
            let componentManager = new ComponentManager();
            
            expect(componentManager).to.be.an.instanceof(ComponentManager);
        });
        
        it('initializes [components] to an empty Map', () => {
            let componentManager = new ComponentManager();
            
            expect(componentManager.components).to.be.an.instanceof(Map);
            expect(componentManager.components).property('size').to.equal(0);
        });
    });
});