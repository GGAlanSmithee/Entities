import { expect }        from 'chai'
import { EntityFactory } from '../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('createConfiguration()', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
            
            this.position = 1
            this.velocity = 2
        })
        
        afterEach(() => {
            delete this.entityFactory
        })
        
        it('is a function', () => {
            expect(this.entityFactory.createConfiguration).to.be.a('function')
        })
        
        it('returns the current configuration', () => {
            function initializerOne() {
                this.a = "A"
            }
            
            function initializerTwo() {
                this.b = "B"
            }
            
            this.entityFactory.configuration.set(this.position, initializerOne)
            this.entityFactory.configuration.set(this.velocity, initializerTwo)
            
            let configuration = this.entityFactory.createConfiguration()
            
            expect(configuration).to.equal(this.entityFactory.configuration)
            
            expect(configuration).property('size').to.equal(2)
            
            expect(configuration.get(this.position)).to.equal(initializerOne)
            expect(configuration.get(this.velocity)).to.equal(initializerTwo)
        })
    })
})