import { expect }        from 'chai';
import   World           from '../../src/core/World';
import { ComponentType } from '../../src/core/Component';

describe('World', function() {
    describe('addComponent(entity, componentId)', () => {
        beforeEach(() => {
            this.world = new World();
            
            // todo mock this
            this.component = this.world.registerComponentType({ x : 10, y : 20 }, ComponentType.Static, false);
            
            this.entity = 0;
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.addComponent).to.be.a('function');
        });
        
        it('adds a component with [componentId] to the [entity]', () => {
            expect(this.world.entities[this.entity].id).to.equal(0);
            expect(this.world.entities[this.entity].id & this.component).to.not.equal(this.component);
            expect(this.world.entities[this.entity]).to.have.property(this.component);
            
            this.world.addComponent(this.entity, this.component);
            
            expect(this.world.entities[this.entity].id).to.equal(1);
            expect(this.world.entities[this.entity].id & this.component).to.equal(this.component);
            expect(this.world.entities[this.entity]).to.have.property(this.component);
            expect(this.world.entities[this.entity]).property(this.component).to.be.an('object');
        });

        it('adds and instantiates a dynamic component to the [entity]', () => {
            // todo mock this
            let dynamicComponent = this.world.registerComponentType('Dynamic', ComponentType.Dynamic, false);
            
            expect(this.world.entities[this.entity].id & dynamicComponent).to.not.equal(dynamicComponent);
            expect(this.world.entities[this.entity]).to.not.have.property(dynamicComponent);
            
            this.world.addComponent(this.entity, dynamicComponent);
            
            expect(this.world.entities[this.entity].id & dynamicComponent).to.equal(dynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(dynamicComponent);
            expect(this.world.entities[this.entity]).property(dynamicComponent).to.not.be.null;
        });
        
        it('adds a semi dynamic component to the [entity] and instantiate it', () => {
            // todo mock this
            let semiDynamicComponent = this.world.registerComponentType('Semi dynamic', ComponentType.SemiDynamic, false);
            
            expect(this.world.entities[this.entity].id & semiDynamicComponent).to.not.equal(semiDynamicComponent);
            expect(this.world.entities[this.entity]).to.not.have.property(semiDynamicComponent);
            
            this.world.addComponent(this.entity, semiDynamicComponent);
            
            expect(this.world.entities[this.entity].id & semiDynamicComponent).to.equal(semiDynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(semiDynamicComponent);
            expect(this.world.entities[this.entity]).property(semiDynamicComponent).to.not.be.null;
        });
        
        it('does not instatiate a dynamic component twice if already instantiated when added (error situation)', () => {
            // todo mock this
            let dynamicComponent = this.world.registerComponentType('Dynamic', ComponentType.Dynamic, false);
            
            this.world.addComponent(this.entity, dynamicComponent);
            
            expect(this.world.entities[this.entity].id & dynamicComponent).to.equal(dynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(dynamicComponent);
            expect(this.world.entities[this.entity]).property(dynamicComponent).to.not.be.null;
            
            this.world.addComponent(this.entity, dynamicComponent);
            
            expect(this.world.entities[this.entity].id & dynamicComponent).to.equal(dynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(dynamicComponent);
            expect(this.world.entities[this.entity]).property(dynamicComponent).to.not.be.null;
        });
        
        it('does not instatiate a semi dynamic component twice if already instantiated when added', () => {
            // todo mock this
            let semiDynamicComponent = this.world.registerComponentType('Semi dynamic', ComponentType.SemiDynamic, false);
            
            this.world.addComponent(this.entity, semiDynamicComponent);
            
            expect(this.world.entities[this.entity].id & semiDynamicComponent).to.equal(semiDynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(semiDynamicComponent);
            expect(this.world.entities[this.entity]).property(semiDynamicComponent).to.not.be.null;
            
            this.world.entities[this.entity].id = 0;
            this.world.addComponent(this.entity, semiDynamicComponent);
            
            expect(this.world.entities[this.entity].id & semiDynamicComponent).to.equal(semiDynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(semiDynamicComponent);
            expect(this.world.entities[this.entity]).property(semiDynamicComponent).to.not.be.null;
        });
        
        it('does not add a component with [componentId] if the component has not been registered', () => {
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, 99);
            
            expect(this.world.entities[this.entity].id).to.equal(0);
            expect(this.world.entities[this.entity]).to.not.have.property(99);
        });
        
        it('does not add a component if [componentId] is not a valid input', () => {
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity);
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, null);
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, 'not a number');
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, []);
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, {});
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, 1.2);
            expect(this.world.entities[this.entity].id).to.equal(0);
        });
    });
});