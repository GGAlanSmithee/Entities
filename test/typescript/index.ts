import { SystemType, EntityManager } from 'gg-entities'

try {
    if (SystemType.Logic !== 0) throw 'SystemType.Logic !== 0'
    if (SystemType.Render !== 1) throw 'SystemType.Render !== 1'
    if (SystemType.Init !== 2) throw 'SystemType.Init !== 2'

    const entityManager = new EntityManager()
} catch (e) {
    console.error(`!!! Error !!! ${e}`)
}

