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
        
        this.maxRegisteredSystemId = 0;
    }
    
    getNextSystemId() {
        if (!Number.isInteger(this.maxRegisteredSystemId)) {
            this.maxRegisteredSystemId = 0;
        }
        
        return this.maxRegisteredSystemId;
    }
}