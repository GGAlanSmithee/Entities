// naively only works on scalars
const containsAll = (arr1, arr2) => arr2.every(e => arr1.includes(e))

export { containsAll, }