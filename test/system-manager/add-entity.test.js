import { expect }        from 'chai'
import { SystemManager } from '../../src/core/system-manager'

describe('SystemManager', function() {
    describe('addEntity(entityId, entityComponents)', () => {
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
                entities: [],
                callback: () => { }
            }
            
            this.initSystemKey = 1
            
            this.systemManager.initSystems.set(this.initSystemKey, this.initSystem)
            
            this.logicSystem = {
                components: compOne | compThree,
                entities: [],
                callback: () => { }
            }

            this.logicSystemKey = 1
            this.systemManager.logicSystems.set(this.logicSystemKey, this.logicSystem)

            this.renderSystemOne = {
                components: compTwo,
                entities: [],
                callback: () => { }
            }
        
            this.renderSystemOneKey = 1

            this.renderSystemTwo = {
                components: compThree | compFour,
                entities: [],
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
            expect(this.systemManager.addEntity).to.be.a('function')
        })

        test('adds [entityId]s to the systems with corresponding [components]', () => {
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.be.empty

            this.systemManager.addEntity(this.entityOneId, this.entityOneComponents)

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.not.be.empty
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.not.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.not.be.empty

            this.systemManager.addEntity(this.entityTwoId, this.entityTwoComponents)

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.not.be.empty
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.not.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.not.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.not.be.empty
        })

        test('does not add [entityId]s to the systems that does not have matching [components]', () => {
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.be.empty

            this.systemManager.addEntity(this.entityTwoId, this.entityTwoComponents)
            this.systemManager.addEntity(this.entityOneId, this.entityOneComponents)
            this.systemManager.addEntity(this.entityTwoId, this.entityTwoComponents)

            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.not.be.empty
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.not.contain(this.entityTwoId)

            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.not.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.not.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.contain(this.entityTwoId)

            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.not.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.contain(this.entityTwoId)

            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.not.be.empty
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.contain(this.entityOneId)
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.not.contain(this.entityTwoId)
        })

        test('does not re-add existing entity ids', () => {
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.be.empty

            this.systemManager.addEntity(this.entityOneId, this.entityOneComponents)

            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').property('length').to.equal(1)
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').property('length').to.equal(1)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').property('length').to.equal(1)

            this.systemManager.addEntity(this.entityOneId, this.entityOneComponents)

            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').property('length').to.equal(1)
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').property('length').to.equal(1)
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').property('length').to.equal(1)
        })

        test('does nothing if [entityId] isn´t a positive integer', () => {
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.be.empty

            this.systemManager.addEntity(null, this.entityOneComponents)
            this.systemManager.addEntity(undefined, this.entityOneComponents)
            this.systemManager.addEntity('1', this.entityOneComponents)
            this.systemManager.addEntity([], this.entityOneComponents)
            this.systemManager.addEntity({}, this.entityOneComponents)
            this.systemManager.addEntity(1.2, this.entityOneComponents)
            this.systemManager.addEntity(-1, this.entityOneComponents)

            this.systemManager.addEntity(null, this.entityTwoComponents)
            this.systemManager.addEntity(undefined, this.entityTwoComponents)
            this.systemManager.addEntity('1', this.entityTwoComponents)
            this.systemManager.addEntity([], this.entityTwoComponents)
            this.systemManager.addEntity({}, this.entityTwoComponents)
            this.systemManager.addEntity(1.2, this.entityTwoComponents)
            this.systemManager.addEntity(-1, this.entityTwoComponents)

            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.be.empty
        })

        test('does nothing if [entityComponents] isn´t a positive integer', () => {
            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.be.empty

            this.systemManager.addEntity(this.entityOneId, null)
            this.systemManager.addEntity(this.entityOneId, undefined)
            this.systemManager.addEntity(this.entityOneId, '1')
            this.systemManager.addEntity(this.entityOneId, [])
            this.systemManager.addEntity(this.entityOneId, {})
            this.systemManager.addEntity(this.entityOneId, 1.2)
            this.systemManager.addEntity(this.entityOneId, -1)

            this.systemManager.addEntity(this.entityTwoId, null)
            this.systemManager.addEntity(this.entityTwoId, undefined)
            this.systemManager.addEntity(this.entityTwoId, '1')
            this.systemManager.addEntity(this.entityTwoId, [])
            this.systemManager.addEntity(this.entityTwoId, {})
            this.systemManager.addEntity(this.entityTwoId, 1.2)
            this.systemManager.addEntity(this.entityTwoId, -1)

            expect(this.systemManager.logicSystems.get(this.logicSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.initSystems.get(this.initSystemKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemOneKey)).property('entities').to.be.empty
            expect(this.systemManager.renderSystems.get(this.renderSystemTwoKey)).property('entities').to.be.empty
        })
    })
})