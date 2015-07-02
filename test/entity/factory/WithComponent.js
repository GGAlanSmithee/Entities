import { expect } from 'chai';
import { EntityFactory } from '../../../src/core/Entity';

describe('EntityFactory', function() {
    describe('withComponent(component, initializer)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory();
        });
        
        afterEach(() => {
            delete this.entityFactory;
        });
        
        it('is a function', () => {
            expect(this.entityFactory.withComponent).to.be.a('function');
        });
        
        it('adds [component] and [initializer] to [configuration]', () => {
            expect(this.entityFactory.configuration.has(1)).to.be.false;
            
            function initializer() {
                this.a = "A";
            }
            
            this.entityFactory.withComponent(1, initializer);
            
            expect(this.entityFactory.configuration.has(1)).to.be.true;
            
            expect(this.entityFactory.configuration.get(1)).to.equal(initializer);
        });
        
        it('adds registered initializer as [initializer] when [initializer] is omitted or not a function', () => {
            function initializer() {
                this.a = "A";
            }
            
            this.entityFactory.initializers.set(1, initializer);
            
            expect(this.entityFactory.configuration.has(1)).to.be.false;
            this.entityFactory.withComponent(1);
            expect(this.entityFactory.configuration.has(1)).to.be.true;
            expect(this.entityFactory.configuration.get(1)).to.equal(initializer);
            
            this.entityFactory.configuration = new Map();
            
            expect(this.entityFactory.configuration.has(1)).to.be.false;
            this.entityFactory.withComponent(1, []);
            expect(this.entityFactory.configuration.has(1)).to.be.true;
            expect(this.entityFactory.configuration.get(1)).to.equal(initializer);
            
            this.entityFactory.configuration = new Map();
            
            expect(this.entityFactory.configuration.has(1)).to.be.false;
            this.entityFactory.withComponent(1, 1);
            expect(this.entityFactory.configuration.has(1)).to.be.true;
            expect(this.entityFactory.configuration.get(1)).to.equal(initializer);
            
            this.entityFactory.configuration = new Map();
            
            expect(this.entityFactory.configuration.has(1)).to.be.false;
            this.entityFactory.withComponent(1, 'not a function');
            expect(this.entityFactory.configuration.has(1)).to.be.true;
            expect(this.entityFactory.configuration.get(1)).to.equal(initializer);
            
            this.entityFactory.configuration = new Map();
            
            expect(this.entityFactory.configuration.has(1)).to.be.false;
            this.entityFactory.withComponent(1, null);
            expect(this.entityFactory.configuration.has(1)).to.be.true;
            expect(this.entityFactory.configuration.get(1)).to.equal(initializer);
            
            this.entityFactory.configuration = new Map();
        });
        
        it('adds the [component] with undefind as [initializer] if [initializer] is omitted and there is not initializer registered for the [component]', () => {
            expect(this.entityFactory.configuration.has(1)).to.be.false;
            this.entityFactory.withComponent(1);
            
            expect(this.entityFactory.configuration.has(1)).to.be.true;
            expect(this.entityFactory.configuration.get(1)).to.be.undefined;
        });
        
        it('does not add [component] to configuration if [component] is not a number', () => {
            expect(this.entityFactory).property('configuration').property('size').to.equal(0);
            
            this.entityFactory.withComponent();
            
            expect(this.entityFactory).property('configuration').property('size').to.equal(0);
        });
        
        it('returns this (the entityFactory instance)', () => {
            expect(this.entityFactory.withComponent(1)).to.equal(this.entityFactory);
        });
        
        it('returns this (the entityFactory instance) even if [component] is not registered (is invalid)', () => {
            expect(this.entityFactory.withComponent()).to.equal(this.entityFactory);
        });
    });
});