import { expect }        from 'chai';
import { NoneComponent } from '../../src/core/Component';
import   World           from '../../src/core/World';

describe('World', function() {
    describe('constructor()', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(World).to.be.a('function');
        });
        
        it('can be used to instantiate a new World', () => {
            expect(this.world).to.be.an.instanceof(World);
        });
        
        it('sets [capacity] to 100', () => {
            expect(this.world).property('capacity').to.equal(100);
        });
        
        it('creates 100 empty entities', () => {
            expect(this.world).property('entities').to.be.an.instanceof(Array);
            expect(this.world).property('entities').property('length').to.equal(100);
        });
        
        it('sets [currentMaxEntity] to -1', () => {
            expect(this.world.currentMaxEntity).to.equal(-1);
        });
        
        it('registers only the "None" (0) component type', () => {
            expect(this.world.components).to.be.an.instanceof(Map);
            
            let noneComponent = this.world.components.get(NoneComponent)
            
            expect(noneComponent).to.be.an.instanceof(Object);
            expect(noneComponent).property('type').to.be.null;
            expect(noneComponent).property('object').to.be.null;
        });
    });
    
    describe('constructor(capacity)', () => {
        beforeEach(() => {
            this.capacity = 2000;
            this.world = new World(this.capacity);
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('sets [capacity] equal to the passed in value', () => {
            expect(this.world).property('capacity').to.equal(this.capacity);
        });
        
        it('creates [capacity] number of empty entities', () => {
            expect(this.world).property('entities').to.be.an.instanceof(Array);
            expect(this.world).property('entities').property('length').to.equal(this.capacity);
            
            for (let i = 0; i < this.world.capacity; ++i) {
                expect(this.world.entities[i]).property('id').to.equal(0);
            }
        });
        
        it('sets [currentMaxEntity] to -1', () => {
            expect(this.world.currentMaxEntity).to.equal(-1);
        });
        
        it('sets [capacity] to 100 (default) on bad input', () => {
            this.world = new World('bad input');
            
            expect(this.world.capacity).to.equal(100);
            expect(this.world).property('entities').property('length').to.equal(this.world.capacity);
            
            for (let i = 0; i < this.world.capacity; ++i) {
                expect(this.world.entities[i]).property('id').to.equal(0);
            }
        });
    });
});