import { expect } from 'chai';
import SystemManager, { SystemType } from '../../src/core/System';
import * as helpers from '../helpers';

describe('SystemManager', function() {
    describe('removeSystem(system, type)', () => {
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
            
            this.systemManager.maxRegisteredSystemId = 4;
        });
        
        afterEach(() => {
            delete this.systemManager;
        });

        it('is a function', () => {
            expect(this.systemManager.removeSystem).to.be.a('function');
        });
        
        it('removes a system', () => {
            expect(this.systemManager.maxRegisteredSystemId).to.equal(4);
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(4)).to.be.true;
            
            this.systemManager.removeSystem(1);
            
            expect(this.systemManager.maxRegisteredSystemId).to.equal(4);
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(4)).to.be.true;

            this.systemManager.removeSystem(2);
            
            expect(this.systemManager.maxRegisteredSystemId).to.equal(4);
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(4)).to.be.true;
            
            this.systemManager.removeSystem(3);
            
            expect(this.systemManager.maxRegisteredSystemId).to.equal(4);
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(4)).to.be.true;
            
            this.systemManager.removeSystem(4);
            
            expect(this.systemManager.maxRegisteredSystemId).to.equal(4);
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(4)).to.be.false;
        });
    });
});