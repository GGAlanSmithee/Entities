import { expect }                          from 'chai';
import ComponentManager, { ComponentType } from '../../../src/core/Component';
import EntityManager                       from '../../../src/core/Entity';
import * as helpers                        from '../../helpers';

describe('ComponentManager', function() {
    describe('addComponentToEntity(entity, componentId)', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager();
            this.entityManager = new EntityManager();
            
            this.component = helpers.registerComponent(this.componentManager, this.entityManager, ComponentType.Static, { x : 10, y : 20 }, 1);
            
            this.entity = 0;
        });
        
        afterEach(() => {
            delete this.entityManager;
            delete this.componentManager;
        });
        
        it('is a function', () => {
            expect(this.componentManager.addComponentToEntity).to.be.a('function');
        });
        
        it('adds a component with [componentId] to the [entity]', () => {
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            expect(this.entityManager.entities[this.entity].id & this.component).to.not.equal(this.component);
            expect(this.entityManager.entities[this.entity]).to.have.property(this.component);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], this.component);
            
            expect(this.entityManager.entities[this.entity].id).to.equal(1);
            expect(this.entityManager.entities[this.entity].id & this.component).to.equal(this.component);
            expect(this.entityManager.entities[this.entity]).to.have.property(this.component);
            expect(this.entityManager.entities[this.entity]).property(this.component).to.be.an('object');
        });

        it('adds and instantiates a dynamic component to the [entity]', () => {
            let dynamicComponent = helpers.registerComponent(this.componentManager, this.entityManager, ComponentType.Dynamic, 'Dynamic', 2);
            
            expect(this.entityManager.entities[this.entity].id & dynamicComponent).to.not.equal(dynamicComponent);
            expect(this.entityManager.entities[this.entity]).to.not.have.property(dynamicComponent);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], dynamicComponent);
            
            expect(this.entityManager.entities[this.entity].id & dynamicComponent).to.equal(dynamicComponent);
            expect(this.entityManager.entities[this.entity]).to.have.property(dynamicComponent);
            expect(this.entityManager.entities[this.entity]).property(dynamicComponent).to.not.be.null;
        });
        
        it('adds a semi dynamic component to the [entity] and instantiate it', () => {
            let semiDynamicComponent = helpers.registerComponent(this.componentManager, this.entityManager, ComponentType.SemiDynamic, 'Semi Dynamic', 2);
            
            expect(this.entityManager.entities[this.entity].id & semiDynamicComponent).to.not.equal(semiDynamicComponent);
            expect(this.entityManager.entities[this.entity]).to.not.have.property(semiDynamicComponent);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], semiDynamicComponent);
            
            expect(this.entityManager.entities[this.entity].id & semiDynamicComponent).to.equal(semiDynamicComponent);
            expect(this.entityManager.entities[this.entity]).to.have.property(semiDynamicComponent);
            expect(this.entityManager.entities[this.entity]).property(semiDynamicComponent).to.not.be.null;
        });
        
        it('does not instatiate a dynamic component twice if already instantiated when added (error situation)', () => {
            let dynamicComponent = helpers.registerComponent(this.componentManager, this.entityManager, ComponentType.Dynamic, 'Dynamic', 4);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], dynamicComponent);
            
            expect(this.entityManager.entities[this.entity].id & dynamicComponent).to.equal(dynamicComponent);
            expect(this.entityManager.entities[this.entity]).to.have.property(dynamicComponent);
            expect(this.entityManager.entities[this.entity]).property(dynamicComponent).to.not.be.null;
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], dynamicComponent);
            
            expect(this.entityManager.entities[this.entity].id & dynamicComponent).to.equal(dynamicComponent);
            expect(this.entityManager.entities[this.entity]).to.have.property(dynamicComponent);
            expect(this.entityManager.entities[this.entity]).property(dynamicComponent).to.not.be.null;
        });
        
        it('does not instatiate a semi dynamic component twice if already instantiated when added', () => {
            let semiDynamicComponent = helpers.registerComponent(this.componentManager, this.entityManager, ComponentType.SemiDynamic, 'Semi Dynamic', 2);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], semiDynamicComponent);
            
            expect(this.entityManager.entities[this.entity].id & semiDynamicComponent).to.equal(semiDynamicComponent);
            expect(this.entityManager.entities[this.entity]).to.have.property(semiDynamicComponent);
            expect(this.entityManager.entities[this.entity]).property(semiDynamicComponent).to.not.be.null;
            
            this.entityManager.entities[this.entity].id = 0;
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], semiDynamicComponent);
            
            expect(this.entityManager.entities[this.entity].id & semiDynamicComponent).to.equal(semiDynamicComponent);
            expect(this.entityManager.entities[this.entity]).to.have.property(semiDynamicComponent);
            expect(this.entityManager.entities[this.entity]).property(semiDynamicComponent).to.not.be.null;
        });
        
        it('does not add a component with [componentId] if the component has not been registered', () => {
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], 99);
            
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            expect(this.entityManager.entities[this.entity]).to.not.have.property(99);
        });
        
        it('does not add a component if [componentId] is not a valid input', () => {
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity]);
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], null);
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], 'not a number');
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], []);
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], {});
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity], 1.2);
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
        });
        
        it('does not add a component if [entity] is not an object or null', () => {
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity].id);
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity].id, null);
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity].id, 'not a number');
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(null, this.component);
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity(this.entityManager.entities[this.entity].id, this.component);
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
            
            this.componentManager.addComponentToEntity([], this.component);
            expect(this.entityManager.entities[this.entity].id).to.equal(0);
        });
    });
});