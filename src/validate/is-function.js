const isFunctionMsg = (name = '') => `${name} must be a function.`.trim()

const isFunction = (value, name = undefined) => {
    const success = typeof value === 'function'

    if (!name) {
        return success
    }

    return {
        success,
        message: isFunctionMsg(name),  
    }
}

export { 
    isFunction,
    isFunctionMsg,
}