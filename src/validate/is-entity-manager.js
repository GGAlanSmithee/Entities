const isEntityManagerMsg = (name) => `${name} must be an instance of EntityManager.`.trim()

const isEntityManager = (value, name = undefined) => {
    const success = (
        value &&
        value.constructor &&
        value.constructor.name === 'EntityManager'
    )

    if (!name) {
        return success
    }
    
    return {
        success,
        message: isEntityManagerMsg(name),  
    }
}

export {
    isEntityManager,
    isEntityManagerMsg,
}
