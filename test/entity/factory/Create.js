import { expect } from 'chai';
import sinon from 'sinon';
import { EntityFactory } from '../../../src/core/Entity';
import World from '../../../src/core/World';

describe('EntityFactory', function() {
    describe('create(world, count = 1, configuration = undefined)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory();
            this.world = new World()
            
            this.componentOne = 1;
            this.componentTwo = 2;
            this.componentThree = 8;
            this.componentFour = 32;
            
            this.componentOneInitializer = function() { this.x = 4.0; };
            this.componentTwoInitializer = function() { this.y = 5.0; };
            this.componentThreeInitializer = () => { return 15; };
            this.componentFourInitializer = () => { return "Full Name"; };
            
            this.entityFactory.configuration.set(this.componentOne, this.componentOneInitializer);
            this.entityFactory.configuration.set(this.componentTwo, this.componentTwoInitializer);
            this.entityFactory.configuration.set(this.componentThree, this.componentThreeInitializer);
            this.entityFactory.configuration.set(this.componentFour, this.componentFourInitializer);
            
            this.components = this.componentOne | this.componentTwo | this.componentThree | this.componentFour;
            
            this.newEntityStub = sinon.stub(this.world, 'newEntity');
            
            function funcComponent() {
                this.x = 1.0;
            }
            
            this.newEntityStub.withArgs(this.components, true).returns({
                id   : this.components,
                '1'  : new funcComponent(),
                '2'  : { y : 2.0 },
                '8'  : 1,
                '32' : "Name"
            });
        });
        
        afterEach(() => {
            delete this.world;
            delete this.entityFactory;
        });
        
        it('is a function', () => {
            expect(this.entityFactory.create).to.be.a('function');
        });
        
        it('creates an entity according to the current [configuration]', () => {
            let entity = this.entityFactory.create(this.world)[0];

            expect(this.newEntityStub.calledOnce).to.be.true;
            
            expect(entity).to.have.property('id');
            
            expect(entity).to.have.property(this.componentOne);
            expect(entity).property(this.componentOne).property('x').to.equal(4.0);
            
            expect(entity).to.have.property(this.componentTwo);
            expect(entity).property(this.componentTwo).property('y').to.equal(5.0);
            
            expect(entity).to.have.property(this.componentThree);
            expect(entity).property(this.componentThree).to.equal(this.componentThreeInitializer());
            
            expect(entity).to.have.property(this.componentFour);
            expect(entity).property(this.componentFour).to.equal(this.componentFourInitializer());
        });
    });
});