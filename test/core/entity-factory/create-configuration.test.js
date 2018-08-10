import { expect }        from 'chai'
import { EntityFactory } from '../../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('createConfiguration()', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
            
            this.position = 1
            this.velocity = 2
            this.stats = 3
        })
        
        afterEach(() => {
            delete this.entityFactory
        })
        
        test('is a function', () => {
            expect(this.entityFactory.createConfiguration).to.be.a('function')
        })
        
        test('returns the current [_configuration]', () => {
            class initializerOne {
                constructor() {
                    this.a = "A"
                }
            }
            
            function initializerTwo() {
                this.b = "B"
            }

            class initializerThree {
                a = "A"
            }
            
            this.entityFactory._configuration.set(this.position, initializerOne)
            this.entityFactory._configuration.set(this.velocity, initializerTwo)
            this.entityFactory._configuration.set(this.stats, initializerThree)
            
            const configuration = this.entityFactory.createConfiguration()
            
            expect(configuration).to.equal(this.entityFactory._configuration)
            
            expect(configuration).property('size').to.equal(3)
            
            expect(configuration.get(this.position)).to.equal(initializerOne)
            expect(configuration.get(this.velocity)).to.equal(initializerTwo)
            expect(configuration.get(this.stats)).to.equal(initializerThree)
        })
    })
})