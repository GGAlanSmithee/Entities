declare module 'gg-entities' {
    export type EntityId = number
    export type EntityIdArray = Array<EntityId>
    export type Entity = {
        id: EntityId,
        components: ComponentKeyArray,
        [Key: string]: Component
    }
    export type EntityArray = Array<Entity>

    export type Component = any
    export type ComponentKey = string
    export type ComponentKeyArray = Array<ComponentKey>

    export type ConfigurationKey = string
    export type Initializer = number | string | object | Function
    export type Configuration = Map<string, Initializer>
    
    export type EventId = number
    export type EventKey = string
    export type EventCallback = (this: EntityManager, obj?: object) => void

    export enum SystemType {
        Logic  = 0,
        Render = 1,
        Init   = 2,
    }
    export type SystemKey = string
    export type SystemCallback = (entities: IterableIterator<Entity>, opts: object) => void
    
    export class EntityManager {
        constructor(capacity?: number)
    
        capacity: number
        entities: EntityArray
        entityConfigurations: Map<ConfigurationKey, Configuration>
    
        increaseCapacity(): void

        newEntity(components: ComponentKeyArray, data?: object): Entity | null
        
        deleteEntity(id: EntityId): void
    
        getEntity(id: EntityId): Entity | null
    
        hasComponent(id: EntityId, component: ComponentKey): boolean
    
        getEntitiesByComponents(components?: ComponentKeyArray): IterableIterator<Entity>
    
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
        
        registerInitializer(component: ComponentKey, initializer: Initializer): void
        
        build(): this
        
        withComponent(component: ComponentKey, initializer?: Initializer): this

        withData(data: object): this
        
        create(count?: number, configurationKey?: ConfigurationKey): EntityArray
        
        // Event Handler

        listen(event: EventKey, callback: EventCallback): number

        stopListen(eventId: EventId): boolean

        trigger(event: EventKey, opts?: object): Promise<any>
        
        triggerDelayed(event: EventKey, timeout: number, opts?: object): Promise<any>
    }
}