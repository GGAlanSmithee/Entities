import { expect }    from 'chai'
import EntityFactory from '../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('build()', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
            
            this.position = 'position'
            this.velocity = 'velocity'
        })
        
        afterEach(() => {
            delete this.entityFactory
        })
        
        it('is a function', () => {
            expect(this.entityFactory.build).to.be.a('function')
        })
        
        it('clears [configuration]', () => {
            this.entityFactory.configuration.set(this.position, () => { })
            this.entityFactory.configuration.set(this.velocity, () => { })
            
            expect(this.entityFactory).property('configuration').property('size').to.equal(2)
            
            this.entityFactory.build()
            
            expect(this.entityFactory).property('configuration').property('size').to.equal(0)
        })
        
        it('returns this (the entityFactory instance)', () => {
            expect(this.entityFactory.build()).to.equal(this.entityFactory)
        })
    })
})