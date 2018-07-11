import { expect }        from 'chai'
import { SystemManager } from '../../src/core/system-manager'

describe('SystemManager', function() {
    describe('removeEntity(entityId)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager()
        })
        
        afterEach(() => {
            delete this.systemManager
        })

        test('is a function', () => {
            expect(this.systemManager.removeEntity).to.be.a('function')
        })
    })
})