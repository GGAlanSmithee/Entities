import { expect } from 'chai';
import   World    from '../../src/core/World';

describe('World', function() {    
    describe('getEntities(returnDetails = true)', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.getEntities).to.be.a('function');
        });
        
        it('returns an iterable of all entities up to [currentMaxEntity]', () => {
            let it = this.world.getEntities();
            
            expect(it.next()).property('done').to.be.true;
            
            this.world.currentMaxEntity = 20;
            
            it = this.world.getEntities();
            
            let i = 0;
            while (it.next().done !== true) {
                ++i;
            }
            
            expect(i).to.equal(this.world.currentMaxEntity + 1).and.to.equal(21);
            
            expect(it.next()).property('value').to.be.undefined;
            expect(it.next()).property('value').to.be.undefined;
        });
        
        it('returns an entitys components when [returnDetails] = true or omitted', () => {
            this.world.currentMaxEntity = 20;
            
            for (let entity of this.world.getEntities()) {
                expect(entity).to.equal(0);
            }
            
            for (let entity of this.world.getEntities(true)) {
                expect(entity).to.equal(0);
            }
        });
        
        it('returns an entitys id when [returnDetails] = false', () => {
            this.world.currentMaxEntity = 20;
            
            let i = 0;
            for (let entity of this.world.getEntities(false)) {
                expect(entity).to.equal(i);
                ++i;
            }
        });
    });
});