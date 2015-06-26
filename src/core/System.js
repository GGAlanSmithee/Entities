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
    }
    
    getNextSystemId() {
        if (this.systems === null || this.systems === undefined) {
            this.systems = new Map();
        }
        
        let initSystem = this.systems.has(SystemType.Init) ?
            this.systems.get(SystemType.Init) :
            this.systems.set(SystemType.Init, new Map());
            
        let logicSystem   = this.systems.has(SystemType.Logic) ?
            this.systems.get(SystemType.Logic) :
            this.systems.set(SystemType.Logic, new Map());
            
        let renderSystem  = this.systems.has(SystemType.Render) ?
            this.systems.get(SystemType.Render) :
            this.systems.set(SystemType.Render, new Map());
            
        let cleanUpSystem = this.systems.has(SystemType.CleanUp) ?
            this.systems.get(SystemType.CleanUp) :
            this.systems.set(SystemType.CleanUp, new Map());
        
        let max = Math.max(...initSystem.keys(), ...logicSystem.keys(), ...renderSystem.keys(), ...cleanUpSystem.keys());

        return max === undefined || max === null || max === -Infinity ? 0 : max + 1;
    }
}