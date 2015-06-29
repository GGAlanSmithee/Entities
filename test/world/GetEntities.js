import { expect } from 'chai';
import   World, { SelectorType } from '../../src/core/World';
import { NoneComponent } from '../../src/core/Component';

describe('World', function() {
    describe('getEntities(type = SelectorType.Get, components = NoneComponent, returnDetails = false)', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.getEntities).to.be.a('function');
        });
        
        it('returns an iterable of all entities up to [currentMaxEntity]', () => {
            let it = this.world.getEntities();
            
            expect(it.next()).property('done').to.be.true;
            
            this.world.currentMaxEntity = 20;
            
            it = this.world.getEntities();
            
            let i = 0;
            while (it.next().done !== true) {
                ++i;
            }
            
            expect(i).to.equal(this.world.currentMaxEntity + 1).and.to.equal(21);
            
            expect(it.next()).property('value').to.be.undefined;
            expect(it.next()).property('value').to.be.undefined;
        });
        
        it('returns an entitys id when [returnDetails] = false or omitted', () => {
            this.world.currentMaxEntity = 20;
            
            let i = 0;
            for (let entity of this.world.getEntities(SelectorType.Get, NoneComponent, false)) {
                expect(entity).to.equal(i);
                ++i;
            }
            
            i = 0;
            for (let entity of this.world.getEntities()) {
                expect(entity).to.equal(i);
                ++i;
            }
        });
        
        it('returns an actual entity when [returnDetails] = true', () => {
            this.world.currentMaxEntity = 20;
            
            for (let entity of this.world.getEntities(SelectorType.Get, NoneComponent, true)) {
                expect(entity).to.be.an('object');
                expect(entity).to.have.property('id');
                expect(entity).property('id').to.equal(0);
            }
        });
        
        describe('[type] = SelectorType.GetWith', () => {
            it('returns an iterable of all entities with [components] up to [currentMaxEntity]', () => {
                let it = this.world.getEntities(SelectorType.GetWith, 1 | 2);
                
                expect(it.next()).property('done').to.be.true;
                
                this.world.currentMaxEntity = 20;
                
                this.world.entities[0].id = 1 | 2 | 4;
                
                this.world.entities[4].id = 1 | 2;
                
                this.world.entities[6].id = 4;
                
                this.world.entities[7].id = 1 | 8;
                
                this.world.entities[19].id = 1 | 8;
                
                this.world.entities[20].id = 16;
                
                this.world.entities[21].id = 16;
                
                this.world.entities[25].id = 1 | 8;
                
                this.world.entities[40].id = 1 | 8;
                
                it = this.world.getEntities(SelectorType.GetWith, 1 | 2);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(0);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.world.getEntities(SelectorType.GetWith, 1);
                
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
                this.world.currentMaxEntity = 20;
                
                this.world.entities[0].id = 1 | 2 | 4;
                
                this.world.entities[4].id = 1 | 2;
                
                let it = this.world.getEntities(SelectorType.GetWith, 1 | 2);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(0);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.world.getEntities(SelectorType.GetWith, 1 | 2), false;
                
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
                this.world.currentMaxEntity = 20;
                
                this.world.entities[0].id = 1 | 2 | 4;
                
                this.world.entities[4].id = 1 | 2;
                
                let it = this.world.getEntities(SelectorType.GetWith, 1 | 2, true);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(this.world.entities[0]);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(this.world.entities[4]);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
        });
        
        describe('[type] = SelectorType.GetWithOnly', () => {
            it('returns an iterable of all entities with [components] up to [currentMaxEntity]', () => {
                let it = this.world.getEntities(SelectorType.GetWithOnly, 1 | 2);
                
                expect(it.next()).property('done').to.be.true;
                
                this.world.currentMaxEntity = 20;
                
                this.world.entities[0].id = 1 | 2 | 4;
                
                this.world.entities[4].id = 1 | 2;
                
                this.world.entities[6].id = 4;
                
                this.world.entities[7].id = 1 | 2 | 8;
                
                this.world.entities[19].id = 1 | 2;
                
                this.world.entities[20].id = 16;
                
                this.world.entities[21].id = 16;
                
                this.world.entities[25].id = 1 | 8;
                
                this.world.entities[40].id = 1 | 8;
                
                it = this.world.getEntities(SelectorType.GetWithOnly, 1 | 2);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(19);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.world.getEntities(SelectorType.GetWithOnly, 1 | 2 | 8);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(7);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.world.getEntities(SelectorType.GetWithOnly, 1);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
            
            it('returns an entitys id when [returnDetails] = false or omitted', () => {
                this.world.currentMaxEntity = 20;
                
                this.world.entities[0].id = 1 | 2 | 4;
                
                this.world.entities[4].id = 1 | 2;
                
                let it = this.world.getEntities(SelectorType.GetWithOnly, 1 | 2);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.world.getEntities(SelectorType.GetWithOnly, 1 | 2, false);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
            
            it('returns an actual entity when [returnDetails] = true', () => {
                this.world.currentMaxEntity = 20;
                
                this.world.entities[0].id = 1 | 2 | 4;
                
                this.world.entities[4].id = 1 | 2;
                
                let it = this.world.getEntities(SelectorType.GetWithOnly, 1 | 2, true);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(this.world.entities[4]);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
        });
        
        describe('[type] = SelectorType.GetWithout', () => {
            it('returns an iterable of all entities without [components] up to [currentMaxEntity]', () => {
                let it = this.world.getEntities(SelectorType.GetWithout, 1 | 2);
                
                expect(it.next()).property('done').to.be.true;
                
                this.world.currentMaxEntity = 20;
                
                this.world.entities[0].id = 1 | 2 | 4;
                
                this.world.entities[4].id = 1 | 2;
                
                this.world.entities[6].id = 4;
                
                this.world.entities[7].id = 1 | 8;
                
                this.world.entities[19].id = 1 | 8;
                
                this.world.entities[20].id = 16;
                
                this.world.entities[21].id = 16;
                
                this.world.entities[25].id = 1 | 8;
                
                this.world.entities[40].id = 1 | 8;
                
                it = this.world.getEntities(SelectorType.GetWithout, 1 | 2);
                
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
                
                it = this.world.getEntities(SelectorType.GetWithout, 1);
                
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
                this.world.currentMaxEntity = 20;
                
                this.world.entities[0].id = 1 | 2 | 4;
                
                this.world.entities[4].id = 1 | 2;
                
                this.world.entities[8].id = 1 | 2 | 8;
                
                let it = this.world.getEntities(SelectorType.GetWithout, 4);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(4);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(8);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
                
                it = this.world.getEntities(SelectorType.GetWithout, 4, false);
                
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
                this.world.currentMaxEntity = 20;
                
                this.world.entities[0].id = 1 | 2 | 4;
                
                this.world.entities[4].id = 1 | 2;
                
                this.world.entities[8].id = 1 | 2 | 8;
                
                let it = this.world.getEntities(SelectorType.GetWithout, 4, true);
                
                let next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(this.world.entities[4]);
                
                next = it.next();
                
                expect(next).property('done').to.be.false;
                expect(next).property('value').to.equal(this.world.entities[8]);
                
                next = it.next();
                
                expect(next).property('done').to.be.true;
                expect(next).property('value').to.be.undefined;
            });
        });
    });
});