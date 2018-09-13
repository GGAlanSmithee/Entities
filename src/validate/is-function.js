const isFunctionMsg = (name = '', value = '') =>
    `"${name}" must be a function. Got "${typeof value}".`.trim()

const isFunction = (value, name = undefined) => {
    const success = typeof value === 'function'

    if (!name) {
        return success
    }

    return {
        success,
        message: isFunctionMsg(name, value),  
    }
}

export { 
    isFunction,
    isFunctionMsg,
}