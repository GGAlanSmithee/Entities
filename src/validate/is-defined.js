const isDefinedMsg = (name = '', value = '') =>
    `"${name}" must be defined. Got "${value}".`.trim()

const isDefined = (value, name = undefined) => {
    const success = value !== null && value !== undefined

    if (!name) {
        return success
    }

    return {
        success,
        message: isDefinedMsg(name, value),  
    }
}

export { 
    isDefined,
    isDefinedMsg,
}