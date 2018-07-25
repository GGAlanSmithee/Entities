const isDefinedMsg = (name = '') => `${name} must be defined.`.trim()

const isDefined = (value, name = undefined) => {
    const success = value !== null && value !== undefined

    if (!name) {
        return success
    }

    return {
        success,
        message: isDefinedMsg(name),  
    }
}

export { 
    isDefined,
    isDefinedMsg,
}