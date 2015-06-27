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
        
        this.systems.set(SystemType.Init, new Map());
        this.systems.set(SystemType.Logic, new Map());
        this.systems.set(SystemType.Render, new Map());
        this.systems.set(SystemType.CleanUp, new Map());
        
        this.maxRegisteredSystemId = -1;
    }
    
    getNextSystemId() {
        if (!Number.isInteger(this.maxRegisteredSystemId)) {
            this.maxRegisteredSystemId = -1;
        }
        
        let systems = this.systems !== null && this.systems !== undefined ? this.systems : (this.systems = new Map());
    	
    	let initSystems = systems.has(SystemType.Init) ?
        	systems.get(SystemType.Init) :
        	systems.set(SystemType.Init, new Map()).get(SystemType.Init);
    	
    	let logicSystems = systems.has(SystemType.Logic) ?
        	systems.get(SystemType.Logic) :
        	systems.set(SystemType.Logic, new Map()).get(SystemType.Logic);
        	
    	let renderSystems = systems.has(SystemType.Render) ?
        	systems.get(SystemType.Render) :
        	systems.set(SystemType.Render, new Map()).get(SystemType.Render);
        	
    	let cleanUpSystems = systems.has(SystemType.CleanUp) ?
        	systems.get(SystemType.CleanUp) :
        	systems.set(SystemType.CleanUp, new Map()).get(SystemType.CleanUp);

        let maxRegistered = Math.max(...initSystems.keys(), ...logicSystems.keys(), ...renderSystems.keys(), ...cleanUpSystems.keys());

        if (maxRegistered > this.maxRegisteredSystemId) {
            this.maxRegisteredSystemId = maxRegistered;
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
}