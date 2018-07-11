import { expect }        from 'chai'
import { SystemManager } from '../../src/core/system-manager'

describe('SystemManager', function() {
    describe('addEntity(entityId, entityComponents)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager()
        })
        
        afterEach(() => {
            delete this.systemManager
        })

        test('is a function', () => {
            expect(this.systemManager.addEntity).to.be.a('function')
        })
    })
})