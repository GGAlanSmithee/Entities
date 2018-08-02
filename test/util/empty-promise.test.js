// todo add tests for all util functions

import { expect } from 'chai'
import { emptyPromise } from '../../src/util/promise'

describe('util', function() {
    describe('empty-promise',  () => {
        test('is a function',  () => {
            expect(emptyPromise).to.be.a('function')
        })

        test('resolves an empty promise', () => 
            emptyPromise()
                .then((res) => {
                    expect(res).to.be.undefined
                }))
    })
})