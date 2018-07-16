import { expect }        from 'chai'
import { SystemManager } from '../../src/core/system-manager'

describe('SystemManager', function() {
    describe('removeEntity(entityId)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager()

            const compOne = 1
            const compTwo = 2
            const compThree = 4
            const compFour = 8

            this.entityOneId = 1
            this.entityOneComponents = compOne | compThree | compFour

            this.entityTwoId = 2
            this.entityTwoComponents = compTwo | compThree | compFour

            this.initSystem = {
                components: compOne | compFour,
                entities: [ this.entityOneId, ],
                callback: () => { }
            }
            
            this.initSystemKey = 1
            
            this.systemManager.initSystems.set(this.initSystemKey, this.initSystem)
            
            this.logicSystem = {
                components: compOne | compThree,
                entities: [ this.entityOneId, ],
                callback: () => { }
            }

            this.logicSystemKey = 1
            this.systemManager.logicSystems.set(this.logicSystemKey, this.logicSystem)

            this.renderSystemOne = {
                components: compTwo,
                entities: [ this.entityTwoId, ],
                callback: () => { }
            }
        
            this.renderSystemOneKey = 1

            this.renderSystemTwo = {
                components: compThree | compFour,
                entities: [ this.entityOneId, this.entityTwoId, ],
                callback: () => { }
            }
        
            this.renderSystemTwoKey = 2

            this.systemManager.renderSystems.set(this.renderSystemOneKey, this.renderSystemOne)
            this.systemManager.renderSystems.set(this.renderSystemTwoKey, this.renderSystemTwo)
        })
        
        afterEach(() => {
            delete this.systemManager
        })

        test('is a function', () => {
            expect(this.systemManager.removeEntity).to.be.a('function')
        })

        test('removes an entity from all systems which it is registered on', () => {
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.contain(this.entityOneId)

            this.systemManager.removeEntity(this.entityOneId)

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.not.contain(this.entityOneId)
        })

        test('does not faulty remove entities', () => {
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.contain(this.entityOneId)

            this.systemManager.removeEntity(this.entityTWoId)

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.contain(this.entityOneId)
        })
    })
})