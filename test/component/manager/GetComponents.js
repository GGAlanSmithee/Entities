import { expect }                          from 'chai';
import ComponentManager, { NoneComponent } from '../../../src/core/Component';

describe('ComponentManager', function() {
    describe('getComponents()', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager();
        })
        
        afterEach(() => {
            delete this.componentManager;
        })
        
        it('is a function', () => {
            expect(this.componentManager.getComponents).to.be.a('function');
        });
        
        it('returns [components]', () => {
            let components = this.componentManager.getComponents();
            
            expect(components).to.be.an.instanceof(Map);
            expect(components).property('size').to.equal(0);
            expect(components).to.equal(this.componentManager.components);
            
            this.componentManager.components.set(0, 10);
            
            components = this.componentManager.getComponents();
            
            expect(components).to.be.an.instanceof(Map);
            expect(components).property('size').to.equal(1);
            expect(components.get(0)).to.equal(10);
            expect(components).to.equal(this.componentManager.components);
        });
    });
});