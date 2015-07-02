import World from './World';
import { NoneComponent } from './Component';

export class EntityFactory {
    constructor() {
        this.initializers  = new Map();
        this.configuration = new Map();
    }
    
    registerInitializer(component, initializer) {
        if (!Number.isInteger(component) || typeof initializer !== 'function') {
            return;
        }
        
        this.initializers.set(component, initializer);
    }
    
    build() {
        this.configuration = new Map();
        
        return this;
    }
    
    withComponent(component, initializer) {
        if (!Number.isInteger(component)) {
            return this;
        }
        
        if (typeof initializer !== 'function') {
            initializer = this.initializers.get(component) ?
                this.initializers.get(component) :
                initializer = component => {
                    // todo make a generic reset function if no initializer function is passed in
                    // todo need to work for all types -> strings, numbers, objects, functions, classes etc.
                    // todo needs to be documented
                };
        }
        
        this.configuration.set(component, initializer);
        
        return this;
    }
    
    createConfiguration() {
        return this.configuration;
    }
    
    create(world, count = 1, configuration = undefined) {
        if (!(world instanceof World)) {
            return [];
        }
    
        configuration = configuration || this.configuration;

        let components = NoneComponent;
        
        for (let component of configuration) {
            components |= component;
        }
        
        let entities = [];
        
        for (let i = 0; i < count; ++i) {
            let entity = world.newEntity(components, true);
            
            for (let component of Object.keys(entity)) {
                if (!Number.isInteger(component) || (entity.id & component) !== component) {
                    continue;
                }
                
                // todo there might be a need to capture returned scalars and primites.. check old factory 
                // todo or maybe entity should be this if not possible??
                configuration[component].initializer.call(entity[component]);
            }
            
            entities.push(entity);
        }
        
        return entities;
    }
}