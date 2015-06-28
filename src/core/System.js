import { SelectorType } from './World';

export const SystemType = {
    Init    : 0,
    Logic   : 1,
    Render  : 2,
    CleanUp : 3
};

export default class SystemManager {
    constructor() {
        this.systems = new Map();
        
        this.systems.set(SystemType.Init,    new Map());
        this.systems.set(SystemType.Logic,   new Map());
        this.systems.set(SystemType.Render,  new Map());
        this.systems.set(SystemType.CleanUp, new Map());
        
        this.maxRegisteredSystemId = -1;
    }
    
    getNextSystemId() {
        if (!Number.isInteger(this.maxRegisteredSystemId)) {
            this.maxRegisteredSystemId = -1;
        }
        
        let max = this.maxRegisteredSystemId;
        
        this.systems.forEach(system => {
            max = Math.max(max, ...system.keys());
        });
        
        if (max > this.maxRegisteredSystemId) {
            this.maxRegisteredSystemId = max;
        }
        
        return this.maxRegisteredSystemId + 1;
    }
    
    addSystem(callback, components, type = SystemType.Logic, selector = SelectorType.GetWith) {
    	if (typeof callback !== 'function') {
    		throw TypeError('callback must be a function.');
    	}
    	
    	if (!Number.isInteger(components)) {
    		components = 0;
    		selector = SelectorType.Get;
    	}
    	
    	if (type !== SystemType.Init &&
        	type !== SystemType.Logic && 
        	type !== SystemType.Render &&
        	type !== SystemType.CleanUp) {
    		type = SystemType.Logic;
    	}
    	
    	if (selector !== SelectorType.Get &&
    	    selector !== SelectorType.GetWith &&
    	    selector !== SelectorType.GetWithOnly &&
    	    selector !== SelectorType.GetWithout) {
    		selector = SelectorType.GetWith;
    	}
    	
    	let system = {
    		selector,
    		components,
    		callback
    	};
    
    	let systemId = this.getNextSystemId();
    	
    	this.systems.get(type).set(systemId, system);

    	return (this.maxRegisteredSystemId = systemId);
    }
    
    removeSystem(system, type) {
        if (!Number.isInteger(system)) {
            return false;
        }
        
        if (type === null || type === undefined) {
            for (let [,typeSystem] of this.systems) {
                for (let [id] of typeSystem) {
                    if (id === system) {
                        return typeSystem.delete(system);
                    }
                }
            }
            
            return false;
        } else {
            let typeSystem = this.systems.get(type);

            return typeSystem !== undefined ? typeSystem.delete(system) : false;
        }
    }
    
    getSystem(system, type) {
        if (!Number.isInteger(system)) {
            return;
        }
        
        if (type === null || type === undefined) {
            for (let [,typeSystem] of this.systems) {
                for (let [id] of typeSystem) {
                    if (id === system) {
                        return typeSystem.get(system);
                    }
                }
            }
        } else {
            let typeSystem = this.systems.get(type);

            return typeSystem !== undefined ? typeSystem.get(system) : undefined;
        }
    }
}