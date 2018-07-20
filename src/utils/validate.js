const validateKey = (key) => {
    if (key === null || key === undefined || typeof key !== 'string' || key === '') {
        throw TypeError('key must be a non-empty string.')
    }
}

export { validateKey, }