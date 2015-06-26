export const SystemType = {
    Init    : 0,
    Logic   : 1,
    Render  : 2,
    CleanUp : 3
};

export default class SystemManager {
    constructor() {
        this.initSystems    = [];
        this.logicSystems   = [];
        this.renderSystems  = [];
        this.cleanUpSystems = [];
    }
}