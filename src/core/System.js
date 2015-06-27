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
}