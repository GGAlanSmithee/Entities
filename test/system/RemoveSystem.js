import { expect } from 'chai';
import SystemManager, { SystemType } from '../../src/core/System';
import * as helpers from '../helpers';

describe('SystemManager', function() {
    describe('removeSystem(type, system)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager();
            this.systemOne = 1;
            this.systemTwo = 2;
            this.systemThree = 3;
            this.systemFour = 4;
            
            helpers.registerSystem(this.systemManager, 1);
            helpers.registerSystem(this.systemManager, 2);
            helpers.registerSystem(this.systemManager, 3);
            helpers.registerSystem(this.systemManager, 4);
        });
        
        afterEach(() => {
            delete this.systemManager;
        });

        it('is a function', () => {
            expect(this.systemManager.removeSystem).to.be.a('function');
        });
        
        it('removes a system', () => {
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(4)).to.be.true;
            
            this.systemManager.removeSystem(1);
            
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(4)).to.be.true;

            this.systemManager.removeSystem(2);
            
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(4)).to.be.true;
            
            this.systemManager.removeSystem(3);
            
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(4)).to.be.true;
            
            this.systemManager.removeSystem(4);
            
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(4)).to.be.false;
        });
        
        it('returns true when a system is removed', () => {
            expect(this.systemManager.removeSystem(1)).to.be.true;
        });
        
        it('returns false when a system is not removed (not found)', () => {
            expect(this.systemManager.removeSystem(99)).to.be.false;
        });
        
        it('returns false on bad input', () => {
            expect(this.systemManager.removeSystem()).to.be.false;
            expect(this.systemManager.removeSystem(null)).to.be.false;
            expect(this.systemManager.removeSystem('not a number')).to.be.false;
            expect(this.systemManager.removeSystem(1.2)).to.be.false;
            expect(this.systemManager.removeSystem({})).to.be.false;
            expect(this.systemManager.removeSystem([])).to.be.false;
        });
    });
});