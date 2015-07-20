import { expect }        from 'chai';
import EntityManager     from '../../../src/core/Entity';

describe('EntityManager', function() {
    describe('registerComponent(object, initializer, type = ComponentType.Static)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.registerComponent).to.be.a('function');
        });
    });
});