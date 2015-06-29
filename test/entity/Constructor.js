import { expect } from 'chai';
import { EntityFactory } from '../../src/core/Entity';

describe('EntityFactory', function() {
    describe('constructor()', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory();
        });
        
        afterEach(() => {
            delete this.entityFactory;
        });
        
        it('is a function', () => {
            expect(EntityFactory).to.be.a('function');
        });
        
        it('can be used to instantiate a new World', () => {
            expect(this.entityFactory).to.be.an.instanceof(EntityFactory);
        });
    });
});