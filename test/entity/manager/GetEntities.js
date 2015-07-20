import { expect }                        from 'chai';
import   EntityManager, { SelectorType } from '../../../src/core/Entity';
import { NoneComponent }                 from '../../../src/core/Component';

describe('EntityManager', function() {
    describe('getEntities(type = SelectorType.Get, components = NoneComponent, returnDetails = false)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager();
        });
        
        afterEach(() => {
            delete this.entityManager;
        });
        
        it('is a function', () => {
            expect(this.entityManager.getEntities).to.be.a('function');
        });
        
        it('returns an iterable of all entities up to [currentMaxEntity]', () => {
            let it = this.entityManager.getEntities();
            
            expect(it.next()).property('done').to.be.true;
            
            this.entityManager.currentMaxEntity = 20;
            
            it = this.entityManager.getEntities();
            
            let i = 0;
            while (it.next().done !== true) {
                ++i;
            }
            
            expect(i).to.equal(this.entityManager.currentMaxEntity + 1).and.to.equal(21);
            
            expect(it.next()).property('value').to.be.undefined;
            expect(it.next()).property('value').to.be.undefined;
        });
        
        it('returns an entitys id when [returnDetails] = false or omitted', () => {
            this.entityManager.currentMaxEntity = 20;
            
            let i = 0;
            for (let entity of this.entityManager.getEntities(SelectorType.Get, NoneComponent, false)) {
                expect(entity).to.equal(i);
                ++i;
            }
            
            i = 0;
            for (let entity of this.entityManager.getEntities()) {
                expect(entity).to.equal(i);
                ++i;
            }
        });
        
        it('returns an actual entity when [returnDetails] = true', () => {
            this.entityManager.currentMaxEntity = 20;
            
            for (let entity of this.entityManager.getEntities(SelectorType.Get, NoneComponent, true)) {
                expect(entity).to.be.an('object');
                expect(entity).to.have.property('id');
                expect(entity).property('id').to.equal(0);
            }
        });
        
        describe('[type] = SelectorType.GetWith', () => {
            it('returns an iterable of all entities with [components] up to [currentMaxEntity]', () => {
                let it = this.entityManager.getEntities(SelectorType.GetWith, 1 | 2);
                
                expect(it.next()).property('done').to.be.true;
                
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0].id = 1 | 2 | 4;
                
                this.entityManager.entities[4].id = 1 | 2;
                
                this.entityManager.entities[6].id = 4;
                
                this.entityManager.entities[7].id = 1 | 8;
                
                this.entityManager.entities[19].id = 1 | 8;
                
                this.entityManager.entities[20].id = 16;
                
                this.entityManager.entities[21].id = 16;
                
                this.entityManager.entities[25].id = 1 | 8;
                
                this.entityManager.entities[40].id = 1 | 8;
                
                it = this.entityManager.getEntities(SelectorType.GetWith, 1 | 2);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(0);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(SelectorType.GetWith, 1);
                
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
            
            it('returns an entitys id when [returnDetails] = false or omitted', () => {
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0].id = 1 | 2 | 4;
                
                this.entityManager.entities[4].id = 1 | 2;
                
                let it = this.entityManager.getEntities(SelectorType.GetWith, 1 | 2);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(0);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(SelectorType.GetWith, 1 | 2), false;
                
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
            
            it('returns an actual entity when [returnDetails] = true', () => {
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0].id = 1 | 2 | 4;
                
                this.entityManager.entities[4].id = 1 | 2;
                
                let it = this.entityManager.getEntities(SelectorType.GetWith, 1 | 2, true);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(this.entityManager.entities[0]);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(this.entityManager.entities[4]);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
        });
        
        describe('[type] = SelectorType.GetWithOnly', () => {
            it('returns an iterable of all entities with [components] up to [currentMaxEntity]', () => {
                let it = this.entityManager.getEntities(SelectorType.GetWithOnly, 1 | 2);
                
                expect(it.next()).property('done').to.be.true;
                
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0].id = 1 | 2 | 4;
                
                this.entityManager.entities[4].id = 1 | 2;
                
                this.entityManager.entities[6].id = 4;
                
                this.entityManager.entities[7].id = 1 | 2 | 8;
                
                this.entityManager.entities[19].id = 1 | 2;
                
                this.entityManager.entities[20].id = 16;
                
                this.entityManager.entities[21].id = 16;
                
                this.entityManager.entities[25].id = 1 | 8;
                
                this.entityManager.entities[40].id = 1 | 8;
                
                it = this.entityManager.getEntities(SelectorType.GetWithOnly, 1 | 2);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(19);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(SelectorType.GetWithOnly, 1 | 2 | 8);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(7);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(SelectorType.GetWithOnly, 1);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
            
            it('returns an entitys id when [returnDetails] = false or omitted', () => {
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0].id = 1 | 2 | 4;
                
                this.entityManager.entities[4].id = 1 | 2;
                
                let it = this.entityManager.getEntities(SelectorType.GetWithOnly, 1 | 2);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(SelectorType.GetWithOnly, 1 | 2, false);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
            
            it('returns an actual entity when [returnDetails] = true', () => {
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0].id = 1 | 2 | 4;
                
                this.entityManager.entities[4].id = 1 | 2;
                
                let it = this.entityManager.getEntities(SelectorType.GetWithOnly, 1 | 2, true);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(this.entityManager.entities[4]);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
        });
        
        describe('[type] = SelectorType.GetWithout', () => {
            it('returns an iterable of all entities without [components] up to [currentMaxEntity]', () => {
                let it = this.entityManager.getEntities(SelectorType.GetWithout, 1 | 2);
                
                expect(it.next()).property('done').to.be.true;
                
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0].id = 1 | 2 | 4;
                
                this.entityManager.entities[4].id = 1 | 2;
                
                this.entityManager.entities[6].id = 4;
                
                this.entityManager.entities[7].id = 1 | 8;
                
                this.entityManager.entities[19].id = 1 | 8;
                
                this.entityManager.entities[20].id = 16;
                
                this.entityManager.entities[21].id = 16;
                
                this.entityManager.entities[25].id = 1 | 8;
                
                this.entityManager.entities[40].id = 1 | 8;
                
                it = this.entityManager.getEntities(SelectorType.GetWithout, 1 | 2);
                
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
                
                it = this.entityManager.getEntities(SelectorType.GetWithout, 1);
                
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
            
            it('returns an entitys id when [returnDetails] = false or omitted', () => {
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0].id = 1 | 2 | 4;
                
                this.entityManager.entities[4].id = 1 | 2;
                
                this.entityManager.entities[8].id = 1 | 2 | 8;
                
                let it = this.entityManager.getEntities(SelectorType.GetWithout, 4);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(8);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.entityManager.getEntities(SelectorType.GetWithout, 4, false);
                
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
            
            it('returns an actual entity when [returnDetails] = true', () => {
                this.entityManager.currentMaxEntity = 20;
                
                this.entityManager.entities[0].id = 1 | 2 | 4;
                
                this.entityManager.entities[4].id = 1 | 2;
                
                this.entityManager.entities[8].id = 1 | 2 | 8;
                
                let it = this.entityManager.getEntities(SelectorType.GetWithout, 4, true);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(this.entityManager.entities[4]);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(this.entityManager.entities[8]);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
        });
    });
});