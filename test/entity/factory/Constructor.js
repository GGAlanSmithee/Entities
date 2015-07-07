import { expect } from 'chai';
import { EntityFactory } from '../../../src/core/Entity';

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
        
        it('can be used to instantiate a new EntityFactory', () => {
            expect(this.entityFactory).to.be.an.instanceof(EntityFactory);
        });
        
        it('instantiates [configuration] as a Map', () => {
            expect(this.entityFactory.configuration).to.be.an.instanceof(Map);
        });
        
        it('instantiates [initializers] as a Map', () => {
            expect(this.entityFactory.initializers).to.be.an.instanceof(Map);
        });
    });
});