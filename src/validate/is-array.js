const isArrayMsg = (name = '', value = '') =>
    `"${name}" must be an array. Got "${typeof value}".`.trim()

const isArray = (value, name = undefined) => {
    const success = Array.isArray(value)

    if (!name) {
        return success
    }

    return {
        success,
        message: isArrayMsg(name, value),
    }
}

export { 
    isArray,
    isArrayMsg,
}