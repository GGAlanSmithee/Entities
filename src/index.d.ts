declare module 'gg-entities' {
    type EntityId = number
    type EntityIdArray = Array<EntityId>

    type ComponentKey = string
    type ComponentKeyArray = Array<ComponentKey>
    
    type ConfigurationKey = string

    type SystemKey = string
    type SystemCallback = (entities: IterableIterator<Entity>, opts: object) => void
    
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
    
        increaseCapacity(): void

        newEntity(components: ComponentKeyArray): Entity | null
        
        deleteEntity(id: EntityId): void
    
        getEntity(id: EntityId): Entity | null
    
        hasComponent(id: EntityId, component: ComponentKey): boolean
    
        iterateEntities(components?: ComponentKeyArray): IterableIterator<Entity>
    
        getEntitiesByIds(ids?: EntityIdArray): IterableIterator<Entity>
        
        registerConfiguration(key: ConfigurationKey): void
        
        // Component Manager
        
        registerComponent(key: ComponentKey, component: Component): void

        addComponent(entityId: EntityId, component: ComponentKey): void
        
        removeComponent(entityId: EntityId, component: ComponentKey): void
        
        // System Manager

        registerSystem(type: SystemType, key: SystemKey, components: ComponentKeyArray, callback: SystemCallback): void
        
        registerLogicSystem(key: SystemKey, components: ComponentKeyArray, callback: SystemCallback): void
        
        registerRenderSystem(key: SystemKey, components: ComponentKeyArray, callback: SystemCallback): void
        
        registerInitSystem(key: SystemKey, components: ComponentKeyArray, callback: SystemCallback): void
        
        removeSystem(key: SystemKey): boolean
        
        onLogic(opts?: object): void

        onRender(opts?: object): void

        onInit(opts?: object): void
        
        // Entity Factory
        
        registerInitializer(component: ComponentKey, initializer: any): void
        
        build(): this
        
        withComponent(component: ComponentKey, initializer?: any): this
        
        create(count?: number, configurationKey?: ConfigurationKey): EntityArray
        
        // Event Handler
        
        listen(event: string, callback: Function): number

        stopListen(eventId: EventId): boolean

        trigger(): Promise<any>

        triggerDelayed(): Promise<any>
    }
}