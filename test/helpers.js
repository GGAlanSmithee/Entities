import { ComponentType } from '../src/core/Component';

let initializeComponents = function() {
    this.staticComponent = 1;
    this.world.components.set(this.staticComponent, { type : ComponentType.Static, object : { x : 10, y : 20 } });
    
    this.semiDynamicComponent = 2;
    this.world.components.set(this.semiDynamicComponent, { type : ComponentType.SemiDynamic, object : { x : 10, y : 20 } });
    
    this.dynamicComponent = 4;
    this.world.components.set(this.dynamicComponent, { type : ComponentType.Dynamic, object : { x : 10, y : 20 } });
}

let initializeEntities = function() {
    this.entityId = 0;
    
    this.world.entities[this.entityId].id = this.staticComponent | this.semiDynamicComponent | this.dynamicComponent;
    
    this.world.entities[this.entityId][this.staticComponent] = this.world.components.get(this.staticComponent).object;
    
    this.world.entities[this.entityId][this.semiDynamicComponent] = this.world.components.get(this.semiDynamicComponent).object;
    
    this.world.entities[this.entityId][this.dynamicComponent] = this.world.components.get(this.dynamicComponent).object;
}

export { initializeComponents, initializeEntities };