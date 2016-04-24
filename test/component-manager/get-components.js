import { expect }       from 'chai';
import ComponentManager from '../../src/core/component-manager';

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
            
            const key = 'key';
            
            this.componentManager.components.set(key, 10);
            
            components = this.componentManager.getComponents();
            
            expect(components).to.be.an.instanceof(Map);
            expect(components).property('size').to.equal(1);
            expect(components.get(key)).to.equal(10);
            expect(components).to.equal(this.componentManager.components);
        });
    });
});