import { expect }    from 'chai';
import SystemManager from '../../src/core/System';

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
        
        it('can be used to instantiate a new World', () => {
            expect(this.systemManager).to.be.an.instanceof(SystemManager);
        });
        
        it('instatiates an empty array of init systems', () => {
            expect(this.systemManager).to.have.property('initSystems');
            expect(this.systemManager).property('initSystems').to.be.an.instanceof(Array);
            expect(this.systemManager).property('initSystems').property('length').to.equal(0);
        });
        
        it('instatiates an empty array of logic systems', () => {
            expect(this.systemManager).to.have.property('logicSystems');
            expect(this.systemManager).property('logicSystems').to.be.an.instanceof(Array);
            expect(this.systemManager).property('logicSystems').property('length').to.equal(0);
        });
        
        it('instatiates an empty array of render systems', () => {
            expect(this.systemManager).to.have.property('renderSystems');
            expect(this.systemManager).property('renderSystems').to.be.an.instanceof(Array);
            expect(this.systemManager).property('renderSystems').property('length').to.equal(0);
        });
        
        it('instatiates an empty array of clean up systems', () => {
            expect(this.systemManager).to.have.property('cleanUpSystems');
            expect(this.systemManager).property('cleanUpSystems').to.be.an.instanceof(Array);
            expect(this.systemManager).property('cleanUpSystems').property('length').to.equal(0);
        });
    });
});