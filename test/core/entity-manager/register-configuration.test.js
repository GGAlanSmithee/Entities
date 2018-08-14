import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'
import { isNonEmptyStringMsg } from '../../../src/validate/is-non-empty-string'

describe('EntityManager', function() {
    describe('registerConfiguration()', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.registerConfiguration).to.be.a('function')
        })
        
        test('invokes [entityFactory].createConfiguration', () => {
            let spy = sinon.spy(this.entityManager.entityFactory, 'createConfiguration')

            this.entityManager.registerConfiguration('myConfiguration', 'conf')
            
            expect(spy.calledOnce).to.be.true
        })
        
        test('saves the created configuration in [entityConfigurations]', () => {
            const component1   = 'myComp'
            const initializer1 = function() { this.x = 2 }
            
            const component2   = 'anotherComp'
            const initializer2 = 'test'

            const component3   = 'lala'
            const initializer3 = 1.5

            this.entityManager.entityFactory._configuration.set(component1, initializer1)
            this.entityManager.entityFactory._configuration.set(component2, initializer2)
            this.entityManager.entityFactory._configuration.set(component3, initializer3)
            
            const conf = 'myConf'

            this.entityManager.registerConfiguration(conf)
            
            const configuration = this.entityManager.entityConfigurations.get(conf)
            
            expect(configuration).to.be.an.instanceof(Map)
            expect(configuration).property('size').to.equal(3)
            expect(configuration.get(component1)).to.equal(initializer1)
            expect(configuration.get(component2)).to.equal(initializer2)
            expect(configuration.get(component3)).to.equal(initializer3)
        })

        test('invokes console.warn if there is already a configuration registered on [key]', () => {
            let spy = sinon.spy(console, 'warn')

            this.entityManager.registerConfiguration('myConfiguration')
            this.entityManager.registerConfiguration('myConfiguration1')
            this.entityManager.registerConfiguration('myConfiguration2')
            this.entityManager.registerConfiguration('myConfiguration')
            
            expect(spy.calledOnce).to.be.true

            this.entityManager.registerConfiguration('myConfiguration1')

            expect(spy.calledTwice).to.be.true
        })

        test('throws error if [key] is not a string', () => {
            expect(() => {
                this.entityManager.registerConfiguration('').to.throw(
                    TypeError,
                    isNonEmptyStringMsg('', 'key')
                )
            })

            expect(() => {
                this.entityManager.registerConfiguration(1).to.throw(
                    TypeError,
                    isNonEmptyStringMsg(1, 'key')
                )
            })

            expect(() => {
                this.entityManager.registerConfiguration(new Map()).to.throw(
                    TypeError,
                    isNonEmptyStringMsg(new Map(), 'key')
                )
            })

            expect(() => {
                this.entityManager.registerConfiguration(null).to.throw(
                    TypeError,
                    isNonEmptyStringMsg(null, 'key')
                )
            })

            expect(() => {
                this.entityManager.registerConfiguration(undefined).to.throw(
                    TypeError,
                    isNonEmptyStringMsg(undefined, 'key')
                )
            })

            expect(() => {
                this.entityManager.registerConfiguration(1.5).to.throw(
                    TypeError,
                    isNonEmptyStringMsg(1.5, 'key')
                )
            })
        })
    })
})