import { expect }        from 'chai'
import { EntityFactory } from '../../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('withData(data)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
        })
        
        afterEach(() => {
            delete this.entityFactory
        })
        
        test('is a function', () => {
            expect(this.entityFactory.withData).to.be.a('function')
        })

        test('adds [data] to current [configuration]', () => {
            expect(this.entityFactory._configuration).property('data').to.deep.equal({})
            
            const newData = {
                test: 'testing',
                val: {
                    nestedValue: 'hello there!',
                },
            }
            
            this.entityFactory.withData(newData)
            
            expect(this.entityFactory._configuration).property('data').to.deep.equal(newData)
        })

        test('does not add [data] to current [configuration] if [data] isn\'t an object', () => {
            expect(this.entityFactory._configuration).property('data').to.deep.equal({})
            

            this.entityFactory.withData('test')
            expect(this.entityFactory._configuration).property('data').to.deep.equal({})

            this.entityFactory.withData([ 'one' , 2, 'three', ])
            expect(this.entityFactory._configuration).property('data').to.deep.equal({})

            this.entityFactory.withData(new Map([['key1', 1], ['key2', { value: 'hello' }]]))
            expect(this.entityFactory._configuration).property('data').to.deep.equal({})

            this.entityFactory.withData(1)
            expect(this.entityFactory._configuration).property('data').to.deep.equal({})

            this.entityFactory.withData(1.2)
            expect(this.entityFactory._configuration).property('data').to.deep.equal({})

            this.entityFactory.withData(null)
            expect(this.entityFactory._configuration).property('data').to.deep.equal({})

            this.entityFactory.withData(undefined)
            expect(this.entityFactory._configuration).property('data').to.deep.equal({})

            this.entityFactory.withData()
            expect(this.entityFactory._configuration).property('data').to.deep.equal({})
        })
    })
})