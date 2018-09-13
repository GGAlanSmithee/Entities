import { expect }        from 'chai'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('removeComponent(entityId, componentId)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.entityId       = 0
            
            this.componentOne     = 'one'
            this.componentTwo     = 'two'
            this.componentThree   = 'three'
            this.componentFour    = 'Four'
            
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
        
        test('removes a component by its [key] by removing it from the entity´s [components] array', () => {
            const entity = this.entityManager.entities[this.entityId]

            expect(entity.components).to.include(this.componentFour)
            expect(entity.components).to.include(this.componentThree)
            expect(entity.components).to.include(this.componentTwo)
            expect(entity.components).to.include(this.componentOne)
            
            this.entityManager.removeComponent(this.entityId, this.componentThree)
            
            expect(entity.components).to.include(this.componentFour)
            expect(entity.components).to.not.include(this.componentThree)
            expect(entity.components).to.include(this.componentTwo)
            expect(entity.components).to.include(this.componentOne)

            this.entityManager.removeComponent(this.entityId, this.componentOne)
            
            expect(entity.components).to.include(this.componentFour)
            expect(entity.components).to.not.include(this.componentThree)
            expect(entity.components).to.include(this.componentTwo)
            expect(entity.components).to.not.include(this.componentOne)
            
            this.entityManager.removeComponent(this.entityId, this.componentFour)
            
            expect(entity.components).to.not.include(this.componentFour)
            expect(entity.components).to.not.include(this.componentThree)
            expect(entity.components).to.include(this.componentTwo)
            expect(entity.components).to.not.include(this.componentOne)
            
            this.entityManager.removeComponent(this.entityId, this.componentTwo)
            
            expect(entity.components).to.not.include(this.componentFour)
            expect(entity.components).to.not.include(this.componentThree)
            expect(entity.components).to.not.include(this.componentTwo)
            expect(entity.components).to.not.include(this.componentOne)
        })
    })
})