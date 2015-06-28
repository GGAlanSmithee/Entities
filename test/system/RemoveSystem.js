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
        
        it('removes a system by [type]', () => {
            helpers.registerSystem(this.systemManager, 5, 1, () => { }, SystemType.Logic);
            helpers.registerSystem(this.systemManager, 6, 1, () => { }, SystemType.Render);
            helpers.registerSystem(this.systemManager, 7, 1, () => { }, SystemType.CleanUp);
            helpers.registerSystem(this.systemManager, 8, 1, () => { }, SystemType.Init);
            this.systemManager.maxRegisteredSystemId = 8;
            
            expect(this.systemManager.maxRegisteredSystemId).to.equal(8);
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(4)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Logic).has(5)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Render).has(6)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.CleanUp).has(7)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(8)).to.be.true;
            
            this.systemManager.removeSystem(1, SystemType.Init);
            
            expect(this.systemManager.systems.get(SystemType.Init).has(1)).to.be.false;
            
            this.systemManager.removeSystem(2, SystemType.Init);
            
            expect(this.systemManager.systems.get(SystemType.Init).has(2)).to.be.false;
            
            this.systemManager.removeSystem(3, SystemType.Logic);
            
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Logic).has(3)).to.be.false;
            
            this.systemManager.removeSystem(5, SystemType.Init);
            
            expect(this.systemManager.systems.get(SystemType.Init).has(5)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Logic).has(5)).to.be.true;
            
            this.systemManager.removeSystem(3, SystemType.Init);
            
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Logic).has(3)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(5)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Logic).has(5)).to.be.true;
            
            this.systemManager.removeSystem(5, SystemType.Logic);
            
            expect(this.systemManager.systems.get(SystemType.Init).has(3)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Logic).has(3)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Init).has(5)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.Logic).has(5)).to.be.false;
            
            this.systemManager.removeSystem(6, SystemType.Init);
            this.systemManager.removeSystem(7, SystemType.Init);
            this.systemManager.removeSystem(8, SystemType.Init);
            
            expect(this.systemManager.systems.get(SystemType.Render).has(6)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.CleanUp).has(7)).to.be.true;
            expect(this.systemManager.systems.get(SystemType.Init).has(8)).to.be.false;
            
            this.systemManager.removeSystem(6, SystemType.Render);
            this.systemManager.removeSystem(7, SystemType.CleanUp);
            
            expect(this.systemManager.systems.get(SystemType.Render).has(6)).to.be.false;
            expect(this.systemManager.systems.get(SystemType.CleanUp).has(7)).to.be.false;
        });
        
        it('returns true when a system is removed by [type]', () => {
            expect(this.systemManager.removeSystem(1, SystemType.Init)).to.be.true;
        });
        
        it('returns false when a system is not removed by [type] (not found)', () => {
            helpers.registerSystem(this.systemManager, 5, 1, () => { }, SystemType.Logic);
            
            expect(this.systemManager.removeSystem(1, SystemType.Logic)).to.be.false;
            expect(this.systemManager.removeSystem(5, SystemType.Init)).to.be.false;
        });
        
        it('returns false on bad input with [type]', () => {
            expect(this.systemManager.removeSystem(undefined, SystemType.Init)).to.be.false;
            expect(this.systemManager.removeSystem(null, SystemType.CleanUp)).to.be.false;
            expect(this.systemManager.removeSystem('not a number', SystemType.Render)).to.be.false;
            expect(this.systemManager.removeSystem(1.2, SystemType.Logic)).to.be.false;
            expect(this.systemManager.removeSystem({}, SystemType.Init)).to.be.false;
            expect(this.systemManager.removeSystem([], SystemType.Init)).to.be.false;
        });
    });
});