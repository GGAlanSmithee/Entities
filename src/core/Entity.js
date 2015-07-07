import World from './World';
import { NoneComponent, ComponentType } from './Component';
import SystemManager from './System';
import EventHandler from './Event';

export default class EntityManager {
    constructor(entityFactory = new EntityFactory(), systemManager = new SystemManager(), eventHandler = new EventHandler()) {
        this.entityFactory = entityFactory;
        this.systemManager = systemManager;
        this.eventHandler  = eventHandler;
    }
}

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
        
        for (let component of configuration.keys()) {
            components |= component;
        }
        
        let entities = [];
        
        for (let i = 0; i < count; ++i) {
            let entity = world.newEntity(components, true);
            
            if (!entity) {
                continue;
            }
                
            for (let [component, initializer] of configuration) {
                if (!initializer) {
                    continue;
                }

                let result = initializer.call(entity[component]);
                
                if (typeof entity[component] !== 'function' && typeof entity[component] !== 'object' && result !== undefined) {
                    entity[component] = result;
                }
            }
            
            entities.push(entity);
        }
        
        return entities;
    }
}