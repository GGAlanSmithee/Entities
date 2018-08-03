import { expect }  from 'chai'
import sinon       from 'sinon'
import { promise } from '../../src/util/promise'

class TestContext {

}

describe('util', function() {
    describe('promise',  () => {
        test('is a function',  () => {
            expect(promise).to.be.a('function')
        })

        test('invokes [callback] on [context] with [params]', () => {
            const params = [
                'hello',
                [ 1, 2, 3 ],
                { a : 'A' },
            ]

            const context = new TestContext()

            const callback = sinon.spy()
            
            return promise(callback, context, params)
                .then((res) => {
                    expect(res).to.be.undefined

                    expect(callback.calledOnce).to.be.true
                    expect(callback.calledOn(context)).to.be.true
                    expect(callback.calledWith(...params)).to.be.true
                })
        })

        test('invokes [callback] on [context] with [params] after [timeout]', () => {
            const params = [
                'hello',
                [ 1, 2, 3 ],
                { a : 'A' },
            ]

            const context = new TestContext()

            const callback = sinon.spy()
            
            const t0 = new Date().valueOf()

            return promise(callback, context, params, 1000)
                .then((res) => {
                    const t1 = new Date().valueOf()

                    expect(res).to.be.undefined

                    expect(callback.calledOnce).to.be.true
                    expect(callback.calledOn(context)).to.be.true
                    expect(callback.calledWith(...params)).to.be.true

                    expect(t1-t0).to.not.be.lessThan(1000)
                })
        }, 2000)
    })
})