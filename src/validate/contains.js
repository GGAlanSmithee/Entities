const containsMsg = (key = '', mapName = '') =>
    `"${mapName}" does not contain "${key}".`.trim()

const contains = (map, key, mapName) => {
    const success = map !== null && map !== undefined && map.has(key)

    if (!mapName) {
        return success
    }

    return {
        success,
        message: containsMsg(key, mapName),
    }
}

export { 
    contains,
    containsMsg,
}
