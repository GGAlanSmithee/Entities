import { expect }        from 'chai'
import { SystemManager } from '../../../src/core/system-manager'

describe('SystemManager', function() {
    describe('removeEntity(entityId)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager()

            const compOne = 'one'
            const compTwo = 'two'
            const compThree = 'three'
            const compFour = 'four'

            this.badEntityId = 3

            this.entityOneId = 1
            this.entityOneComponents = [ compOne, compThree, compFour ]

            this.entityTwoId = 2
            this.entityTwoComponents = [ compTwo, compThree, compFour ]

            this.initSystem = {
                components: [ compOne, compFour, ],
                entities: [ this.entityOneId, ],
                callback: () => { }
            }
            
            this.initSystemKey = 1
            
            this.systemManager.initSystems.set(this.initSystemKey, this.initSystem)
            
            this.logicSystem = {
                components: [ compOne, compThree, ],
                entities: [ this.entityOneId, ],
                callback: () => { }
            }

            this.logicSystemKey = 1
            this.systemManager.logicSystems.set(this.logicSystemKey, this.logicSystem)

            this.renderSystemOne = {
                components: [ compTwo, ],
                entities: [ this.entityTwoId, ],
                callback: () => { }
            }
        
            this.renderSystemOneKey = 1

            this.renderSystemTwo = {
                components: [ compThree, compFour, ],
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
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.contain(this.entityTwoId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityTwoId)

            this.systemManager.removeEntity(this.entityOneId)

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.not.contain(this.entityOneId)
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.not.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.contain(this.entityTwoId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.not.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityTwoId)

            this.systemManager.removeEntity(this.entityTwoId)

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.not.contain(this.entityOneId)
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.not.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.not.contain(this.entityTwoId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.not.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.not.contain(this.entityTwoId)
        })

        test('does not remove entities when a bad [entityId] is passed in', () => {
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.contain(this.entityTwoId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityTwoId)

            this.systemManager.removeEntity(this.badEntityId)

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.contain(this.entityTwoId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityTwoId)

            this.systemManager.removeEntity(-1)

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.contain(this.entityTwoId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityTwoId)

            this.systemManager.removeEntity('1')

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.contain(this.entityTwoId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityTwoId)

            this.systemManager.removeEntity([])

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.contain(this.entityTwoId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityTwoId)

            this.systemManager.removeEntity({})

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.contain(this.entityTwoId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityTwoId)

            this.systemManager.removeEntity(1.1)

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.contain(this.entityTwoId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityTwoId)
        })
    })
})