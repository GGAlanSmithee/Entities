import { expect }                      from 'chai';
import EntityManager, { SelectorType } from '../../../src/core/entity';
import * as helpers                    from './../../helpers';

describe('EntityManager', function() {
    describe('getEntities(components = 0, type = SelectorType.GetWith)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
            
            this.posComponent  = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, { x : 10, y : 20 }, 1);
            this.nameComponent = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, { name : 'Testing' }, 2);
            this.velComponent  = helpers.registerComponent(this.entityManager.componentManager, this.entityManager, 5.5, 4);
            
            this.entity = 0;
            
            this.components = this.posComponent | this.nameComponent | this.velComponent;
            
            helpers.addComponentToEntity(this.entityManager, this.entityManager.componentManager, this.entity, this.posComponent);
            helpers.addComponentToEntity(this.entityManager, this.entityManager.componentManager, this.entity, this.nameComponent);
            helpers.addComponentToEntity(this.entityManager, this.entityManager.componentManager, this.entity, this.velComponent);
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.getEntities).to.be.a('function');
        });
        
        describe('[type] = SelectorType.Get', () => {
            it('returns an iterable of all entities up to [currentMaxEntity]', () => {
                // let it = this.entityManager.getEntities(0, SelectorType.Get);
                
                // expect(it.next()).property('done').to.be.true;
                
                this.entityManager.currentMaxEntity = 20;
                
                let it = this.entityManager.getEntities(0, SelectorType.Get);
                
                let i = 0;
                while (it.next().done !== true) {
                    ++i;
                }
                
                expect(i).to.equal(this.entityManager.currentMaxEntity + 1).and.to.equal(21);
                
                expect(it.next()).property('value').to.be.undefined;
            });
            
            it('returns an entitys id', () => {
                this.entityManager.currentMaxEntity = 20;
                
                let i = 0;
                for (let entity of this.entityManager.getEntities(0, SelectorType.Get)) {
                    expect(entity).to.equal(i);
                    ++i;
                }
                
                i = 0;
                for (let entity of this.entityManager.getEntities()) {
                    expect(entity).to.equal(i);
                    ++i;
                }
            });
        });
        
        describe('[type] = SelectorType.GetWith', () => {
            it('returns an iterable of all entities with [components] up to [currentMaxEntity]', () => {
                let it = this.entityManager.getEntities(1 | 2, SelectorType.GetWith);
                
                let next = it.next();
                
                expect(next).property('done').to.be.true;
                
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0] = 1 | 2 | 4;
                
                this.entityManager.entities[4] = 1 | 2;
                
                this.entityManager.entities[6] = 4;
                
                this.entityManager.entities[7] = 1 | 8;
                
                this.entityManager.entities[19] = 1 | 8;
                
                this.entityManager.entities[20] = 16;
                
                this.entityManager.entities[21] = 16;
                
                this.entityManager.entities[25] = 1 | 8;
                
                this.entityManager.entities[40] = 1 | 8;
                
                it = this.entityManager.getEntities(1 | 2);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(0);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(1);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(0);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(7);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(19);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
            
            it('returns an entitys id', () => {
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0] = 1 | 2 | 4;
                
                this.entityManager.entities[4] = 1 | 2;
                
                let it = this.entityManager.getEntities(1 | 2);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(0);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(1 | 2, SelectorType.GetWith), false;
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(0);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
        });
        
        describe('[type] = SelectorType.GetWithOnly', () => {
            it('returns an iterable of all entities with [components] up to [currentMaxEntity]', () => {
                let it = this.entityManager.getEntities(1 | 2, SelectorType.GetWithOnly);
                
                expect(it.next()).property('done').to.be.true;
                
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0] = 1 | 2 | 4;
                
                this.entityManager.entities[4] = 1 | 2;
                
                this.entityManager.entities[6] = 4;
                
                this.entityManager.entities[7] = 1 | 2 | 8;
                
                this.entityManager.entities[19] = 1 | 2;
                
                this.entityManager.entities[20] = 16;
                
                this.entityManager.entities[21] = 16;
                
                this.entityManager.entities[25] = 1 | 8;
                
                this.entityManager.entities[40] = 1 | 8;
                
                it = this.entityManager.getEntities(1 | 2, SelectorType.GetWithOnly);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(19);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(1 | 2 | 8, SelectorType.GetWithOnly);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(7);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(1, SelectorType.GetWithOnly);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
            
            it('returns an entitys id', () => {
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0] = 1 | 2 | 4;
                
                this.entityManager.entities[4] = 1 | 2;
                
                let it = this.entityManager.getEntities(1 | 2, SelectorType.GetWithOnly);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(1 | 2, SelectorType.GetWithOnly);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
        });
        
        describe('[type] = SelectorType.GetWithout', () => {
            it('returns an iterable of all entities without [components] up to [currentMaxEntity]', () => {
                let it = this.entityManager.getEntities(1 | 2, SelectorType.GetWithout);
                
                expect(it.next()).property('done').to.be.true;
                
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0] = 1 | 2 | 4;
                
                this.entityManager.entities[4] = 1 | 2;
                
                this.entityManager.entities[6] = 4;
                
                this.entityManager.entities[7] = 1 | 8;
                
                this.entityManager.entities[19] = 1 | 8;
                
                this.entityManager.entities[20] = 16;
                
                this.entityManager.entities[21] = 16;
                
                this.entityManager.entities[25] = 1 | 8;
                
                this.entityManager.entities[40] = 1 | 8;
                
                it = this.entityManager.getEntities(1 | 2, SelectorType.GetWithout);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(6);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(7);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(19);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(20);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(1, SelectorType.GetWithout);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(6);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(20);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
            
            it('returns an entitys id', () => {
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0] = 1 | 2 | 4;
                
                this.entityManager.entities[4] = 1 | 2;
                
                this.entityManager.entities[8] = 1 | 2 | 8;
                
                let it = this.entityManager.getEntities(4, SelectorType.GetWithout);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(8);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(4, SelectorType.GetWithout);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(8);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
        });
    });
});