import { expect } from 'chai';
import   SystemManager, { SystemType } from '../../src/core/System';

describe('SystemManager', function() {
    describe('constructor()', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager();
        });
        
        afterEach(() => {
            delete this.systemManager;
        });
        
        it('is a function', () => {
            expect(SystemManager).to.be.a('function');
        });
        
        it('can be used to instantiate a new SystemManager', () => {
            expect(this.systemManager).to.be.an.instanceof(SystemManager);
        });
        
        it('instatiates a [logicSystems] and a [renderSystems] map', () => {
            expect(this.systemManager).to.have.property('logicSystems');
            expect(this.systemManager).property('logicSystems').to.be.an.instanceof(Map);
            expect(this.systemManager).property('logicSystems').property('size').to.equal(0);
            
            expect(this.systemManager).to.have.property('renderSystems');
            expect(this.systemManager).property('renderSystems').to.be.an.instanceof(Map);
            expect(this.systemManager).property('renderSystems').property('size').to.equal(0);
        });
    });
});