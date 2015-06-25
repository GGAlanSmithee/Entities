import { expect } from 'chai';
import   World    from '../../src/core/World';
import   sinon    from 'sinon';

describe('World', function() {
    describe('getEntitiesWithOnly(components, returnDetails = false)', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.getEntitiesWithOnly).to.be.a('function');
        });
        
        it('returns an iterable of all entities with [components] up to [currentMaxEntity]', () => {
            let it = this.world.getEntitiesWithOnly(1 | 2);
            
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
            
            it = this.world.getEntitiesWithOnly(1 | 2);
            
            let next = it.next();
            
            expect(next).property('done').to.be.false;
            expect(next).property('value').to.equal(4);
            
            next = it.next();
            
            expect(next).property('done').to.be.false;
            expect(next).property('value').to.equal(19);
            
            next = it.next();
            
            expect(next).property('done').to.be.true;
            expect(next).property('value').to.be.undefined;
            
            it = this.world.getEntitiesWithOnly(1 | 2 | 8);
            
            next = it.next();
            
            expect(next).property('done').to.be.false;
            expect(next).property('value').to.equal(7);
            
            next = it.next();
            
            expect(next).property('done').to.be.true;
            expect(next).property('value').to.be.undefined;
            
            it = this.world.getEntitiesWithOnly(1);
            
            next = it.next();
            
            expect(next).property('done').to.be.true;
            expect(next).property('value').to.be.undefined;
        });
        
        it('returns an entitys id when [returnDetails] = false or omitted', () => {
            this.world.currentMaxEntity = 20;
            
            this.world.entities[0].id = 1 | 2 | 4;
            
            this.world.entities[4].id = 1 | 2;
            
            let it = this.world.getEntitiesWithOnly(1 | 2);
            
            let next = it.next();
            
            expect(next).property('done').to.be.false;
            expect(next).property('value').to.equal(4);
            
            next = it.next();
            
            expect(next).property('done').to.be.true;
            expect(next).property('value').to.be.undefined;
            
            it = this.world.getEntitiesWithOnly(1 | 2, false);
            
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
            
            let it = this.world.getEntitiesWithOnly(1 | 2, true);
            
            let next = it.next();
            
            expect(next).property('done').to.be.false;
            expect(next).property('value').to.equal(this.world.entities[4]);
            
            next = it.next();
            
            expect(next).property('done').to.be.true;
            expect(next).property('value').to.be.undefined;
        });
        
        it('calls [getEntities] when [components] are omitted', () => {
            this.world.currentMaxEntity = 20;
            
            let spy = sinon.spy(this.world, 'getEntities');
            
            let it = this.world.getEntitiesWithOnly();
            
            it.next();
            
            expect(spy.calledOnce).to.be.true;
        });
    });
});