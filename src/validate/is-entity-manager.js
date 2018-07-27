const isEntityManagerMsg = (name = '', value = '') =>
    `${name} must be an instance of EntityManager. Got "${typeof value}".`.trim()

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
        message: isEntityManagerMsg(name, value),  
    }
}

export {
    isEntityManager,
    isEntityManagerMsg,
}
