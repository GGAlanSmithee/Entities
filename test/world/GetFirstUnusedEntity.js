import { expect } from 'chai';
import   World    from '../../src/core/World';

describe('World', function() {
    describe('getFirstUnusedEntity(returnDetails = false)', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.getFirstUnusedEntity).to.be.a('function');
        });
    });
});