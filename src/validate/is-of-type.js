const isOfTypeMsg = (values = '', name = '', value = '') => `${name} must be one of ${values}. Got ${value}.`.trim()

const isOfType = (Type, value, name = undefined) => {
    const values = Object.keys(Type).map(k => Type[k])
    const success = values.includes(value)

    if (!name) {
        return success
    }

    return {
        success,
        message: isOfTypeMsg(values.join(', '), name, value),
    }
}

export { 
    isOfType,
    isOfTypeMsg,
}