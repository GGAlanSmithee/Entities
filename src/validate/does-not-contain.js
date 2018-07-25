const doesNotContain = (map, key, message) => {
    const success = map.has(key)

    if (!message) {
        return success
    }

    return {
        success,
        message,
    }
}

export { 
    doesNotContain,
}