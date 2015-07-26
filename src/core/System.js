import { SelectorType } from './Entity';

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
    
    addSystem(callback, components = 0, type = SystemType.Logic, selector = SelectorType.GetWith) {
    	if (typeof callback !== 'function') {
    		throw TypeError('callback must be a function.');
    	}
    	
    	let system = {
    		selector,
    		components,
    		callback
    	};
    
        let systemId = -1;
        
        this.systems.forEach(sys => {
            systemId = Math.max(systemId, ...sys.keys());
        });
        
        ++systemId;
    	
    	this.systems.get(type).set(systemId, system);

    	return systemId;
    }
    
    removeSystem(systemId) {
        for (let typeSystem of this.systems.values()) {
            for (let id of typeSystem.keys()) {
                if (id === systemId) {
                    return typeSystem.delete(systemId);
                }
            }
        }

        return false;
    }
    
    getSystem(systemId) {
        for (let typeSystem of this.systems.values()) {
            for (let id of typeSystem.keys()) {
                if (id === systemId) {
                    return typeSystem.get(systemId);
                }
            }
        }
    }
}