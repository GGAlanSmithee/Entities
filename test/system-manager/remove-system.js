import { expect }                    from 'chai';
import SystemManager, { SystemType } from '../../src/core/system-manager';

describe('SystemManager', function() {
    describe('removeSystem(type, system)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager();
            
            this.init = 'init';
            this.initSystem = (entities, { delta }) => { };
            
            this.movement = 'movement';
            this.movementSystem = (entities, { delta }) => { };
            
            this.render = 'render';
            this.renderSystem = (entities, { delta }) => { };
            
            this.systemManager.initSystems.set(this.init, this.initSystems);
            this.systemManager.renderSystems.set(this.render, this.renderSystems);
            this.systemManager.logicSystems.set(this.movement, this.movementSystem);
        });
        
        afterEach(() => {
            delete this.systemManager;
        });

        it('is a function', () => {
            expect(this.systemManager.removeSystem).to.be.a('function');
        });
        
        it('removes a system', () => {
            expect(this.systemManager.initSystems.has(this.init)).to.be.true;
            expect(this.systemManager.renderSystems.has(this.render)).to.be.true;
            expect(this.systemManager.logicSystems.has(this.movement)).to.be.true;
            
            this.systemManager.removeSystem(this.render);
            
            expect(this.systemManager.initSystems.has(this.init)).to.be.true;
            expect(this.systemManager.renderSystems.has(this.render)).to.be.false;
            expect(this.systemManager.logicSystems.has(this.movement)).to.be.true;
            
            this.systemManager.removeSystem(this.movement);
            
            expect(this.systemManager.initSystems.has(this.init)).to.be.true;
            expect(this.systemManager.renderSystems.has(this.render)).to.be.false;
            expect(this.systemManager.logicSystems.has(this.movement)).to.be.false;
            
            this.systemManager.removeSystem(this.render);
            
            expect(this.systemManager.initSystems.has(this.init)).to.be.true;
            expect(this.systemManager.renderSystems.has(this.render)).to.be.false;
            expect(this.systemManager.logicSystems.has(this.movement)).to.be.false;
            
            this.systemManager.removeSystem(this.init);
            
            expect(this.systemManager.initSystems.has(this.init)).to.be.false;
            expect(this.systemManager.renderSystems.has(this.render)).to.be.false;
            expect(this.systemManager.logicSystems.has(this.movement)).to.be.false;
        });
        
        it('returns true when a system is removed', () => {
            expect(this.systemManager.removeSystem(this.movement)).to.be.true;
        });
        
        it('returns false when a system is not removed (not registered)', () => {
            expect(this.systemManager.removeSystem('not a registered system')).to.be.false;
        });
        
        it('returns false on bad input', () => {
            expect(this.systemManager.removeSystem(1)).to.be.false;
            expect(this.systemManager.removeSystem(null)).to.be.false;
            expect(this.systemManager.removeSystem([])).to.be.false;
            expect(this.systemManager.removeSystem(1.2)).to.be.false;
            expect(this.systemManager.removeSystem({})).to.be.false;
            expect(this.systemManager.removeSystem(undefined)).to.be.false;
            expect(this.systemManager.removeSystem()).to.be.false;
        });
    });
});