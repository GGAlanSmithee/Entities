import { expect } from 'chai';
import   World    from '../../src/core/World';
import { ComponentType } from '../../src/core/Component';
import { registerComponent, addComponentToEntity } from '../helpers';

describe('World', function() {
    describe('increaseCapacity()', () => {
        beforeEach(() => {
            this.world = new World();
            
            this.staticComponent      = registerComponent(this.world, ComponentType.Static, { x : 10, y : 20 }, 1);
            this.semiDynamicComponent = registerComponent(this.world, ComponentType.SemiDynamic, { x : 10, y : 20 }, 2);
            this.dynamicComponent     = registerComponent(this.world, ComponentType.Dynamic, { x : 10, y : 20 }, 4);
            
            this.entityId = 0;
            
            addComponentToEntity(this.world, this.entityId, this.staticComponent);
            addComponentToEntity(this.world, this.entityId, this.semiDynamicComponent);
            addComponentToEntity(this.world, this.entityId, this.dynamicComponent);
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.increaseCapacity).to.be.a('function');
        });
    });
});