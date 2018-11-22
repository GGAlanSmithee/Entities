const isMapMsg = (name = '', value = '') =>
    `"${name}" must be a map. Got "${typeof value}".`.trim()

const isMap = (value, name = undefined) => {
    const success = value !== null && value !== undefined && value instanceof Map

    if (!name) {
        return success
    }

    return {
        success,
        message: isMapMsg(name, value),
    }
}

export { 
    isMap,
    isMapMsg,
}