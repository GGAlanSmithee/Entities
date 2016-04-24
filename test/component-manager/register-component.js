import { expect }       from 'chai';
import ComponentManager from '../../src/core/component-manager';

describe('ComponentManager', function() {
    describe('registerComponent(component)', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager();
        });
        
        afterEach(() => {
            delete this.componentManager;
        });
        
        it('is a function', () => {
            expect(this.componentManager.registerComponent).to.be.a('function');
        });
        
        it('returns the components key', () => {
            const key       = 'position';
            const component = { x : 20, y : 10 };
            
            const key2       = 'stats';
            const component2 = function() {
                this.strength  = 100;
                this.hitpoints = 1000;
            };
            
            const registeredComponent = this.componentManager.registerComponent(key, component);
            
            expect(registeredComponent).to.be.a('string');
            expect(registeredComponent).to.equal(key);
            
            const registeredComponent2 = this.componentManager.registerComponent(key2, component2);
            
            expect(registeredComponent2).to.be.a('string');
            expect(registeredComponent2).to.equal(key2);
        });
        
        it('overwrites existing component if component with [key] already exists', () => {
            const key       = 'value';
            const component = 'human';
            
            const key2       = 'valye';
            const component2 = { };
            
            this.componentManager.registerComponent(key, component);
            expect(this.componentManager.components).property('size').to.equal(1);
            
            this.componentManager.registerComponent(key, component2);
            expect(this.componentManager.components).property('size').to.equal(1);
            
            this.componentManager.registerComponent(key2, component);
            expect(this.componentManager.components).property('size').to.equal(2);
            
            this.componentManager.registerComponent(key2, component2);
            expect(this.componentManager.components).property('size').to.equal(2);
        });
        
        it('gives an error (exception) when [key] is not a non-empty string', () => {
            expect(() => this.componentManager.registerComponent()).to.throw(TypeError, 'key must be a non-empty string.');
            expect(() => this.componentManager.registerComponent(null)).to.throw(TypeError, 'key must be a non-empty string.');
            expect(() => this.componentManager.registerComponent(1)).to.throw(TypeError, 'key must be a non-empty string.');
            expect(() => this.componentManager.registerComponent(1.2)).to.throw(TypeError, 'key must be a non-empty string.');
            expect(() => this.componentManager.registerComponent('')).to.throw(TypeError, 'key must be a non-empty string.');
            expect(() => this.componentManager.registerComponent([ '1', '2', '3' ])).to.throw(TypeError, 'key must be a non-empty string.');
            expect(() => this.componentManager.registerComponent({ key: 'value' })).to.throw(TypeError, 'key must be a non-empty string.');
        });
        
        it('gives an error (exception) when [component] is null or omitted', () => {
            expect(() => this.componentManager.registerComponent('key')).to.throw(TypeError, 'component cannot be null or undefined.');
            expect(() => this.componentManager.registerComponent('key', null)).to.throw(TypeError, 'component cannot be null or undefined.');
        });
    });
});