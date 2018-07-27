import { expect }      from 'chai'
import { containsAll } from '../../src/util/contains-all'

describe('util', function() {
    describe('containsAll(arr1, arr2)', () => {
        test('is a function', () => {
            expect(containsAll).to.be.a('function')
        })

        test('returns true if [arr1] contains all elements of [arr2]', () => {
            const arr1 = [1, 2, 3, 6, 435, 1, 23]
            const arr2 = [6, 435]
            const arr3 = [23, 2]
            const arr4 = [1, 2, 435, 23, 3, 2, 6, 1]
            const arr5 = [3]
            const arr6 = [23, 23, 23, 23, 3, 3]

            expect(containsAll(arr1, arr2)).to.be.true
            expect(containsAll(arr1, arr3)).to.be.true
            expect(containsAll(arr1, arr4)).to.be.true
            expect(containsAll(arr1, arr5)).to.be.true
            expect(containsAll(arr1, arr6)).to.be.true
        })

        test('returns false if [arr1] doesn´t contain all elements of [arr2]', () => {
            const arr1 = [1, 2, 3, 6, 435, 1, 23]
            const arr2 = [1, 2, 3, 6, 435, 1, 23, 4]
            const arr3 = [23, 2, 0]
            const arr4 = [1, 2, 435, 23, 3, 5, 2, 6, 1]
            const arr5 = [4]
            const arr6 = [23, 23, 23, 23, 3, 3, 7]
            const arr7 = [1, 2, 3, 6, 435, 1, 23, '']

            expect(containsAll(arr1, arr2)).to.be.false
            expect(containsAll(arr1, arr3)).to.be.false
            expect(containsAll(arr1, arr4)).to.be.false
            expect(containsAll(arr1, arr5)).to.be.false
            expect(containsAll(arr1, arr6)).to.be.false
            expect(containsAll(arr1, arr7)).to.be.false
        })
    })
})