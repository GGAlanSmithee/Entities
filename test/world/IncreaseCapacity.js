import { expect } from 'chai';
import   World    from '../../src/core/World';
import * as helpers from '../helpers';

describe('World', function() {
    describe('increaseCapacity()', () => {
        beforeEach(() => {
            this.world = new World();
            
            helpers.registerStaticComponent(this, this.world, 0);
            helpers.registerSemiDynamicComponent(this, this.world, 1);
            helpers.registerDynamicComponent(this, this.world, 2);
            
            let entityId = helpers.addAndGetEntityId(this);
            
            helpers.addComponentToEntity(this.world, entityId, 0);
            helpers.addComponentToEntity(this.world, entityId, 1);
            helpers.addComponentToEntity(this.world, entityId, 2);
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.increaseCapacity).to.be.a('function');
        });
    });
});