const isPositiveIntegerMsg = (name = '', value = '') =>
    `${name} must be a positive integer. Got "${value}".`.trim()

const isPositiveInteger = (value, name = undefined) => {
    const success = Number.isInteger(value) && value >= 0

    if (!name) {
        return success
    }

    return {
        success,
        message: isPositiveIntegerMsg(name, value)
    }
}

export { 
    isPositiveInteger,
    isPositiveIntegerMsg,
}