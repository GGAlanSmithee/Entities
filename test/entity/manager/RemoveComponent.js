import { expect }        from 'chai';
import   EntityManager   from '../../../src/core/Entity';
import   * as helpers    from '../../Helpers';

describe('EntityManager', function() {
    describe('removeComponent(entityId, componentId)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.entityId       = 0;
            
            this.componentOne   = 1;
            this.componentTwo   = 2;
            this.componentThree = 4;
            this.componentFour  = 8;
            
            this.entityManager.entities[this.entityId] = this.componentOne | this.componentTwo | this.componentThree | this.componentFour;
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.removeComponent).to.be.a('function');
        });
        
        it('removes a component by unsetting the components bit in the entity mask', () => {
            expect(this.entityManager.entities[this.entityId]).to.equal(15);
            
            expect((this.entityManager.entities[this.entityId] & this.componentFour) === this.componentFour).to.be.true;
            expect((this.entityManager.entities[this.entityId] & this.componentThree) === this.componentThree).to.be.true;
            expect((this.entityManager.entities[this.entityId] & this.componentTwo) === this.componentTwo).to.be.true;
            expect((this.entityManager.entities[this.entityId] & this.componentOne) === this.componentOne).to.be.true;
            
            this.entityManager.removeComponent(this.entityId, this.componentThree);
            
            expect((this.entityManager.entities[this.entityId] & this.componentFour) === this.componentFour).to.be.true;
            expect((this.entityManager.entities[this.entityId] & this.componentThree) === this.componentThree).to.be.false;
            expect((this.entityManager.entities[this.entityId] & this.componentTwo) === this.componentTwo).to.be.true;
            expect((this.entityManager.entities[this.entityId] & this.componentOne) === this.componentOne).to.be.true;
            
            this.entityManager.removeComponent(this.entityId, this.componentOne);
            
            expect((this.entityManager.entities[this.entityId] & this.componentFour) === this.componentFour).to.be.true;
            expect((this.entityManager.entities[this.entityId] & this.componentThree) === this.componentThree).to.be.false;
            expect((this.entityManager.entities[this.entityId] & this.componentTwo) === this.componentTwo).to.be.true;
            expect((this.entityManager.entities[this.entityId] & this.componentOne) === this.componentOne).to.be.false;
            
            this.entityManager.removeComponent(this.entityId, this.componentFour);
            
            expect((this.entityManager.entities[this.entityId] & this.componentFour) === this.componentFour).to.be.false;
            expect((this.entityManager.entities[this.entityId] & this.componentThree) === this.componentThree).to.be.false;
            expect((this.entityManager.entities[this.entityId] & this.componentTwo) === this.componentTwo).to.be.true;
            expect((this.entityManager.entities[this.entityId] & this.componentOne) === this.componentOne).to.be.false;
            
            this.entityManager.removeComponent(this.entityId, this.componentTwo);
            
            expect((this.entityManager.entities[this.entityId] & this.componentFour) === this.componentFour).to.be.false;
            expect((this.entityManager.entities[this.entityId] & this.componentThree) === this.componentThree).to.be.false;
            expect((this.entityManager.entities[this.entityId] & this.componentTwo) === this.componentTwo).to.be.false;
            expect((this.entityManager.entities[this.entityId] & this.componentOne) === this.componentOne).to.be.false;
        });
    });
});