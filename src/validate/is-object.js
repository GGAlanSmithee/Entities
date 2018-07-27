const isObjectMsg = (name = '', value = '') =>
    `${name} must be an object. Got "${typeof value}".`.trim()

const isObject = (value, name = undefined) => {
    const success = typeof value === 'object'

    if (!name) {
        return success
    }

    return {
        success,
        message: isObjectMsg(name, value),  
    }
}

export { 
    isObject,
    isObjectMsg,
}