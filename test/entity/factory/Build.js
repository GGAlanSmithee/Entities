import { expect } from 'chai';
import { EntityFactory } from '../../../src/core/Entity';

describe('EntityFactory', function() {
    describe('build()', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory();
        });
        
        afterEach(() => {
            delete this.entityFactory;
        });
        
        it('is a function', () => {
            expect(this.entityFactory.build).to.be.a('function');
        });
        
        it('clears [configuration]', () => {
            this.entityFactory.configuration.set(1, () => { });
            this.entityFactory.configuration.set(2, () => { });
            
            expect(this.entityFactory).property('configuration').property('size').to.equal(2);
            
            this.entityFactory.build();
            
            expect(this.entityFactory).property('configuration').property('size').to.equal(0);
        });
        
        it('returns this (the entityFactory instance)', () => {
            expect(this.entityFactory.build()).to.equal(this.entityFactory);
        });
    });
});