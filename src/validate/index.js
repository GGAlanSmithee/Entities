const validate = (...validations) => {
    return {
        success: (validations).every(v => v.success === true),
        message: (validations)
            .filter(v => v.success === false)
            .map(v => v.message)
            .join('\n'),
    }
}

const validateAndThrow = (error, ...validations) => {
    const { success, message } = validate(...validations)

    if (!success) {
        throw error(message)
    }
}

export { 
    validate,
    validateAndThrow,
}