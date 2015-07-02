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
            initializer = this.initializers.get(component);
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
                if ((entity.id & component) !== component || !configuration[component]) {
                    continue;
                }
                
                let result = configuration[component].initializer.call(entity[component]);
                    
                if (typeof entity[component] !== 'function' && typeof entity[component] !== 'object' && result !== undefined) {
                    entity[component] = result;
                }
            }
            
            entities.push(entity);
        }
        
        return entities;
    }
}