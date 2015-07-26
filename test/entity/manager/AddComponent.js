import { expect }        from 'chai';
import   EntityManager   from '../../../src/core/Entity';
import   * as helpers    from '../../Helpers';

describe('EntityManager', function() {
    describe('addComponent(entityId, componentId)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.entityId       = 0;
            
            this.componentOne   = 1;
            this.componentTwo   = 2;
            this.componentThree = 4;
            this.componentFour  = 8;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.addComponent).to.be.a('function');
        });
        
        it('adds a component by setting the components bit in the entity mask', () => {
            expect(this.entityManager.entities[this.entityId]).to.equal(0);
            
            this.entityManager.addComponent(this.entityId, this.componentOne);
            
            expect(this.entityManager.entities[this.entityId]).to.equal(1);
            expect((this.entityManager.entities[this.entityId] & this.componentOne) === this.componentOne).to.be.true;
            
            this.entityManager.addComponent(this.entityId, this.componentTwo);
            
            expect(this.entityManager.entities[this.entityId]).to.equal(3);
            expect((this.entityManager.entities[this.entityId] & this.componentTwo) === this.componentTwo).to.be.true;
            
            this.entityManager.addComponent(this.entityId, this.componentThree);
            
            expect(this.entityManager.entities[this.entityId]).to.equal(7);
            expect((this.entityManager.entities[this.entityId] & this.componentThree) === this.componentThree).to.be.true;
            
            this.entityManager.addComponent(this.entityId, this.componentFour);
            
            expect(this.entityManager.entities[this.entityId]).to.equal(15);
            expect((this.entityManager.entities[this.entityId] & this.componentFour) === this.componentFour).to.be.true;
        });
    });
});