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
            
            this.entityFactory._configuration.components.set(this.position, initializerOne)
            this.entityFactory._configuration.components.set(this.velocity, initializerTwo)
            this.entityFactory._configuration.components.set(this.stats, initializerThree)
            this.entityFactory._configuration.data = { val1: 'valueOne', val2: 42 }
            
            const configuration = this.entityFactory.createConfiguration()
            
            expect(configuration.components).property('size').to.equal(3)
            expect(configuration.components).to.deep.equal(this.entityFactory._configuration.components)
            expect(configuration.components.get(this.position)).to.equal(initializerOne)
            expect(configuration.components.get(this.velocity)).to.equal(initializerTwo)
            expect(configuration.components.get(this.stats)).to.equal(initializerThree)

            expect(configuration.data).to.deep.equal(this.entityFactory._configuration.data)
        })
    })
})