import { expect } from 'chai';
import   SystemManager, { SystemType } from '../../src/core/System';
import { SelectorType } from '../../src/core/World';
import * as helpers from '../helpers';

describe('SystemManager', function() {
    describe('getSystem(system, type)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager();
            this.systemOne = 1;
            this.systemTwo = 2;
            this.systemThree = 3;
            this.systemFour = 4;
            
            helpers.registerSystem(this.systemManager, 1, 1 | 2,  () => { return 1 | 2 },  SystemType.Init,    SelectorType.Get);
            helpers.registerSystem(this.systemManager, 2, 2 | 4,  () => { return 2 | 4 },  SystemType.Logic,   SelectorType.GetWith);
            helpers.registerSystem(this.systemManager, 3, 4 | 8,  () => { return 4 | 8 },  SystemType.Render,  SelectorType.GetWithOnly);
            helpers.registerSystem(this.systemManager, 4, 8 | 16, () => { return 8 | 16 }, SystemType.CleanUp, SelectorType.GetWithout);
            
            this.systemManager.maxRegisteredSystemId = 4;
        });
        
        afterEach(() => {
            delete this.systemManager;
        });

        it('is a function', () => {
            expect(this.systemManager.getSystem).to.be.a('function');
        });
        
        it('gets a system', () => {
            let system = this.systemManager.getSystem(1);
            
            expect(system).to.be.an('object');
            expect(system.callback()).to.equal(1 | 2);
            expect(system).property('components').to.equal(1 | 2);
            expect(system).property('selector').to.equal(SelectorType.Get);
            
            system = this.systemManager.getSystem(2);
            
            expect(system).to.be.an('object');
            expect(system.callback()).to.equal(2 | 4);
            expect(system).property('components').to.equal(2 | 4);
            expect(system).property('selector').to.equal(SelectorType.GetWith);
            
            system = this.systemManager.getSystem(3);
            
            expect(system).to.be.an('object');
            expect(system.callback()).to.equal(4 | 8);
            expect(system).property('components').to.equal(4 | 8);
            expect(system).property('selector').to.equal(SelectorType.GetWithOnly);
            
            system = this.systemManager.getSystem(4);
            
            expect(system).to.be.an('object');
            expect(system.callback()).to.equal(8 | 16);
            expect(system).property('components').to.equal(8 | 16);
            expect(system).property('selector').to.equal(SelectorType.GetWithout);
        });
        
        it('returns undefined on bad input', () => {
            expect(this.systemManager.getSystem()).to.be.undefined;
            expect(this.systemManager.getSystem(null)).to.be.undefined;
            expect(this.systemManager.getSystem('not a number')).to.be.undefined;
            expect(this.systemManager.getSystem(1.2)).to.be.undefined;
            expect(this.systemManager.getSystem({})).to.be.undefined;
            expect(this.systemManager.getSystem([])).to.be.undefined;
        });
    });
});