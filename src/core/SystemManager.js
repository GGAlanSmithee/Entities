/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.SystemManager = function() {
    this.initSystems    = [];
    this.logicSystems   = [];
    this.renderSystems  = [];
    this.cleanUpSystems = [];
    
    return this;
};

Entities.SystemManager.Type = {
    Init    : 0,
    Logic   : 1,
    Render  : 2,
    CleanUp : 3
};

Entities.SystemManager.prototype = {
    constructor : Entities.SystemManager,
    
    registerSystem : function(type, system) {
        if (typeof system !== 'function') {
            //todo add logging ?
            
            return;
        }
        
        if (type === undefined || type === null) {
            type = Entities.SystemManager.Type.Logic;
        }
        
        switch (type) {
            case Entities.SystemManager.Type.Init:    this.initSystems.push(system);    break;
            case Entities.SystemManager.Type.Logic:   this.logicSystems.push(system);   break;
            case Entities.SystemManager.Type.Render:  this.renderSystems.push(system);  break;
            case Entities.SystemManager.Type.CleanUp: this.cleanUpSystems.push(system); break;
        }
    }
};