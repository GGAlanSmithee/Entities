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
    
        let maxId = -1;
        
        this.systems.forEach(system => {
            maxId = Math.max(maxId, ...system.keys());
        });
        
        let systemId = maxId + 1;
    	
    	this.systems.get(type).set(systemId, system);

    	return systemId;
    }
    
    removeSystem(system) {
        if (!Number.isInteger(system)) {
            return false;
        }

        for (let typeSystem of this.systems.values()) {
            for (let id of typeSystem.keys()) {
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
        
        for (let typeSystem of this.systems.values()) {
            for (let id of typeSystem.keys()) {
                if (id === system) {
                    return typeSystem.get(system);
                }
            }
        }
    }
}