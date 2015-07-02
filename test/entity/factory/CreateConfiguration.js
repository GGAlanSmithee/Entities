import { expect } from 'chai';
import { EntityFactory } from '../../../src/core/Entity';

describe('EntityFactory', function() {
    describe('createConfiguration()', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory();
        });
        
        afterEach(() => {
            delete this.entityFactory;
        });
        
        it('is a function', () => {
            expect(this.entityFactory.createConfiguration).to.be.a('function');
        });
    });
});