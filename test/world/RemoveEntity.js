import { expect } from 'chai';
import   World    from '../../src/core/World';

describe('World', function() {
    describe('removeEntity(entity)', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.removeEntity).to.be.a('function');
        });
    });
});