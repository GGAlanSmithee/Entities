import { expect } from 'chai';
import   World    from '../../src/core/World';

describe('World', function() {
    describe('increaseCapacity()', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.increaseCapacity).to.be.a('function');
        });
    });
});