import { expect }        from 'chai'
import { EntityFactory } from '../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('unregisterInitializer(id)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
            
            this.pos = 1
            
            this.entityFactory.initializers.set(this.pos, () => {})
        })
        
        afterEach(() => {
            delete this.entityFactory
        })
        
        it('is a function', () => {
            expect(this.entityFactory.unregisterInitializer).to.be.a('function')
        })
        
        it('removes a previously registered initializer', () => {
            expect(this.entityFactory.initializers.get(this.pos)).to.be.a.function
            
            this.entityFactory.unregisterInitializer(this.pos)
            
            expect(this.entityFactory.initializers.get(this.pos)).to.be.undefined
        })
        
        it('does nothin, given the wrong [id]', () => {
            expect(this.entityFactory.initializers.get(this.pos)).to.be.a.function
            
            this.entityFactory.unregisterInitializer(this.pos)
            
            expect(this.entityFactory.initializers.get(this.pos)).to.be.a.function
        })
        
        it('returns true when succesfully removing a initializer', () => {
            expect(this.entityFactory.unregisterInitializer(this.pos)).to.be.true
        })
        
        it('returns false when attemting to remove a component that is not registered', () => {
            expect(this.entityFactory.unregisterInitializer(this.pos+1)).to.be.false
        })
        
        it('throws an error if [id] is not an positive integer', () => {
            expect(() => { this.entityFactory.unregisterInitializer() }).to.throw(TypeError, 'id must be a number over 0.')
            expect(() => { this.entityFactory.unregisterInitializer(0) }).to.throw(TypeError, 'id must be a number over 0.')
            expect(() => { this.entityFactory.unregisterInitializer('0') }).to.throw(TypeError, 'id must be a number over 0.')
            expect(() => { this.entityFactory.unregisterInitializer('') }).to.throw(TypeError, 'id must be a number over 0.')
            expect(() => { this.entityFactory.unregisterInitializer('not a postive integer') }).to.throw(TypeError, 'id must be a number over 0.')
            expect(() => { this.entityFactory.unregisterInitializer(-1) }).to.throw(TypeError, 'id must be a number over 0.')
            expect(() => { this.entityFactory.unregisterInitializer(1.2) }).to.throw(TypeError, 'id must be a number over 0.')
            expect(() => { this.entityFactory.unregisterInitializer(null) }).to.throw(TypeError, 'id must be a number over 0.')
            expect(() => { this.entityFactory.unregisterInitializer(undefined) }).to.throw(TypeError, 'id must be a number over 0.')
            expect(() => { this.entityFactory.unregisterInitializer([]) }).to.throw(TypeError, 'id must be a number over 0.')
            expect(() => { this.entityFactory.unregisterInitializer({}) }).to.throw(TypeError, 'id must be a number over 0.')
        })
    })
})