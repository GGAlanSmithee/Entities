export const NoneComponent = 0;

export const ComponentType = {
    Dynamic     : 0,
    SemiDynamic : 1,
    Static      : 2
};

export default class ComponentManager {
    constructor() {
        this.components = new Map();
        this.components.set(NoneComponent, { type : null, object : null });
    }
    
    newComponent(object) {
        if (object === null || object === undefined) {
            return null;
        }
        
        switch (typeof object) {
            case 'function': return new object();
            case 'object'  : {
                return ((object) => {
                    let ret = {};
                    
                    Object.keys(object).forEach(key => ret[key] = object[key]);
                    
                    return ret;
                })(object);
            }
        }
        
        return object;
    }
    
    registerComponent(object, initializer, type = ComponentType.Static, returnDetails = false) {
        if (object === null || object === undefined) {
            throw TypeError('object cannot be null.');
        }
        
        let max = Math.max(...this.components.keys());
        
        let id = max === undefined || max === null || max === -Infinity ? 0 : max === 0 ? 1 : max * 2;
        
        let component = { type, object };
        
        this.components.set(id, component);

        return returnDetails ? component : id;
    }
    
    addComponentToEntity(entity, componentId) {
        if (typeof entity !== 'object' || entity === null) {
            return;
        }
        
        let component = this.components.get(componentId);
        
        if (!component) {
            return;
        }

        if ((entity.id & componentId) !== componentId) {
            entity.id |= componentId;
        }
        
        if (component.type === ComponentType.Static || (entity[componentId] !== null && entity[componentId] !== undefined)) {
            return;
        }

        entity[componentId] = this.newComponent(component.object);
    }
    
    removeComponentFromEntity(entity, componentId) {
        if (typeof entity !== 'object' || entity === null) {
            return;
        }
        
        let component = this.components.get(componentId);
        
        if (!component) {
            return;
        }
        
        if ((entity.id & componentId) === componentId) {
            entity.id &= ~componentId;
            
            if (component.type === ComponentType.Dynamic && entity[componentId] !== null && entity[componentId] !== undefined) {
                delete entity[componentId];
            }
        }
    }
    
    getComponents() {
        return this.components;
    }
}