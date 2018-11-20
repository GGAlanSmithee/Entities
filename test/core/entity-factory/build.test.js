import { expect }        from 'chai'
import { EntityFactory } from '../../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('build()', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
            
            this.position = 1
            this.velocity = 2
        })
        
        afterEach(() => {
            delete this.entityFactory
        })
        
        test('is a function', () => {
            expect(this.entityFactory.build).to.be.a('function')
        })
        
        test('clears [_configuration]', () => {
            expect(this.entityFactory)
                .property('_configuration')
                .property('components')
                .property('size')
                .to.equal(0)

            expect(this.entityFactory)
                .property('_configuration')
                .property('data')
                .to.deep.equal({})

            this.entityFactory._configuration.components.set(this.position, () => { })
            this.entityFactory._configuration.components.set(this.velocity, () => { })
            this.entityFactory._configuration.data = { data: 'some data value', }

            expect(this.entityFactory)
                .property('_configuration')
                .property('components')
                .property('size')
                .to.equal(2)
            
            expect(this.entityFactory)
                .property('_configuration')
                .property('data')
                .to.deep.equal({ data: 'some data value', })

            this.entityFactory.build()
            
            expect(this.entityFactory)
                .property('_configuration')
                .property('components')
                .property('size')
                .to.equal(0)

            expect(this.entityFactory)
                .property('_configuration')
                .property('data')
                .to.deep.equal({})
        })
        
        test('returns [this] (the EntityFactory instance)', () => {
            expect(this.entityFactory.build()).to.equal(this.entityFactory)
        })
    })
})