import { SelectorType } from './Entity';

export const SystemType = {
    Logic   : 0,
    Render  : 1
};

export default class SystemManager {
    constructor() {
        this.logicSystems  = new Map();
        this.renderSystems = new Map();
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
    
        let systemId = Math.max(0, ...this.logicSystems.keys(), ...this.renderSystems.keys()) + 1;
    	
    	switch (type) {
    	    case SystemType.Logic  : this.logicSystems.set(systemId, system);  break;
    	    case SystemType.Render : this.renderSystems.set(systemId, system); break;
    	}

    	return systemId;
    }
    
    removeSystem(systemId) {
        return this.logicSystems.delete(systemId) || this.renderSystems.delete(systemId);
    }
}