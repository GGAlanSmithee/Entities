import { SelectorType } from './World';
import { NoneComponent } from  './Component';

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
    
    addSystem(callback, components = NoneComponent, type = SystemType.Logic, selector = SelectorType.GetWith) {
    	if (typeof callback !== 'function') {
    		throw TypeError('callback must be a function.');
    	}
    	
    	if (!Number.isInteger(components) || components === NoneComponent) {
    		components = NoneComponent;
    		selector = SelectorType.Get;
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
    
    removeSystem(system) {
        if (!Number.isInteger(system)) {
            return false;
        }

        for (let [,typeSystem] of this.systems) {
            for (let [id] of typeSystem) {
                if (id === system) {
                    return typeSystem.delete(system);
                }
            }
        }
    
        
        return false;
    }
    
    getSystem(system) {
        if (!Number.isInteger(system)) {
            return;
        }
        
        for (let [,typeSystem] of this.systems) {
            for (let [id] of typeSystem) {
                if (id === system) {
                    return typeSystem.get(system);
                }
            }
        }
    }
}