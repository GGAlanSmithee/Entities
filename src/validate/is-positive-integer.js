const isPositiveIntegerMsg = (name) => `${name} must be a positive integer.`.trim()

const isPositiveInteger = (value, name = undefined) => {
    const success = Number.isInteger(value) && value >= 0

    if (!name) {
        return success
    }

    return {
        success,
        message: isPositiveIntegerMsg(name)
    }
}

export { 
    isPositiveInteger,
    isPositiveIntegerMsg,
}