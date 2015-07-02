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
        
        it('returns the current configuration', () => {
            function initializerOne() {
                this.a = "A";
            }
            
            function initializerTwo() {
                this.b = "B";
            }
            
            this.entityFactory.configuration.set(1, initializerOne);
            this.entityFactory.configuration.set(2, initializerTwo);
            
            let configuration = this.entityFactory.createConfiguration();
            
            expect(configuration).to.equal(this.entityFactory.configuration);
            expect(configuration).property('size').to.equal(2);
            expect(configuration.get(1)).to.equal(initializerOne);
            expect(configuration.get(2)).to.equal(initializerTwo);
        });
    });
});