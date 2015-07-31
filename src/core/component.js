export default class ComponentManager {
    constructor() {
        this.components = new Map();
    }
    
    newComponent(componentId) {
        let component = this.components.get(componentId);
        
        if (component === null || component === undefined) {
            return null;
        }
        
        switch (typeof component) {
            case 'function': return new component();
            case 'object'  : {
                return ((component) => {
                    let ret = {};
                    
                    Object.keys(component).forEach(key => ret[key] = component[key]);
                    
                    return ret;
                })(component);
            }
        }
        
        return component;
    }
    
    registerComponent(component) {
        if (component === null || component === undefined) {
            throw TypeError('component cannot be null.');
        }
        
        let max = Math.max(...this.components.keys());
        
        let id = max === undefined || max === null || max === -Infinity ? 1 : max === 0 ? 1 : max * 2;

        this.components.set(id, component);

        return id;
    }
    
    getComponents() {
        return this.components;
    }
}