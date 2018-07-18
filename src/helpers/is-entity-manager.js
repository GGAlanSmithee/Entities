const isEntityManager = (entityManager) => {
    if (!entityManager) {
        return false
    }

    if (!entityManager.constructor) {
        return false
    }

    return entityManager.constructor.name === 'EntityManager'
}

export { isEntityManager, }