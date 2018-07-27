const doesNotContainMsg = (key = '', mapName = '') =>
    `"${mapName}" already contains "${key}".`.trim()

const doesNotContain = (map, key, mapName) => {
    const success = map !== null && map !== undefined && !map.has(key)

    if (!mapName) {
        return success
    }

    return {
        success,
        message: doesNotContainMsg(key, mapName),
    }
}

export { 
    doesNotContain,
    doesNotContainMsg,
}
