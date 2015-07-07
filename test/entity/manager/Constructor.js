import { expect } from 'chai';
import EntityManager, { EntityFactory } from '../../../src/core/Entity';
import EventHandler from '../../../src/core/Event';
import SystemManager from '../../../src/core/System';

describe('EntityFactory', function() {
    describe('constructor()', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(EntityManager).to.be.a('function');
        });
        
        it('can be used to instantiate a new EntityManager', () => {
            expect(this.entityManager).to.be.an.instanceof(EntityManager);
        });
        
        it('instantiates [entityFactory] as an instance of [EntityFactory]', () => {
            expect(this.entityManager).property('entityFactory').to.be.an.instanceof(EntityFactory);
        });
        
        it('instantiates [eventHandler] as an instance of [EventHandler]', () => {
            expect(this.entityManager).property('eventHandler').to.be.an.instanceof(EventHandler);
        });
        
        it('instantiates [systemManager] as an instance of [SystemManager]', () => {
            expect(this.entityManager).property('systemManager').to.be.an.instanceof(SystemManager);
        });
    });
});