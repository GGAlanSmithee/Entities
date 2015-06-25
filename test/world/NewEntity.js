import { expect } from 'chai';
import   World    from '../../src/core/World';

describe('World', function() {
    describe('NewEntity(components, returnDetails = false)', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.newEntity).to.be.a('function');
        });
    });
});