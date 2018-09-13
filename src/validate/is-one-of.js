const isOneOfMsg = (values = '', name = '', value = '') =>
    `"${name}" must be one of ${values}. Got "${value}".`.trim()

const isOneOf = (Type, value, name = undefined) => {
    if (Type === null || Type === undefined) {
        if (!name) {
            return false
        }
    
        return {
            success: false,
            message: isOneOfMsg(values, name, value),
        }
    }

    const values = Object.keys(Type).map(k => Type[k])
    const success = values.includes(value)

    if (!name) {
        return success
    }

    return {
        success,
        message: isOneOfMsg(values.join(', '), name, value),
    }
}

export { 
    isOneOf,
    isOneOfMsg,
}