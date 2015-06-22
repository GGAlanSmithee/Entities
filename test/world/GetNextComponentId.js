import { expect } from 'chai';
import   World    from '../../src/core/World';

describe('World', function() {
    describe('getNextComponentId()', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.getNextComponentId).to.be.a('function');
        });
        
        it('returns the correct component id under normal circumstances', () => {
            this.world.components.set(1, { });
            this.world.components.set(2, { });
            this.world.components.set(4, { });
            
            let nextComponent = this.world.getNextComponentId();
            
            expect(nextComponent).to.equal(8);
        });
        
        it('returns the correct component id when there is a gap in the existing ids', () =>{
            this.world.components.set(1, { });
            this.world.components.set(4, { });
            
            let nextComponent = this.world.getNextComponentId();
            
            expect(nextComponent).to.equal(8);
        });
        
        it('returns the correct component id when only the "None" component exists', () => {
            expect(this.world.getNextComponentId()).to.equal(1);
        });
        
        it('returns the correct component id when there is no prior components', () => {
            this.world.components = new Map();
            expect(this.world.getNextComponentId()).to.equal(0);
        });
        
        it('returns the correct component id when components are null or undefined', () => {
            this.world.components = null;
            expect(this.world.getNextComponentId()).to.equal(0);
            expect(this.world.components).to.be.an.instanceof(Map);
            
            this.world.components = undefined;
            expect(this.world.getNextComponentId()).to.equal(0);
            expect(this.world.components).to.be.an.instanceof(Map);
        });
    });
});