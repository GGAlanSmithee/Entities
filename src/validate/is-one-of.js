const isOneOfMsg = (values = '', name = '', value = '') =>
    `"${name}" must be one of ${values}. Got "${value}".`.trim()

const isOneOf = (Type, value, name = undefined) => {
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