const isArrayMsg = (name = '') => `${name} must be an array.`.trim()

const isArray = (value, name = undefined) => {
    const success = Array.isArray(value)

    if (!name) {
        return success
    }

    return {
        success,
        message: isArrayMsg(name),  
    }
}

export { 
    isArray,
    isArrayMsg,
}