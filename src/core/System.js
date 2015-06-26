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
    
    getNextSystemId(type) {
        let system = this.systems.get(type);
        
        if (system === null) {
            this.systems.set(type, new Map());
        }
        
        let max = Math.max(...this.systems.get(system).keys());
        
        return max === undefined || max === null || max === -Infinity ? 0: max === 0 ? 1 : max * 2;
    }
}