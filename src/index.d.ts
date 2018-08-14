declare module 'gg-entities' {
    type EntityId = number
    type EntityIdArray = Array<EntityId>

    type ComponentKey = string
    type ComponentKeyArray = Array<ComponentKey>
    
    type ConfigurationKey = string

    type SystemKey = string

    type EventId = number

    type Component = any

    type Entity = {
        id: EntityId
        components: ComponentKeyArray
        [Key: string]: Component
    }

    type EntityArray = Array<Entity>
    
    enum SystemType {
        Logic  = 0,
        Render = 1,
        Init   = 2,
    }
    
    export class EntityManager {
        constructor(capacity?: number)
    
        capacity: number
        entities: EntityArray
    
        increaseCapacity()

        newEntity(components: ComponentKeyArray) : Entity | null
        
        deleteEntity(id: EntityId)
    
        getEntity(id: EntityId) : Entity | null
    
        hasComponent(id: EntityId, component: ComponentKey) : boolean
    
        iterateEntities(components?: ComponentKeyArray) : Iterator<any>
    
        getEntitiesByIds(ids?: EntityIdArray) : Iterator<any>
        
        registerConfiguration(key: ConfigurationKey): {} // todo - return type
        
        // Component Manager
        
        registerComponent(key: ComponentKey, component: Component)

        addComponent(entityId: EntityId, component: ComponentKey)
        
        removeComponent(entityId: EntityId, component: ComponentKey)
        
        // System Manager

        registerSystem(type: SystemType, key: SystemKey, components: ComponentKeyArray, callback: Function)
        
        registerLogicSystem(key: SystemKey, components: ComponentKeyArray, callback: Function)
        
        registerRenderSystem(key: SystemKey, components: ComponentKeyArray, callback: Function)
        
        registerInitSystem(key: SystemKey, components: ComponentKeyArray, callback: Function)
        
        removeSystem(key: SystemKey) : boolean
        
        onLogic(opts: any)

        onRender(opts: any)

        onInit(opts: any)
        
        // Entity Factory
        
        registerInitializer(component: ComponentKey, initializer: any)
        
        build() : this
        
        withComponent(component: ComponentKey, initializer?: any) : this
        
        create(count?: number, configurationKey?: ConfigurationKey): EntityArray
        
        // Event Handler
        
        listen(event: string, callback: Function): number

        stopListen(eventId: EventId): boolean

        trigger(): Promise<any>

        triggerDelayed(): Promise<any>
    }
}