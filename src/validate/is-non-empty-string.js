const isNonEmptyStringMsg = (name) => `${name} must be a non-empty string.`.trim()

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
        message: isNonEmptyStringMsg(name)
    }
}

export { 
    isNonEmptyString,
    isNonEmptyStringMsg,
}