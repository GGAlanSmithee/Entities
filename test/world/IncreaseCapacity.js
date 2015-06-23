import { expect } from 'chai';
import   World    from '../../src/core/World';
import { initializeComponents, initializeEntities } from '../helpers';

describe('World', function() {
    describe('increaseCapacity()', () => {
        beforeEach(() => {
            this.world = new World();
            
            initializeComponents.call(this);
            initializeEntities.call(this);
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.increaseCapacity).to.be.a('function');
        });
    });
});