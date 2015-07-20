import { expect }                          from 'chai';
import ComponentManager, { NoneComponent } from '../../../src/core/Component';

describe('ComponentManager', function() {
    describe('constructor()', () => {
        it('is a function', () => {
            expect(ComponentManager).to.be.a('function');
        });
        
        it('can be used to instantiate an [EntityManager]', () => {
            let componentManager = new ComponentManager();
            
            expect(componentManager).to.be.an.instanceof(ComponentManager);
        });
        
        it('initializes [components] to a Map containing only the [NoneComponent]', () => {
            let componentManager = new ComponentManager();
            
            expect(componentManager.components).to.be.an.instanceof(Map);
            expect(componentManager.components).property('size').to.equal(1);
            expect(componentManager.components.has(NoneComponent)).to.be.true;
            
            let noneComponent = componentManager.components.get(NoneComponent)
            
            expect(noneComponent).to.be.an.instanceof(Object);
            expect(noneComponent).property('type').to.be.null;
            expect(noneComponent).property('object').to.be.null;
        });
    });
});