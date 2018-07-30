import { expect }        from 'chai'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('removeComponent(entityId, componentId)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.entityId       = 0
            
            this.componentOne     = 'one'
            this.componentTwo     = 'two'
            this.componentThree     = 'three'
            this.componentFour     = 'Four'
            
            this.entityManager.entities[this.entityId].components = [
                this.componentOne,
                this.componentTwo,
                this.componentThree,
                this.componentFour,
            ]
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.removeComponent).to.be.a('function')
        })
        
        test('removes a component by unsetting the components bit in the entity mask', () => {
            let entity = this.entityManager.entities[this.entityId]
            
            expect(entity.components).to.equal(15)
            
            expect((entity.components & this.componentFour) === this.componentFour).to.be.true
            expect((entity.components & this.componentThree) === this.componentThree).to.be.true
            expect((entity.components & this.componentTwo) === this.componentTwo).to.be.true
            expect((entity.components & this.componentOne) === this.componentOne).to.be.true
            
            this.entityManager.removeComponent(this.entityId, this.componentThree)
            
            expect((entity.components & this.componentFour) === this.componentFour).to.be.true
            expect((entity.components & this.componentThree) === this.componentThree).to.be.false
            expect((entity.components & this.componentTwo) === this.componentTwo).to.be.true
            expect((entity.components & this.componentOne) === this.componentOne).to.be.true
            
            this.entityManager.removeComponent(this.entityId, this.componentOne)
            
            expect((entity.components & this.componentFour) === this.componentFour).to.be.true
            expect((entity.components & this.componentThree) === this.componentThree).to.be.false
            expect((entity.components & this.componentTwo) === this.componentTwo).to.be.true
            expect((entity.components & this.componentOne) === this.componentOne).to.be.false
            
            this.entityManager.removeComponent(this.entityId, this.componentFour)
            
            expect((entity.components & this.componentFour) === this.componentFour).to.be.false
            expect((entity.components & this.componentThree) === this.componentThree).to.be.false
            expect((entity.components & this.componentTwo) === this.componentTwo).to.be.true
            expect((entity.components & this.componentOne) === this.componentOne).to.be.false
            
            this.entityManager.removeComponent(this.entityId, this.componentTwo)
            
            expect((entity.components & this.componentFour) === this.componentFour).to.be.false
            expect((entity.components & this.componentThree) === this.componentThree).to.be.false
            expect((entity.components & this.componentTwo) === this.componentTwo).to.be.false
            expect((entity.components & this.componentOne) === this.componentOne).to.be.false
        })
        
        test('removes a component by its name', () => {
            let entity = this.entityManager.entities[this.entityId]
            
            expect(entity.components).to.equal(15)
            
            expect((entity.components & this.componentFour) === this.componentFour).to.be.true
            expect((entity.components & this.componentThree) === this.componentThree).to.be.true
            expect((entity.components & this.componentTwo) === this.componentTwo).to.be.true
            expect((entity.components & this.componentOne) === this.componentOne).to.be.true
            
            this.entityManager.removeComponent(this.entityId, this.componentThreeName)
            
            expect((entity.components & this.componentFour) === this.componentFour).to.be.true
            expect((entity.components & this.componentThree) === this.componentThree).to.be.false
            expect((entity.components & this.componentTwo) === this.componentTwo).to.be.true
            expect((entity.components & this.componentOne) === this.componentOne).to.be.true
            
            this.entityManager.removeComponent(this.entityId, this.componentOneName)
            
            expect((entity.components & this.componentFour) === this.componentFour).to.be.true
            expect((entity.components & this.componentThree) === this.componentThree).to.be.false
            expect((entity.components & this.componentTwo) === this.componentTwo).to.be.true
            expect((entity.components & this.componentOne) === this.componentOne).to.be.false
            
            this.entityManager.removeComponent(this.entityId, this.componentFourName)
            
            expect((entity.components & this.componentFour) === this.componentFour).to.be.false
            expect((entity.components & this.componentThree) === this.componentThree).to.be.false
            expect((entity.components & this.componentTwo) === this.componentTwo).to.be.true
            expect((entity.components & this.componentOne) === this.componentOne).to.be.false
            
            this.entityManager.removeComponent(this.entityId, this.componentTwoName)
            
            expect((entity.components & this.componentFour) === this.componentFour).to.be.false
            expect((entity.components & this.componentThree) === this.componentThree).to.be.false
            expect((entity.components & this.componentTwo) === this.componentTwo).to.be.false
            expect((entity.components & this.componentOne) === this.componentOne).to.be.false
        })
    })
})