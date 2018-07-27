const alreadyContainsMsg = (key = '', mapName = '') =>
    `"${mapName}" already contains "${key}".`.trim()

const alreadyContains = (map, key, mapName) => {
    const success = !map.has(key)

    if (!mapName) {
        return success
    }

    return {
        success,
        message: alreadyContainsMsg(key, mapName),
    }
}

export { 
    alreadyContains,
    alreadyContainsMsg,
}