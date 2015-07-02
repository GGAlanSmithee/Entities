import { expect } from 'chai';
import { EntityFactory } from '../../../src/core/Entity';

describe('EntityFactory', function() {
    describe('registerInitializer(component, initializer)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory();
        });
        
        afterEach(() => {
            delete this.entityFactory;
        });
        
        it('is a function', () => {
            expect(this.entityFactory.registerInitializer).to.be.a('function');
        });
        
        it('registers an initializer', () => {
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer(1, () => { });
            
            expect(this.entityFactory.initializers.size).to.equal(1);
            
            this.entityFactory.registerInitializer(2, () => { });
            
            expect(this.entityFactory.initializers.size).to.equal(2);
            
            this.entityFactory.registerInitializer(1, () => { });
            
            expect(this.entityFactory.initializers.size).to.equal(2);
            
            this.entityFactory.registerInitializer(3, () => { });
            
            expect(this.entityFactory.initializers.size).to.equal(3);
        });
        
        it('does not register an initializer if [component] is not an integer', () => {
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer(undefined, () => { });
            
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer(null, () => { });
            
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer('not a number', () => { });
            
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer(1.2, () => { });
            
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer([], () => { });
            
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer({}, () => { });
            
            expect(this.entityFactory.initializers.size).to.equal(0);
        });
        
        it('does not register an initializer if [initializer] is not a function', () => {
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer(1, []);
            
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer(1, {});
            
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer(1, 'not a function');
            
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer(1, 1);
            
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer(1);
            
            expect(this.entityFactory.initializers.size).to.equal(0);
            
            this.entityFactory.registerInitializer(1, null);
            
            expect(this.entityFactory.initializers.size).to.equal(0);
        });
    });
});