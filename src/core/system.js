import { SelectorType } from './entity';

export const SystemType = {
    Logic  : 0,
    Render : 1,
    Init   : 2
};

export default class SystemManager {
    constructor() {
        this.logicSystems  = new Map();
        this.renderSystems = new Map();
        this.initSystems   = new Map();
    }
    
    registerSystem(type, selector, components, callback) {
        if (type !== SystemType.Logic && type !== SystemType.Render) {
            throw TypeError('type must be a valid SystemType.');
        }
    
        if (selector !== SelectorType.Get && selector !== SelectorType.GetWith &&
            selector !== SelectorType.GetWithOnly && selector !== SelectorType.GetWithout) {
            throw TypeError('selector must be a valid SelectorType.');
        }
        
        if (typeof components !== 'number')  {
            throw TypeError('components must be a number.');
        }
        
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
            case SystemType.Logic : this.logicSystems.set(systemId, system); break;
            case SystemType.Render : this.renderSystems.set(systemId, system); break;
        }
        
        return systemId;
    }
    
    removeSystem(systemId) {
        return this.logicSystems.delete(systemId) || this.renderSystems.delete(systemId);
    }
}