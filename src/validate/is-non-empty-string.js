const isNonEmptyStringMsg = (name = '', value = '') =>
    `"${name}" must be a non-empty string. Got "${value}".`.trim()

const isNonEmptyString = (value, name = undefined) => {
    const success = (
        value !== null &&
        value !== undefined &&
        typeof value === 'string' &&
        value !== ''
    )

    if (!name) {
        return success
    }

    return {
        success,
        message: isNonEmptyStringMsg(name, value)
    }
}

export { 
    isNonEmptyString,
    isNonEmptyStringMsg,
}