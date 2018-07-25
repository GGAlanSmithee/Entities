const isObjectMsg = (name = '') => `${name} must be an object.`.trim()

const isObject = (value, name = undefined) => {
    const success = typeof value === 'object'

    if (!name) {
        return success
    }

    return {
        success,
        message: isObjectMsg(name),  
    }
}

export { 
    isObject,
    isObjectMsg,
}