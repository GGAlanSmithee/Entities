(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define('GGEntities', ['exports'], factory) :
	(factory((global.GGEntities = global.GGEntities || {})));
}(this, (function (exports) { 'use strict';

class EntityFactory {
    constructor() {
        this.init();
    }

    init() {
        this.initializers = new Map();
        this.configuration = new Map();
    }

    registerInitializer(id, initializer) {
        if (!Number.isInteger(id) || id <= 0) {
            throw TypeError('id must be a posetive integer.');
        }

        if (typeof initializer !== 'function') {
            throw TypeError('initializer must be a function.');
        }

        this.initializers.set(id, initializer);
    }

    build() {
        this.configuration = new Map();

        return this;
    }

    withComponent(componentId, initializer) {
        if (!Number.isInteger(componentId) || componentId <= 0) {
            return this;
        }

        if (typeof initializer !== 'function') {
            initializer = this.initializers.get(componentId);
        }

        this.configuration.set(componentId, initializer);

        return this;
    }

    createConfiguration() {
        return this.configuration;
    }

    create(entityManager, count = 1, configuration = undefined) {
        if (!(entityManager instanceof EntityManager)) {
            return [];
        }

        if (configuration == null) {
            configuration = this.configuration;
        }

        const components = Array.from(configuration.keys()).reduce((curr, next) => curr |= next, 0);

        let entities = [];

        for (let i = 0; i < count; ++i) {
            let { id, entity } = entityManager.newEntity(components);

            if (id >= entityManager.capacity) {
                break;
            }

            for (let [component, initializer] of configuration) {
                if (typeof initializer !== 'function') {
                    continue;
                }

                let result = initializer.call(entity[component]);

                if (typeof entity[component] !== 'object' && result !== undefined) {
                    entity[component] = result;
                }
            }

            entities.push({ id, entity });
        }

        return entities.length === 1 ? entities[0] : entities;
    }
}

class ComponentManager {
    constructor() {
        this.init();
    }

    init() {
        this.components = new Map();
    }

    newComponent(componentId) {
        let component = this.components.get(componentId);

        if (component === null || component === undefined) {
            return null;
        }

        switch (typeof component) {
            case 'function':
                return new component();
            case 'object':
                {
                    return (component => {
                        let ret = {};

                        Object.keys(component).forEach(key => ret[key] = component[key]);

                        return ret;
                    })(component);
                }
            default:
                return component;
        }
    }

    registerComponent(component) {
        if (component === null || component === undefined) {
            throw TypeError('component cannot be null or undefined.');
        }

        const max = Math.max(...this.components.keys());

        const id = max === null || max === undefined || max === -Infinity || max === 0 ? 1 : max * 2;

        this.components.set(id, component);

        return id;
    }

    getComponents() {
        return this.components;
    }
}

const SystemType = {
    Logic: 0,
    Render: 1,
    Init: 2
};

class SystemManager {
    constructor() {
        this.init();
    }

    init() {
        this.logicSystems = new Map();
        this.renderSystems = new Map();
        this.initSystems = new Map();
    }

    addEntity(entityId, entityComponents) {
        if (!Number.isInteger(entityId) || entityId < 0) {
            return;
        }

        if (!Number.isInteger(entityComponents) || entityComponents < 0) {
            return;
        }

        for (const _ref of this.logicSystems.values()) {
            const { components, entities } = _ref;

            if ((entityComponents & components) === components) {
                if (!entities.some(e => e === entityId)) {
                    entities.push(entityId);
                }
            }
        }

        for (const _ref2 of this.renderSystems.values()) {
            const { components, entities } = _ref2;

            if ((entityComponents & components) === components) {
                if (!entities.some(e => e === entityId)) {
                    entities.push(entityId);
                }
            }
        }

        for (const _ref3 of this.initSystems.values()) {
            const { components, entities } = _ref3;

            if ((entityComponents & components) === components) {
                if (!entities.some(e => e === entityId)) {
                    entities.push(entityId);
                }
            }
        }
    }

    removeEntity(entityId) {
        if (!Number.isInteger(entityId) || entityId < 0) {
            return;
        }

        for (let system of this.logicSystems.values()) {
            if (system.entities.some(e => e === entityId)) {
                system.entities = system.entities.filter(e => e !== entityId);
            }
        }

        for (let system of this.renderSystems.values()) {
            if (system.entities.some(e => e === entityId)) {
                system.entities = system.entities.filter(e => e !== entityId);
            }
        }

        for (let system of this.initSystems.values()) {
            if (system.entities.some(e => e === entityId)) {
                system.entities = system.entities.filter(e => e !== entityId);
            }
        }
    }

    registerSystem(type, components, entities, callback) {
        if (type !== SystemType.Logic && type !== SystemType.Render && type !== SystemType.Init) {
            throw TypeError('type must be a valid SystemType.');
        }

        if (typeof components !== 'number') {
            throw TypeError('components must be a number.');
        }

        if (!Array.isArray(entities)) {
            throw TypeError('entities must be an array.');
        }

        if (typeof callback !== 'function') {
            throw TypeError('callback must be a function.');
        }

        const system = {
            components,
            entities,
            callback
        };

        const systemId = Math.max(0, ...this.logicSystems.keys(), ...this.renderSystems.keys(), ...this.initSystems.keys()) + 1;

        switch (type) {
            case SystemType.Logic:
                this.logicSystems.set(systemId, system);break;
            case SystemType.Render:
                this.renderSystems.set(systemId, system);break;
            case SystemType.Init:
                this.initSystems.set(systemId, system);break;
        }

        return systemId;
    }

    removeSystem(systemId) {
        return this.logicSystems.delete(systemId) || this.renderSystems.delete(systemId) || this.initSystems.delete(systemId);
    }
}

const emptyPromise = () => Promise.resolve();

const promise = (callback, context, args, timeout) => {
    if (timeout) {
        return new Promise(resolve => {
            setTimeout(function () {
                resolve(callback.call(context, ...args));
            }, timeout);
        });
    }

    return Promise.resolve(callback.call(context, ...args));
};

class EventHandler {
    constructor() {
        this.init();
    }

    init() {
        this.events = new Map();
    }

    listen(event, callback) {
        if (typeof event !== 'string' || typeof callback !== 'function') {
            return;
        }

        if (!this.events.has(event)) {
            this.events.set(event, new Map());
        }

        let eventId = -1;

        this.events.forEach(event => {
            eventId = Math.max(eventId, ...event.keys());
        });

        ++eventId;

        this.events.get(event).set(eventId, callback);

        return eventId;
    }

    stopListen(eventId) {
        for (let events of this.events.values()) {
            for (let id of events.keys()) {
                if (id === eventId) {
                    return events.delete(eventId);
                }
            }
        }

        return false;
    }

    trigger() {
        let self = this instanceof EntityManager ? this.eventHandler : this;

        let args = Array.from(arguments);

        let [event] = args.splice(0, 1);

        if (typeof event !== 'string' || !self.events.has(event)) {
            return emptyPromise();
        }

        let promises = [];

        for (let callback of self.events.get(event).values()) {
            promises.push(promise(callback, this, args));
        }

        return Promise.all(promises);
    }

    triggerDelayed() {
        let self = this instanceof EntityManager ? this.eventHandler : this;

        let args = Array.from(arguments);

        let [event, timeout] = args.splice(0, 2);

        if (typeof event !== 'string' || !Number.isInteger(timeout) || !self.events.has(event)) {
            return emptyPromise();
        }

        let promises = [];

        for (let callback of self.events.get(event).values()) {
            promises.push(promise(callback, this, args, timeout));
        }

        return Promise.all(promises);
    }
}

class EntityManager {
    constructor(capacity = 1000) {
        this.init(capacity);
    }

    init(capacity) {
        this.capacity = capacity;
        this.currentMaxEntity = -1;

        this.entityFactory = new EntityFactory();
        this.systemManager = new SystemManager();
        this.componentManager = new ComponentManager();
        this.eventHandler = new EventHandler();

        this.entityConfigurations = new Map();
        this.componentLookup = new Map();

        this.entities = Array.from({ length: this.capacity }, () => ({ components: 0 }));
    }

    _componentNamesToId(components) {
        return Array.from(this.componentLookup).filter(cl => components.some(c => c === cl[0])).map(cl => cl[1]).reduce((curr, next) => curr | next, 0);
    }

    increaseCapacity() {
        let oldCapacity = this.capacity;

        this.capacity *= 2;

        this.entities = [...this.entities, ...Array.from({ length: oldCapacity }, () => ({ components: 0 }))];

        for (let i = oldCapacity; i < this.capacity; ++i) {
            let entity = this.entities[i];

            for (const componentId of this.componentManager.getComponents().keys()) {
                let componentName = null;

                for (let [key, value] of this.componentLookup.entries()) {
                    if (value === componentId) {
                        componentName = key;

                        break;
                    }
                }

                entity[componentId] = this.componentManager.newComponent(componentId);

                Object.defineProperty(entity, componentName, { get() {
                        return this[componentId];
                    }, configurable: true });
            }
        }
    }

    newEntity(components) {
        if (Array.isArray(components)) {
            components = this._componentNamesToId(components);
        }

        if (!Number.isInteger(components) || components <= 0) {
            return { id: this.capacity, entity: null };
        }

        let id = 0;

        //todo if re-using an old entity, should we reset components?
        for (; id < this.capacity; ++id) {
            if (this.entities[id].components === 0) {
                break;
            }
        }

        if (id >= this.capacity) {
            // todo: auto increase capacity?
            return { id: this.capacity, entity: null };
        }

        if (id > this.currentMaxEntity) {
            this.currentMaxEntity = id;
        }

        this.entities[id].components = components;

        this.systemManager.addEntity(id, components);

        return { id, entity: this.entities[id] };
    }

    deleteEntity(id) {
        // todo add sanity check

        this.systemManager.removeEntity(id);

        this.entities[id].components = 0;

        if (id < this.currentMaxEntity) {
            return;
        }

        for (let i = id; i >= 0; --i) {
            if (this.entities[i].components !== 0) {
                this.currentMaxEntity = i;

                return;
            }
        }

        this.currentMaxEntity = 0;
    }

    getEntity(id) {
        if (!Number.isInteger(id) || id < 0) {
            return undefined;
        }

        return this.entities[id];
    }

    hasComponent(id, component) {
        if (typeof component === 'string') {
            component = this._componentNamesToId([component]);
        }

        if (!Number.isInteger(component) || component <= 0) {
            return false;
        }

        const entity = this.getEntity(id);

        if (!entity) {
            return false;
        }

        return (entity.components & component) === component;
    }

    // Does not allow components to be anything other than a bitmask for performance reasons
    // This method will be called for every system for every loop (which might be as high as 60 / second)
    *iterateEntities(components = 0) {
        for (let id = 0; id <= this.currentMaxEntity; ++id) {
            if (components === 0 || (this.entities[id].components & components) === components) {
                yield { id, entity: this.entities[id] };
            }
        }
    }

    *getEntitiesByIds(ids = []) {
        if (!Array.isArray(ids)) {
            return;
        }

        for (const id of ids) {
            if (Number.isInteger(id) && id >= 0 && id < this.entities.length) {
                yield { id, entity: this.entities[id] };
            }
        }
    }

    registerConfiguration() {
        const configurationId = Math.max(0, ...this.entityConfigurations.keys()) + 1;

        this.entityConfigurations.set(configurationId, this.entityFactory.createConfiguration());

        return configurationId;
    }

    // Component Manager

    registerComponent(name, component) {
        if (typeof name !== 'string' || name.length === 0) {
            throw TypeError('name must be a non-empty string.');
        }

        if (this.componentLookup.get(name) != null) {
            return;
        }

        const componentId = this.componentManager.registerComponent(component);

        this.componentLookup.set(name, componentId);

        for (let entity of this.entities) {
            entity[componentId] = this.componentManager.newComponent(componentId);
            Object.defineProperty(entity, name, { get() {
                    return this[componentId];
                }, configurable: true });
        }

        let initializer;

        switch (typeof component) {
            case 'function':
                initializer = component;break;
            case 'object':
                {
                    initializer = function () {
                        for (let key of Object.keys(component)) {
                            this[key] = component[key];
                        }
                    };

                    break;
                }
            default:
                initializer = function () {
                    return component;
                };break;
        }

        this.entityFactory.registerInitializer(componentId, initializer);

        return componentId;
    }

    addComponent(entityId, component) {
        if (typeof component === 'string') {
            this.entities[entityId].components |= this.componentLookup.get(component);
        } else {
            this.entities[entityId].components |= component;
        }
    }

    removeComponent(entityId, component) {
        if (typeof component === 'string') {
            this.entities[entityId].components &= ~this.componentLookup.get(component);
        } else {
            this.entities[entityId].components &= ~component;
        }
    }

    // System Manager

    registerSystem(type, components, callback) {
        if (Array.isArray(components)) {
            components = this._componentNamesToId(components);
        }

        const entities = [];

        for (const _ref of this.iterateEntities(components)) {
            const { id } = _ref;

            entities.push(id);
        }

        return this.systemManager.registerSystem(type, components, entities, callback);
    }

    registerLogicSystem(components, callback) {
        return this.registerSystem(SystemType.Logic, components, callback);
    }

    registerRenderSystem(components, callback) {
        return this.registerSystem(SystemType.Render, components, callback);
    }

    registerInitSystem(components, callback) {
        return this.registerSystem(SystemType.Init, components, callback);
    }

    removeSystem(systemId) {
        return this.systemManager.removeSystem(systemId);
    }

    onLogic(opts) {
        for (let system of this.systemManager.logicSystems.values()) {
            system.callback.call(this, this.getEntitiesByIds(system.entities), opts);
        }
    }

    onRender(opts) {
        for (let system of this.systemManager.renderSystems.values()) {
            system.callback.call(this, this.getEntitiesByIds(system.entities), opts);
        }
    }

    onInit(opts) {
        for (let system of this.systemManager.initSystems.values()) {
            system.callback.call(this, this.getEntitiesByIds(system.entities), opts);
        }
    }

    // Entity Factory

    registerInitializer(component, initializer) {
        if (typeof component === 'string') {
            this.entityFactory.registerInitializer(this.componentLookup.get(component), initializer);
        } else {
            this.entityFactory.registerInitializer(component, initializer);
        }
    }

    build() {
        this.entityFactory.build();

        return this;
    }

    withComponent(component, initializer) {
        if (typeof component === 'string') {
            this.entityFactory.withComponent(this.componentLookup.get(component), initializer);
        } else {
            this.entityFactory.withComponent(component, initializer);
        }

        return this;
    }

    create(count, configurationId) {
        let configuration = undefined;

        if (Number.isInteger(configurationId) && configurationId > 0) {
            configuration = this.entityConfigurations.get(configurationId);

            if (configuration === undefined) {
                throw Error('Could not find entity configuration. If you wish to create entities without a configuration, do not pass a configurationId.');
            }
        }

        return this.entityFactory.create(this, count, configuration);
    }

    // Event Handler

    listen(event, callback) {
        return this.eventHandler.listen(event, callback);
    }

    stopListen(eventId) {
        return this.eventHandler.stopListen(eventId);
    }

    trigger() {
        return this.eventHandler.trigger.call(this, ...arguments);
    }

    triggerDelayed() {
        return this.eventHandler.triggerDelayed.call(this, ...arguments);
    }
}

exports.EntityManager = EntityManager;
exports.EntityFactory = EntityFactory;
exports.SystemManager = SystemManager;
exports.SystemType = SystemType;
exports.ComponentManager = ComponentManager;
exports.EventHandler = EventHandler;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMubW9kdWxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29yZS9lbnRpdHktZmFjdG9yeS5qcyIsIi4uL3NyYy9jb3JlL2NvbXBvbmVudC1tYW5hZ2VyLmpzIiwiLi4vc3JjL2NvcmUvc3lzdGVtLW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9ldmVudC1oYW5kbGVyLmpzIiwiLi4vc3JjL2NvcmUvZW50aXR5LW1hbmFnZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW50aXR5TWFuYWdlciB9IGZyb20gJy4vZW50aXR5LW1hbmFnZXInXHJcblxyXG5jbGFzcyBFbnRpdHlGYWN0b3J5IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplcnMgID0gbmV3IE1hcCgpXHJcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoaWQsIGluaXRpYWxpemVyKSB7XHJcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaWQgbXVzdCBiZSBhIHBvc2V0aXZlIGludGVnZXIuJylcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2luaXRpYWxpemVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmluaXRpYWxpemVycy5zZXQoaWQsIGluaXRpYWxpemVyKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBidWlsZCgpIHtcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xyXG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGluaXRpYWxpemVyID0gdGhpcy5pbml0aWFsaXplcnMuZ2V0KGNvbXBvbmVudElkKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uc2V0KGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjcmVhdGVDb25maWd1cmF0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb25cclxuICAgIH1cclxuICAgIFxyXG4gICAgY3JlYXRlKGVudGl0eU1hbmFnZXIsIGNvdW50ID0gMSwgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW11cclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB0aGlzLmNvbmZpZ3VyYXRpb25cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IEFycmF5LmZyb20oY29uZmlndXJhdGlvbi5rZXlzKCkpLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gY3VyciB8PSBuZXh0LCAwKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBlbnRpdGllcyA9IFtdXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XHJcbiAgICAgICAgICAgIGxldCB7IGlkLCBlbnRpdHkgfSA9IGVudGl0eU1hbmFnZXIubmV3RW50aXR5KGNvbXBvbmVudHMpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIChsZXQgW2NvbXBvbmVudCwgaW5pdGlhbGl6ZXJdIG9mIGNvbmZpZ3VyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVudGl0eVtjb21wb25lbnRdICE9PSAnb2JqZWN0JyAmJiByZXN1bHQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVudGl0aWVzLnB1c2goeyBpZCwgZW50aXR5IH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5sZW5ndGggPT09IDEgPyBlbnRpdGllc1swXSA6IGVudGl0aWVzXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IEVudGl0eUZhY3RvcnkgfVxyXG4iLCJjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIG5ld0NvbXBvbmVudChjb21wb25lbnRJZCkge1xyXG4gICAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHMuZ2V0KGNvbXBvbmVudElkKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGxcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50KClcclxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JyAgOiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKChjb21wb25lbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge31cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb21wb25lbnQpLmZvckVhY2goa2V5ID0+IHJldFtrZXldID0gY29tcG9uZW50W2tleV0pXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldFxyXG4gICAgICAgICAgICAgICAgfSkoY29tcG9uZW50KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcclxuICAgICAgICBpZiAoY29tcG9uZW50ID09PSBudWxsIHx8IGNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50IGNhbm5vdCBiZSBudWxsIG9yIHVuZGVmaW5lZC4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1heCguLi50aGlzLmNvbXBvbmVudHMua2V5cygpKVxyXG5cclxuICAgICAgICBjb25zdCBpZCA9IG1heCA9PT0gbnVsbCB8fCBtYXggPT09IHVuZGVmaW5lZCB8fCBtYXggPT09IC1JbmZpbml0eSB8fCBtYXggPT09IDAgPyAxIDogbWF4ICogMlxyXG5cclxuICAgICAgICB0aGlzLmNvbXBvbmVudHMuc2V0KGlkLCBjb21wb25lbnQpXHJcblxyXG4gICAgICAgIHJldHVybiBpZFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBnZXRDb21wb25lbnRzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudHNcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XHJcbiIsImV4cG9ydCBjb25zdCBTeXN0ZW1UeXBlID0ge1xyXG4gICAgTG9naWMgIDogMCxcclxuICAgIFJlbmRlciA6IDEsXHJcbiAgICBJbml0ICAgOiAyXHJcbn1cclxuXHJcbmNsYXNzIFN5c3RlbU1hbmFnZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdCgpIHtcclxuICAgICAgICB0aGlzLmxvZ2ljU3lzdGVtcyAgPSBuZXcgTWFwKClcclxuICAgICAgICB0aGlzLnJlbmRlclN5c3RlbXMgPSBuZXcgTWFwKClcclxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcclxuICAgIH1cclxuXHJcbiAgICBhZGRFbnRpdHkoZW50aXR5SWQsIGVudGl0eUNvbXBvbmVudHMpIHtcclxuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoZW50aXR5SWQpIHx8IGVudGl0eUlkIDwgMCkge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGVudGl0eUNvbXBvbmVudHMpIHx8IGVudGl0eUNvbXBvbmVudHMgPCAwKSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChjb25zdCB7IGNvbXBvbmVudHMsIGVudGl0aWVzLCB9IG9mIHRoaXMubG9naWNTeXN0ZW1zLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIGlmICgoZW50aXR5Q29tcG9uZW50cyAmIGNvbXBvbmVudHMpID09PSBjb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVudGl0aWVzLnNvbWUoZSA9PiBlID09PSBlbnRpdHlJZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoKGVudGl0eUlkKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IHsgY29tcG9uZW50cywgZW50aXRpZXMsIH0gb2YgdGhpcy5yZW5kZXJTeXN0ZW1zLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIGlmICgoZW50aXR5Q29tcG9uZW50cyAmIGNvbXBvbmVudHMpID09PSBjb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVudGl0aWVzLnNvbWUoZSA9PiBlID09PSBlbnRpdHlJZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoKGVudGl0eUlkKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IHsgY29tcG9uZW50cywgZW50aXRpZXMsIH0gb2YgdGhpcy5pbml0U3lzdGVtcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBpZiAoKGVudGl0eUNvbXBvbmVudHMgJiBjb21wb25lbnRzKSA9PT0gY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlbnRpdGllcy5zb21lKGUgPT4gZSA9PT0gZW50aXR5SWQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaChlbnRpdHlJZClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVFbnRpdHkoZW50aXR5SWQpIHtcclxuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoZW50aXR5SWQpIHx8IGVudGl0eUlkIDwgMCkge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLmxvZ2ljU3lzdGVtcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBpZiAoc3lzdGVtLmVudGl0aWVzLnNvbWUoZSA9PiBlID09PSBlbnRpdHlJZCkpIHtcclxuICAgICAgICAgICAgICAgIHN5c3RlbS5lbnRpdGllcyA9IHN5c3RlbS5lbnRpdGllcy5maWx0ZXIoZSA9PiBlICE9PSBlbnRpdHlJZClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMucmVuZGVyU3lzdGVtcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBpZiAoc3lzdGVtLmVudGl0aWVzLnNvbWUoZSA9PiBlID09PSBlbnRpdHlJZCkpIHtcclxuICAgICAgICAgICAgICAgIHN5c3RlbS5lbnRpdGllcyA9IHN5c3RlbS5lbnRpdGllcy5maWx0ZXIoZSA9PiBlICE9PSBlbnRpdHlJZClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuaW5pdFN5c3RlbXMudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgaWYgKHN5c3RlbS5lbnRpdGllcy5zb21lKGUgPT4gZSA9PT0gZW50aXR5SWQpKSB7XHJcbiAgICAgICAgICAgICAgICBzeXN0ZW0uZW50aXRpZXMgPSBzeXN0ZW0uZW50aXRpZXMuZmlsdGVyKGUgPT4gZSAhPT0gZW50aXR5SWQpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGVudGl0aWVzLCBjYWxsYmFjaykge1xyXG4gICAgICAgIGlmICh0eXBlICE9PSBTeXN0ZW1UeXBlLkxvZ2ljICYmIHR5cGUgIT09IFN5c3RlbVR5cGUuUmVuZGVyICYmIHR5cGUgIT09IFN5c3RlbVR5cGUuSW5pdCkge1xyXG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ3R5cGUgbXVzdCBiZSBhIHZhbGlkIFN5c3RlbVR5cGUuJylcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50cyAhPT0gJ251bWJlcicpICB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBtdXN0IGJlIGEgbnVtYmVyLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShlbnRpdGllcykpICB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignZW50aXRpZXMgbXVzdCBiZSBhbiBhcnJheS4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IHN5c3RlbSA9IHtcclxuICAgICAgICAgICAgY29tcG9uZW50cyxcclxuICAgICAgICAgICAgZW50aXRpZXMsXHJcbiAgICAgICAgICAgIGNhbGxiYWNrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IHN5c3RlbUlkID0gTWF0aC5tYXgoMCwgLi4udGhpcy5sb2dpY1N5c3RlbXMua2V5cygpLCAuLi50aGlzLnJlbmRlclN5c3RlbXMua2V5cygpLCAuLi50aGlzLmluaXRTeXN0ZW1zLmtleXMoKSkgKyAxXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Mb2dpYyA6IHRoaXMubG9naWNTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcclxuICAgICAgICAgICAgY2FzZSBTeXN0ZW1UeXBlLlJlbmRlciA6IHRoaXMucmVuZGVyU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXHJcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Jbml0IDogdGhpcy5pbml0U3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBzeXN0ZW1JZFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sb2dpY1N5c3RlbXMuZGVsZXRlKHN5c3RlbUlkKSB8fCB0aGlzLnJlbmRlclN5c3RlbXMuZGVsZXRlKHN5c3RlbUlkKSB8fCB0aGlzLmluaXRTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZClcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHsgU3lzdGVtTWFuYWdlciB9XHJcbiIsImltcG9ydCB7IEVudGl0eU1hbmFnZXIgfSBmcm9tICcuL2VudGl0eS1tYW5hZ2VyJ1xyXG5cclxuY29uc3QgZW1wdHlQcm9taXNlID0gKCkgPT4gUHJvbWlzZS5yZXNvbHZlKClcclxuXHJcbmNvbnN0IHByb21pc2UgPSAoY2FsbGJhY2ssIGNvbnRleHQsIGFyZ3MsIHRpbWVvdXQpID0+IHtcclxuICAgIGlmICh0aW1lb3V0KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShjYWxsYmFjay5jYWxsKGNvbnRleHQsIC4uLmFyZ3MpKVxyXG4gICAgICAgICAgICB9LCB0aW1lb3V0KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSlcclxufVxyXG4gICAgXHJcbmNsYXNzIEV2ZW50SGFuZGxlciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmluaXQoKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpbml0KCkge1xyXG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IE1hcCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghdGhpcy5ldmVudHMuaGFzKGV2ZW50KSkge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5zZXQoZXZlbnQsIG5ldyBNYXAoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGV2ZW50SWQgPSAtMVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZXZlbnRzLmZvckVhY2goZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBldmVudElkID0gTWF0aC5tYXgoZXZlbnRJZCwgLi4uZXZlbnQua2V5cygpKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgXHJcbiAgICAgICAgKytldmVudElkXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5ldmVudHMuZ2V0KGV2ZW50KS5zZXQoZXZlbnRJZCwgY2FsbGJhY2spXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGV2ZW50SWRcclxuICAgIH1cclxuICAgIFxyXG4gICAgc3RvcExpc3RlbihldmVudElkKSB7XHJcbiAgICAgICAgZm9yIChsZXQgZXZlbnRzIG9mIHRoaXMuZXZlbnRzLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGlkIG9mIGV2ZW50cy5rZXlzKCkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gZXZlbnRJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudHMuZGVsZXRlKGV2ZW50SWQpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0cmlnZ2VyKCkge1xyXG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcclxuICAgICAgICBcclxuICAgICAgICBsZXQgYXJncyA9IEFycmF5LmZyb20oYXJndW1lbnRzKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBbIGV2ZW50IF0gPSBhcmdzLnNwbGljZSgwLCAxKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbXB0eVByb21pc2UoKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsZXQgcHJvbWlzZXMgPSBbXVxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChwcm9taXNlKGNhbGxiYWNrLCB0aGlzLCBhcmdzKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0cmlnZ2VyRGVsYXllZCgpIHtcclxuICAgICAgICBsZXQgc2VsZiA9IHRoaXMgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyID8gdGhpcy5ldmVudEhhbmRsZXIgOiB0aGlzXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cylcclxuICAgICAgICBcclxuICAgICAgICBsZXQgWyBldmVudCwgdGltZW91dCBdID0gYXJncy5zcGxpY2UoMCwgMilcclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCAhTnVtYmVyLmlzSW50ZWdlcih0aW1lb3V0KSB8fCAhc2VsZi5ldmVudHMuaGFzKGV2ZW50KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBzZWxmLmV2ZW50cy5nZXQoZXZlbnQpLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgdGltZW91dCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHsgRXZlbnRIYW5kbGVyIH1cclxuIiwiaW1wb3J0IHsgRW50aXR5RmFjdG9yeSB9ICAgICAgICAgICAgIGZyb20gJy4vZW50aXR5LWZhY3RvcnknXHJcbmltcG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfSAgICAgICAgICBmcm9tICcuL2NvbXBvbmVudC1tYW5hZ2VyJ1xyXG5pbXBvcnQgeyBTeXN0ZW1NYW5hZ2VyLCBTeXN0ZW1UeXBlIH0gZnJvbSAnLi9zeXN0ZW0tbWFuYWdlcidcclxuaW1wb3J0IHsgRXZlbnRIYW5kbGVyIH0gICAgICAgICAgICAgIGZyb20gJy4vZXZlbnQtaGFuZGxlcidcclxuXHJcbmNsYXNzIEVudGl0eU1hbmFnZXIge1xyXG4gICAgY29uc3RydWN0b3IoY2FwYWNpdHkgPSAxMDAwKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KGNhcGFjaXR5KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpbml0KGNhcGFjaXR5KSB7XHJcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAgICAgICAgID0gY2FwYWNpdHlcclxuICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSAtMVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeSAgICA9IG5ldyBFbnRpdHlGYWN0b3J5KClcclxuICAgICAgICB0aGlzLnN5c3RlbU1hbmFnZXIgICAgPSBuZXcgU3lzdGVtTWFuYWdlcigpXHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRNYW5hZ2VyID0gbmV3IENvbXBvbmVudE1hbmFnZXIoKVxyXG4gICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMgPSBuZXcgTWFwKClcclxuICAgICAgICB0aGlzLmNvbXBvbmVudExvb2t1cCAgICAgID0gbmV3IE1hcCgpXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IEFycmF5LmZyb20oeyBsZW5ndGggOiB0aGlzLmNhcGFjaXR5IH0sICgpID0+ICh7IGNvbXBvbmVudHM6IDAgfSkpXHJcbiAgICB9XHJcblxyXG4gICAgX2NvbXBvbmVudE5hbWVzVG9JZChjb21wb25lbnRzKSB7XHJcbiAgICAgICAgcmV0dXJuIEFycmF5XHJcbiAgICAgICAgICAgIC5mcm9tKHRoaXMuY29tcG9uZW50TG9va3VwKVxyXG4gICAgICAgICAgICAuZmlsdGVyKGNsID0+IGNvbXBvbmVudHMuc29tZShjID0+IGMgPT09IGNsWzBdKSlcclxuICAgICAgICAgICAgLm1hcChjbCA9PiBjbFsxXSlcclxuICAgICAgICAgICAgLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gY3VyciB8IG5leHQsIDApXHJcbiAgICB9XHJcblxyXG4gICAgaW5jcmVhc2VDYXBhY2l0eSgpIHtcclxuICAgICAgICBsZXQgb2xkQ2FwYWNpdHkgPSB0aGlzLmNhcGFjaXR5XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAqPSAyXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IFsuLi50aGlzLmVudGl0aWVzLCAuLi5BcnJheS5mcm9tKHsgbGVuZ3RoIDogb2xkQ2FwYWNpdHkgfSwgKCkgPT4gKHsgY29tcG9uZW50czogMCB9KSldXHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSBvbGRDYXBhY2l0eTsgaSA8IHRoaXMuY2FwYWNpdHk7ICsraSkge1xyXG4gICAgICAgICAgICBsZXQgZW50aXR5ID0gdGhpcy5lbnRpdGllc1tpXVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnRJZCBvZiB0aGlzLmNvbXBvbmVudE1hbmFnZXIuZ2V0Q29tcG9uZW50cygpLmtleXMoKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbXBvbmVudE5hbWUgPSBudWxsXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiB0aGlzLmNvbXBvbmVudExvb2t1cC5lbnRyaWVzKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGNvbXBvbmVudElkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudE5hbWUgPSBrZXlcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRJZF0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGNvbXBvbmVudElkKVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZW50aXR5LCBjb21wb25lbnROYW1lLCB7IGdldCgpIHsgcmV0dXJuIHRoaXNbY29tcG9uZW50SWRdIH0sIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBuZXdFbnRpdHkoY29tcG9uZW50cykge1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNvbXBvbmVudHMpKSB7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSB0aGlzLl9jb21wb25lbnROYW1lc1RvSWQoY29tcG9uZW50cylcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGNvbXBvbmVudHMpIHx8IGNvbXBvbmVudHMgPD0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsZXQgaWQgPSAwXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy90b2RvIGlmIHJlLXVzaW5nIGFuIG9sZCBlbnRpdHksIHNob3VsZCB3ZSByZXNldCBjb21wb25lbnRzP1xyXG4gICAgICAgIGZvciAoOyBpZCA8IHRoaXMuY2FwYWNpdHk7ICsraWQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGlkID49IHRoaXMuY2FwYWNpdHkpIHtcclxuICAgICAgICAgICAgLy8gdG9kbzogYXV0byBpbmNyZWFzZSBjYXBhY2l0eT9cclxuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGlkID4gdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IGlkXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSBjb21wb25lbnRzXHJcblxyXG4gICAgICAgIHRoaXMuc3lzdGVtTWFuYWdlci5hZGRFbnRpdHkoaWQsIGNvbXBvbmVudHMpXHJcblxyXG4gICAgICAgIHJldHVybiB7IGlkLCBlbnRpdHkgOiB0aGlzLmVudGl0aWVzW2lkXSB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGRlbGV0ZUVudGl0eShpZCkge1xyXG4gICAgICAgIC8vIHRvZG8gYWRkIHNhbml0eSBjaGVja1xyXG5cclxuICAgICAgICB0aGlzLnN5c3RlbU1hbmFnZXIucmVtb3ZlRW50aXR5KGlkKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSAwXHJcblxyXG4gICAgICAgIGlmIChpZCA8IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGlkOyBpID49IDA7IC0taSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpXS5jb21wb25lbnRzICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSAwXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RW50aXR5KGlkKSB7XHJcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZW50aXRpZXNbaWRdXHJcbiAgICB9XHJcblxyXG4gICAgaGFzQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgY29tcG9uZW50ID0gdGhpcy5fY29tcG9uZW50TmFtZXNUb0lkKFsgY29tcG9uZW50LCBdKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY29tcG9uZW50KSB8fCBjb21wb25lbnQgPD0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGVudGl0eSA9IHRoaXMuZ2V0RW50aXR5KGlkKVxyXG5cclxuICAgICAgICBpZiAoIWVudGl0eSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAoZW50aXR5LmNvbXBvbmVudHMgJiBjb21wb25lbnQpID09PSBjb21wb25lbnRcclxuICAgIH1cclxuXHJcbiAgICAvLyBEb2VzIG5vdCBhbGxvdyBjb21wb25lbnRzIHRvIGJlIGFueXRoaW5nIG90aGVyIHRoYW4gYSBiaXRtYXNrIGZvciBwZXJmb3JtYW5jZSByZWFzb25zXHJcbiAgICAvLyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBmb3IgZXZlcnkgc3lzdGVtIGZvciBldmVyeSBsb29wICh3aGljaCBtaWdodCBiZSBhcyBoaWdoIGFzIDYwIC8gc2Vjb25kKVxyXG4gICAgKml0ZXJhdGVFbnRpdGllcyhjb21wb25lbnRzID0gMCkge1xyXG4gICAgICAgIGZvciAobGV0IGlkID0gMDsgaWQgPD0gdGhpcy5jdXJyZW50TWF4RW50aXR5OyArK2lkKSB7XHJcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRzID09PSAwIHx8ICh0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzICYgY29tcG9uZW50cykgPT09IGNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgICAgIHlpZWxkIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAqZ2V0RW50aXRpZXNCeUlkcyhpZHMgPSBbXSkge1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShpZHMpKSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBpZCBvZiBpZHMpIHtcclxuICAgICAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoaWQpICYmIGlkID49IDAgJiYgaWQgPCB0aGlzLmVudGl0aWVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgeWllbGQgeyBpZCwgZW50aXR5OiB0aGlzLmVudGl0aWVzW2lkXSwgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZWdpc3RlckNvbmZpZ3VyYXRpb24oKSB7XHJcbiAgICAgICAgY29uc3QgY29uZmlndXJhdGlvbklkID0gTWF0aC5tYXgoMCwgLi4udGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5rZXlzKCkpICsgMVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuc2V0KGNvbmZpZ3VyYXRpb25JZCwgdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZUNvbmZpZ3VyYXRpb24oKSlcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gY29uZmlndXJhdGlvbklkXHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIENvbXBvbmVudCBNYW5hZ2VyXHJcbiAgICBcclxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KG5hbWUsIGNvbXBvbmVudCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycgfHwgbmFtZS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCduYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQobmFtZSkgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50SWQgPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIucmVnaXN0ZXJDb21wb25lbnQoY29tcG9uZW50KVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY29tcG9uZW50TG9va3VwLnNldChuYW1lLCBjb21wb25lbnRJZClcclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBlbnRpdHkgb2YgdGhpcy5lbnRpdGllcykge1xyXG4gICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50SWRdID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnRJZClcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVudGl0eSwgbmFtZSwgeyBnZXQoKSB7IHJldHVybiB0aGlzW2NvbXBvbmVudElkXSB9LCBjb25maWd1cmFibGU6IHRydWUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGluaXRpYWxpemVyXHJcblxyXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xyXG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6IGluaXRpYWxpemVyID0gY29tcG9uZW50OyBicmVha1xyXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiB7XHJcbiAgICAgICAgICAgICAgICBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhjb21wb25lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IGNvbXBvbmVudFtrZXldXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVmYXVsdDogaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGNvbXBvbmVudCB9OyBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudElkXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGFkZENvbXBvbmVudChlbnRpdHlJZCwgY29tcG9uZW50KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgfD0gdGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzIHw9IGNvbXBvbmVudFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVtb3ZlQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyAmPSB+dGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzICY9IH5jb21wb25lbnQgICBcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFN5c3RlbSBNYW5hZ2VyXHJcbiAgICBcclxuICAgIHJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcclxuICAgICAgICAgICAgY29tcG9uZW50cyA9IHRoaXMuX2NvbXBvbmVudE5hbWVzVG9JZChjb21wb25lbnRzKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBlbnRpdGllcyA9IFtdXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChjb25zdCB7IGlkLCB9IG9mIHRoaXMuaXRlcmF0ZUVudGl0aWVzKGNvbXBvbmVudHMpKSB7XHJcbiAgICAgICAgICAgIGVudGl0aWVzLnB1c2goaWQpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGVudGl0aWVzLCBjYWxsYmFjaylcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVnaXN0ZXJMb2dpY1N5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuTG9naWMsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZWdpc3RlclJlbmRlclN5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuUmVuZGVyLCBjb21wb25lbnRzLCBjYWxsYmFjaylcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVnaXN0ZXJJbml0U3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5Jbml0LCBjb21wb25lbnRzLCBjYWxsYmFjaylcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVtb3ZlU3lzdGVtKHN5c3RlbUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZW1vdmVTeXN0ZW0oc3lzdGVtSWQpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIG9uTG9naWMob3B0cykge1xyXG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIubG9naWNTeXN0ZW1zLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXNCeUlkcyhzeXN0ZW0uZW50aXRpZXMpLCBvcHRzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgb25SZW5kZXIob3B0cykge1xyXG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIucmVuZGVyU3lzdGVtcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzQnlJZHMoc3lzdGVtLmVudGl0aWVzKSwgb3B0cylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb25Jbml0KG9wdHMpIHtcclxuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmluaXRTeXN0ZW1zLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXNCeUlkcyhzeXN0ZW0uZW50aXRpZXMpLCBvcHRzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRW50aXR5IEZhY3RvcnlcclxuICAgIFxyXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnQsIGluaXRpYWxpemVyKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpLCBpbml0aWFsaXplcilcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnQsIGluaXRpYWxpemVyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgYnVpbGQoKSB7XHJcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LmJ1aWxkKClcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQodGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudCksIGluaXRpYWxpemVyKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS53aXRoQ29tcG9uZW50KGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNyZWF0ZShjb3VudCwgY29uZmlndXJhdGlvbklkKSB7XHJcbiAgICAgICAgbGV0IGNvbmZpZ3VyYXRpb24gPSB1bmRlZmluZWRcclxuICAgICAgICBcclxuICAgICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihjb25maWd1cmF0aW9uSWQpICYmIGNvbmZpZ3VyYXRpb25JZCA+IDApIHtcclxuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuZ2V0KGNvbmZpZ3VyYXRpb25JZClcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdDb3VsZCBub3QgZmluZCBlbnRpdHkgY29uZmlndXJhdGlvbi4gSWYgeW91IHdpc2ggdG8gY3JlYXRlIGVudGl0aWVzIHdpdGhvdXQgYSBjb25maWd1cmF0aW9uLCBkbyBub3QgcGFzcyBhIGNvbmZpZ3VyYXRpb25JZC4nKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlKHRoaXMsIGNvdW50LCBjb25maWd1cmF0aW9uKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBFdmVudCBIYW5kbGVyXHJcbiAgICBcclxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIubGlzdGVuKGV2ZW50LCBjYWxsYmFjaylcclxuICAgIH1cclxuICAgIFxyXG4gICAgc3RvcExpc3RlbihldmVudElkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnN0b3BMaXN0ZW4oZXZlbnRJZClcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIudHJpZ2dlci5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXJEZWxheWVkLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgeyBFbnRpdHlNYW5hZ2VyIH1cclxuIl0sIm5hbWVzIjpbIkVudGl0eUZhY3RvcnkiLCJpbml0IiwiaW5pdGlhbGl6ZXJzIiwiTWFwIiwiY29uZmlndXJhdGlvbiIsImlkIiwiaW5pdGlhbGl6ZXIiLCJOdW1iZXIiLCJpc0ludGVnZXIiLCJUeXBlRXJyb3IiLCJzZXQiLCJjb21wb25lbnRJZCIsImdldCIsImVudGl0eU1hbmFnZXIiLCJjb3VudCIsInVuZGVmaW5lZCIsIkVudGl0eU1hbmFnZXIiLCJjb21wb25lbnRzIiwiQXJyYXkiLCJmcm9tIiwia2V5cyIsInJlZHVjZSIsImN1cnIiLCJuZXh0IiwiZW50aXRpZXMiLCJpIiwiZW50aXR5IiwibmV3RW50aXR5IiwiY2FwYWNpdHkiLCJjb21wb25lbnQiLCJyZXN1bHQiLCJjYWxsIiwicHVzaCIsImxlbmd0aCIsIkNvbXBvbmVudE1hbmFnZXIiLCJyZXQiLCJmb3JFYWNoIiwia2V5IiwibWF4IiwiTWF0aCIsIkluZmluaXR5IiwiU3lzdGVtVHlwZSIsIlN5c3RlbU1hbmFnZXIiLCJsb2dpY1N5c3RlbXMiLCJyZW5kZXJTeXN0ZW1zIiwiaW5pdFN5c3RlbXMiLCJlbnRpdHlJZCIsImVudGl0eUNvbXBvbmVudHMiLCJ2YWx1ZXMiLCJzb21lIiwiZSIsInN5c3RlbSIsImZpbHRlciIsInR5cGUiLCJjYWxsYmFjayIsIkxvZ2ljIiwiUmVuZGVyIiwiSW5pdCIsImlzQXJyYXkiLCJzeXN0ZW1JZCIsImRlbGV0ZSIsImVtcHR5UHJvbWlzZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicHJvbWlzZSIsImNvbnRleHQiLCJhcmdzIiwidGltZW91dCIsIkV2ZW50SGFuZGxlciIsImV2ZW50cyIsImV2ZW50IiwiaGFzIiwiZXZlbnRJZCIsInNlbGYiLCJldmVudEhhbmRsZXIiLCJhcmd1bWVudHMiLCJzcGxpY2UiLCJwcm9taXNlcyIsImFsbCIsImN1cnJlbnRNYXhFbnRpdHkiLCJlbnRpdHlGYWN0b3J5Iiwic3lzdGVtTWFuYWdlciIsImNvbXBvbmVudE1hbmFnZXIiLCJlbnRpdHlDb25maWd1cmF0aW9ucyIsImNvbXBvbmVudExvb2t1cCIsImNsIiwiYyIsIm1hcCIsIm9sZENhcGFjaXR5IiwiZ2V0Q29tcG9uZW50cyIsImNvbXBvbmVudE5hbWUiLCJ2YWx1ZSIsImVudHJpZXMiLCJuZXdDb21wb25lbnQiLCJkZWZpbmVQcm9wZXJ0eSIsImNvbmZpZ3VyYWJsZSIsIl9jb21wb25lbnROYW1lc1RvSWQiLCJhZGRFbnRpdHkiLCJyZW1vdmVFbnRpdHkiLCJnZXRFbnRpdHkiLCJpdGVyYXRlRW50aXRpZXMiLCJnZXRFbnRpdGllc0J5SWRzIiwiaWRzIiwiY29uZmlndXJhdGlvbklkIiwiY3JlYXRlQ29uZmlndXJhdGlvbiIsIm5hbWUiLCJyZWdpc3RlckNvbXBvbmVudCIsIk9iamVjdCIsInJlZ2lzdGVySW5pdGlhbGl6ZXIiLCJyZWdpc3RlclN5c3RlbSIsInJlbW92ZVN5c3RlbSIsIm9wdHMiLCJidWlsZCIsIndpdGhDb21wb25lbnQiLCJFcnJvciIsImNyZWF0ZSIsImxpc3RlbiIsInN0b3BMaXN0ZW4iLCJ0cmlnZ2VyIiwidHJpZ2dlckRlbGF5ZWQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLE1BQU1BLGFBQU4sQ0FBb0I7a0JBQ0Y7YUFDTEMsSUFBTDs7O1dBR0c7YUFDRUMsWUFBTCxHQUFxQixJQUFJQyxHQUFKLEVBQXJCO2FBQ0tDLGFBQUwsR0FBcUIsSUFBSUQsR0FBSixFQUFyQjs7O3dCQUdnQkUsRUFBcEIsRUFBd0JDLFdBQXhCLEVBQXFDO1lBQzdCLENBQUNDLE9BQU9DLFNBQVAsQ0FBaUJILEVBQWpCLENBQUQsSUFBeUJBLE1BQU0sQ0FBbkMsRUFBc0M7a0JBQzVCSSxVQUFVLGdDQUFWLENBQU47OztZQUdBLE9BQU9ILFdBQVAsS0FBdUIsVUFBM0IsRUFBdUM7a0JBQzdCRyxVQUFVLGlDQUFWLENBQU47OzthQUdDUCxZQUFMLENBQWtCUSxHQUFsQixDQUFzQkwsRUFBdEIsRUFBMEJDLFdBQTFCOzs7WUFHSTthQUNDRixhQUFMLEdBQXFCLElBQUlELEdBQUosRUFBckI7O2VBRU8sSUFBUDs7O2tCQUdVUSxXQUFkLEVBQTJCTCxXQUEzQixFQUF3QztZQUNoQyxDQUFDQyxPQUFPQyxTQUFQLENBQWlCRyxXQUFqQixDQUFELElBQWtDQSxlQUFlLENBQXJELEVBQXdEO21CQUM3QyxJQUFQOzs7WUFHQSxPQUFPTCxXQUFQLEtBQXVCLFVBQTNCLEVBQXVDOzBCQUNyQixLQUFLSixZQUFMLENBQWtCVSxHQUFsQixDQUFzQkQsV0FBdEIsQ0FBZDs7O2FBR0NQLGFBQUwsQ0FBbUJNLEdBQW5CLENBQXVCQyxXQUF2QixFQUFvQ0wsV0FBcEM7O2VBRU8sSUFBUDs7OzBCQUdrQjtlQUNYLEtBQUtGLGFBQVo7OztXQUdHUyxhQUFQLEVBQXNCQyxRQUFRLENBQTlCLEVBQWlDVixnQkFBZ0JXLFNBQWpELEVBQTREO1lBQ3BELEVBQUVGLHlCQUF5QkcsYUFBM0IsQ0FBSixFQUErQzttQkFDcEMsRUFBUDs7O1lBR0FaLGlCQUFpQixJQUFyQixFQUEyQjs0QkFDUCxLQUFLQSxhQUFyQjs7O2NBR0VhLGFBQWFDLE1BQU1DLElBQU4sQ0FBV2YsY0FBY2dCLElBQWQsRUFBWCxFQUFpQ0MsTUFBakMsQ0FBd0MsQ0FBQ0MsSUFBRCxFQUFPQyxJQUFQLEtBQWdCRCxRQUFRQyxJQUFoRSxFQUFzRSxDQUF0RSxDQUFuQjs7WUFFSUMsV0FBVyxFQUFmOzthQUVLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSVgsS0FBcEIsRUFBMkIsRUFBRVcsQ0FBN0IsRUFBZ0M7Z0JBQ3hCLEVBQUVwQixFQUFGLEVBQU1xQixNQUFOLEtBQWlCYixjQUFjYyxTQUFkLENBQXdCVixVQUF4QixDQUFyQjs7Z0JBRUlaLE1BQU1RLGNBQWNlLFFBQXhCLEVBQWtDOzs7O2lCQUk3QixJQUFJLENBQUNDLFNBQUQsRUFBWXZCLFdBQVosQ0FBVCxJQUFxQ0YsYUFBckMsRUFBb0Q7b0JBQzVDLE9BQU9FLFdBQVAsS0FBdUIsVUFBM0IsRUFBdUM7Ozs7b0JBSW5Dd0IsU0FBU3hCLFlBQVl5QixJQUFaLENBQWlCTCxPQUFPRyxTQUFQLENBQWpCLENBQWI7O29CQUVJLE9BQU9ILE9BQU9HLFNBQVAsQ0FBUCxLQUE2QixRQUE3QixJQUF5Q0MsV0FBV2YsU0FBeEQsRUFBbUU7MkJBQ3hEYyxTQUFQLElBQW9CQyxNQUFwQjs7OztxQkFJQ0UsSUFBVCxDQUFjLEVBQUUzQixFQUFGLEVBQU1xQixNQUFOLEVBQWQ7OztlQUdHRixTQUFTUyxNQUFULEtBQW9CLENBQXBCLEdBQXdCVCxTQUFTLENBQVQsQ0FBeEIsR0FBc0NBLFFBQTdDOztDQUlSOztBQ3ZGQSxNQUFNVSxnQkFBTixDQUF1QjtrQkFDTDthQUNMakMsSUFBTDs7O1dBR0c7YUFDRWdCLFVBQUwsR0FBa0IsSUFBSWQsR0FBSixFQUFsQjs7O2lCQUdTUSxXQUFiLEVBQTBCO1lBQ2xCa0IsWUFBWSxLQUFLWixVQUFMLENBQWdCTCxHQUFoQixDQUFvQkQsV0FBcEIsQ0FBaEI7O1lBRUlrQixjQUFjLElBQWQsSUFBc0JBLGNBQWNkLFNBQXhDLEVBQW1EO21CQUN4QyxJQUFQOzs7Z0JBR0ksT0FBT2MsU0FBZjtpQkFDUyxVQUFMO3VCQUNXLElBQUlBLFNBQUosRUFBUDtpQkFDQyxRQUFMOzsyQkFDVyxDQUFFQSxTQUFELElBQWU7NEJBQ2ZNLE1BQU0sRUFBVjs7K0JBRU9mLElBQVAsQ0FBWVMsU0FBWixFQUF1Qk8sT0FBdkIsQ0FBK0JDLE9BQU9GLElBQUlFLEdBQUosSUFBV1IsVUFBVVEsR0FBVixDQUFqRDs7K0JBRU9GLEdBQVA7cUJBTEcsRUFNSk4sU0FOSSxDQUFQOzs7dUJBU09BLFNBQVA7Ozs7c0JBSU1BLFNBQWxCLEVBQTZCO1lBQ3JCQSxjQUFjLElBQWQsSUFBc0JBLGNBQWNkLFNBQXhDLEVBQW1EO2tCQUN6Q04sVUFBVSx3Q0FBVixDQUFOOzs7Y0FHRTZCLE1BQU1DLEtBQUtELEdBQUwsQ0FBUyxHQUFHLEtBQUtyQixVQUFMLENBQWdCRyxJQUFoQixFQUFaLENBQVo7O2NBRU1mLEtBQUtpQyxRQUFRLElBQVIsSUFBZ0JBLFFBQVF2QixTQUF4QixJQUFxQ3VCLFFBQVEsQ0FBQ0UsUUFBOUMsSUFBMERGLFFBQVEsQ0FBbEUsR0FBc0UsQ0FBdEUsR0FBMEVBLE1BQU0sQ0FBM0Y7O2FBRUtyQixVQUFMLENBQWdCUCxHQUFoQixDQUFvQkwsRUFBcEIsRUFBd0J3QixTQUF4Qjs7ZUFFT3hCLEVBQVA7OztvQkFHWTtlQUNMLEtBQUtZLFVBQVo7O0NBSVI7O0FDcERPLE1BQU13QixhQUFhO1dBQ2IsQ0FEYTtZQUViLENBRmE7VUFHYjtDQUhOOztBQU1QLE1BQU1DLGFBQU4sQ0FBb0I7a0JBQ0Y7YUFDTHpDLElBQUw7OztXQUdHO2FBQ0UwQyxZQUFMLEdBQXFCLElBQUl4QyxHQUFKLEVBQXJCO2FBQ0t5QyxhQUFMLEdBQXFCLElBQUl6QyxHQUFKLEVBQXJCO2FBQ0swQyxXQUFMLEdBQXFCLElBQUkxQyxHQUFKLEVBQXJCOzs7Y0FHTTJDLFFBQVYsRUFBb0JDLGdCQUFwQixFQUFzQztZQUM5QixDQUFDeEMsT0FBT0MsU0FBUCxDQUFpQnNDLFFBQWpCLENBQUQsSUFBK0JBLFdBQVcsQ0FBOUMsRUFBaUQ7Ozs7WUFJN0MsQ0FBQ3ZDLE9BQU9DLFNBQVAsQ0FBaUJ1QyxnQkFBakIsQ0FBRCxJQUF1Q0EsbUJBQW1CLENBQTlELEVBQWlFOzs7OzJCQUl6QixLQUFLSixZQUFMLENBQWtCSyxNQUFsQixFQUF4QyxFQUFvRTtrQkFBekQsRUFBRS9CLFVBQUYsRUFBY08sUUFBZCxFQUF5RDs7Z0JBQzVELENBQUN1QixtQkFBbUI5QixVQUFwQixNQUFvQ0EsVUFBeEMsRUFBb0Q7b0JBQzVDLENBQUNPLFNBQVN5QixJQUFULENBQWNDLEtBQUtBLE1BQU1KLFFBQXpCLENBQUwsRUFBeUM7NkJBQzVCZCxJQUFULENBQWNjLFFBQWQ7Ozs7OzRCQUs0QixLQUFLRixhQUFMLENBQW1CSSxNQUFuQixFQUF4QyxFQUFxRTtrQkFBMUQsRUFBRS9CLFVBQUYsRUFBY08sUUFBZCxFQUEwRDs7Z0JBQzdELENBQUN1QixtQkFBbUI5QixVQUFwQixNQUFvQ0EsVUFBeEMsRUFBb0Q7b0JBQzVDLENBQUNPLFNBQVN5QixJQUFULENBQWNDLEtBQUtBLE1BQU1KLFFBQXpCLENBQUwsRUFBeUM7NkJBQzVCZCxJQUFULENBQWNjLFFBQWQ7Ozs7OzRCQUs0QixLQUFLRCxXQUFMLENBQWlCRyxNQUFqQixFQUF4QyxFQUFtRTtrQkFBeEQsRUFBRS9CLFVBQUYsRUFBY08sUUFBZCxFQUF3RDs7Z0JBQzNELENBQUN1QixtQkFBbUI5QixVQUFwQixNQUFvQ0EsVUFBeEMsRUFBb0Q7b0JBQzVDLENBQUNPLFNBQVN5QixJQUFULENBQWNDLEtBQUtBLE1BQU1KLFFBQXpCLENBQUwsRUFBeUM7NkJBQzVCZCxJQUFULENBQWNjLFFBQWQ7Ozs7OztpQkFNSEEsUUFBYixFQUF1QjtZQUNmLENBQUN2QyxPQUFPQyxTQUFQLENBQWlCc0MsUUFBakIsQ0FBRCxJQUErQkEsV0FBVyxDQUE5QyxFQUFpRDs7OzthQUk1QyxJQUFJSyxNQUFULElBQW1CLEtBQUtSLFlBQUwsQ0FBa0JLLE1BQWxCLEVBQW5CLEVBQStDO2dCQUN2Q0csT0FBTzNCLFFBQVAsQ0FBZ0J5QixJQUFoQixDQUFxQkMsS0FBS0EsTUFBTUosUUFBaEMsQ0FBSixFQUErQzt1QkFDcEN0QixRQUFQLEdBQWtCMkIsT0FBTzNCLFFBQVAsQ0FBZ0I0QixNQUFoQixDQUF1QkYsS0FBS0EsTUFBTUosUUFBbEMsQ0FBbEI7Ozs7YUFJSCxJQUFJSyxNQUFULElBQW1CLEtBQUtQLGFBQUwsQ0FBbUJJLE1BQW5CLEVBQW5CLEVBQWdEO2dCQUN4Q0csT0FBTzNCLFFBQVAsQ0FBZ0J5QixJQUFoQixDQUFxQkMsS0FBS0EsTUFBTUosUUFBaEMsQ0FBSixFQUErQzt1QkFDcEN0QixRQUFQLEdBQWtCMkIsT0FBTzNCLFFBQVAsQ0FBZ0I0QixNQUFoQixDQUF1QkYsS0FBS0EsTUFBTUosUUFBbEMsQ0FBbEI7Ozs7YUFJSCxJQUFJSyxNQUFULElBQW1CLEtBQUtOLFdBQUwsQ0FBaUJHLE1BQWpCLEVBQW5CLEVBQThDO2dCQUN0Q0csT0FBTzNCLFFBQVAsQ0FBZ0J5QixJQUFoQixDQUFxQkMsS0FBS0EsTUFBTUosUUFBaEMsQ0FBSixFQUErQzt1QkFDcEN0QixRQUFQLEdBQWtCMkIsT0FBTzNCLFFBQVAsQ0FBZ0I0QixNQUFoQixDQUF1QkYsS0FBS0EsTUFBTUosUUFBbEMsQ0FBbEI7Ozs7O21CQUtHTyxJQUFmLEVBQXFCcEMsVUFBckIsRUFBaUNPLFFBQWpDLEVBQTJDOEIsUUFBM0MsRUFBcUQ7WUFDN0NELFNBQVNaLFdBQVdjLEtBQXBCLElBQTZCRixTQUFTWixXQUFXZSxNQUFqRCxJQUEyREgsU0FBU1osV0FBV2dCLElBQW5GLEVBQXlGO2tCQUMvRWhELFVBQVUsa0NBQVYsQ0FBTjs7O1lBR0EsT0FBT1EsVUFBUCxLQUFzQixRQUExQixFQUFxQztrQkFDM0JSLFVBQVUsOEJBQVYsQ0FBTjs7O1lBR0EsQ0FBQ1MsTUFBTXdDLE9BQU4sQ0FBY2xDLFFBQWQsQ0FBTCxFQUErQjtrQkFDckJmLFVBQVUsNEJBQVYsQ0FBTjs7O1lBR0EsT0FBTzZDLFFBQVAsS0FBb0IsVUFBeEIsRUFBb0M7a0JBQzFCN0MsVUFBVSw4QkFBVixDQUFOOzs7Y0FHRTBDLFNBQVM7c0JBQUE7b0JBQUE7O1NBQWY7O2NBTU1RLFdBQVdwQixLQUFLRCxHQUFMLENBQVMsQ0FBVCxFQUFZLEdBQUcsS0FBS0ssWUFBTCxDQUFrQnZCLElBQWxCLEVBQWYsRUFBeUMsR0FBRyxLQUFLd0IsYUFBTCxDQUFtQnhCLElBQW5CLEVBQTVDLEVBQXVFLEdBQUcsS0FBS3lCLFdBQUwsQ0FBaUJ6QixJQUFqQixFQUExRSxJQUFxRyxDQUF0SDs7Z0JBRVFpQyxJQUFSO2lCQUNTWixXQUFXYyxLQUFoQjtxQkFBNkJaLFlBQUwsQ0FBa0JqQyxHQUFsQixDQUFzQmlELFFBQXRCLEVBQWdDUixNQUFoQyxFQUF5QztpQkFDNURWLFdBQVdlLE1BQWhCO3FCQUE4QlosYUFBTCxDQUFtQmxDLEdBQW5CLENBQXVCaUQsUUFBdkIsRUFBaUNSLE1BQWpDLEVBQTBDO2lCQUM5RFYsV0FBV2dCLElBQWhCO3FCQUE0QlosV0FBTCxDQUFpQm5DLEdBQWpCLENBQXFCaUQsUUFBckIsRUFBK0JSLE1BQS9CLEVBQXdDOzs7ZUFHNURRLFFBQVA7OztpQkFHU0EsUUFBYixFQUF1QjtlQUNaLEtBQUtoQixZQUFMLENBQWtCaUIsTUFBbEIsQ0FBeUJELFFBQXpCLEtBQXNDLEtBQUtmLGFBQUwsQ0FBbUJnQixNQUFuQixDQUEwQkQsUUFBMUIsQ0FBdEMsSUFBNkUsS0FBS2QsV0FBTCxDQUFpQmUsTUFBakIsQ0FBd0JELFFBQXhCLENBQXBGOztDQUlSOztBQ2hIQSxNQUFNRSxlQUFlLE1BQU1DLFFBQVFDLE9BQVIsRUFBM0I7O0FBRUEsTUFBTUMsVUFBVSxDQUFDVixRQUFELEVBQVdXLE9BQVgsRUFBb0JDLElBQXBCLEVBQTBCQyxPQUExQixLQUFzQztRQUM5Q0EsT0FBSixFQUFhO2VBQ0YsSUFBSUwsT0FBSixDQUFZQyxXQUFXO3VCQUNmLFlBQVc7d0JBQ1ZULFNBQVN2QixJQUFULENBQWNrQyxPQUFkLEVBQXVCLEdBQUdDLElBQTFCLENBQVI7YUFESixFQUVHQyxPQUZIO1NBREcsQ0FBUDs7O1dBT0dMLFFBQVFDLE9BQVIsQ0FBZ0JULFNBQVN2QixJQUFULENBQWNrQyxPQUFkLEVBQXVCLEdBQUdDLElBQTFCLENBQWhCLENBQVA7Q0FUSjs7QUFZQSxNQUFNRSxZQUFOLENBQW1CO2tCQUNEO2FBQ0xuRSxJQUFMOzs7V0FHRzthQUNFb0UsTUFBTCxHQUFjLElBQUlsRSxHQUFKLEVBQWQ7OztXQUdHbUUsS0FBUCxFQUFjaEIsUUFBZCxFQUF3QjtZQUNoQixPQUFPZ0IsS0FBUCxLQUFpQixRQUFqQixJQUE2QixPQUFPaEIsUUFBUCxLQUFvQixVQUFyRCxFQUFpRTs7OztZQUk3RCxDQUFDLEtBQUtlLE1BQUwsQ0FBWUUsR0FBWixDQUFnQkQsS0FBaEIsQ0FBTCxFQUE2QjtpQkFDcEJELE1BQUwsQ0FBWTNELEdBQVosQ0FBZ0I0RCxLQUFoQixFQUF1QixJQUFJbkUsR0FBSixFQUF2Qjs7O1lBR0FxRSxVQUFVLENBQUMsQ0FBZjs7YUFFS0gsTUFBTCxDQUFZakMsT0FBWixDQUFvQmtDLFNBQVM7c0JBQ2YvQixLQUFLRCxHQUFMLENBQVNrQyxPQUFULEVBQWtCLEdBQUdGLE1BQU1sRCxJQUFOLEVBQXJCLENBQVY7U0FESjs7VUFJRW9ELE9BQUY7O2FBRUtILE1BQUwsQ0FBWXpELEdBQVosQ0FBZ0IwRCxLQUFoQixFQUF1QjVELEdBQXZCLENBQTJCOEQsT0FBM0IsRUFBb0NsQixRQUFwQzs7ZUFFT2tCLE9BQVA7OztlQUdPQSxPQUFYLEVBQW9CO2FBQ1gsSUFBSUgsTUFBVCxJQUFtQixLQUFLQSxNQUFMLENBQVlyQixNQUFaLEVBQW5CLEVBQXlDO2lCQUNoQyxJQUFJM0MsRUFBVCxJQUFlZ0UsT0FBT2pELElBQVAsRUFBZixFQUE4QjtvQkFDdEJmLE9BQU9tRSxPQUFYLEVBQW9COzJCQUNUSCxPQUFPVCxNQUFQLENBQWNZLE9BQWQsQ0FBUDs7Ozs7ZUFLTCxLQUFQOzs7Y0FHTTtZQUNGQyxPQUFPLGdCQUFnQnpELGFBQWhCLEdBQWdDLEtBQUswRCxZQUFyQyxHQUFvRCxJQUEvRDs7WUFFSVIsT0FBT2hELE1BQU1DLElBQU4sQ0FBV3dELFNBQVgsQ0FBWDs7WUFFSSxDQUFFTCxLQUFGLElBQVlKLEtBQUtVLE1BQUwsQ0FBWSxDQUFaLEVBQWUsQ0FBZixDQUFoQjs7WUFFSSxPQUFPTixLQUFQLEtBQWlCLFFBQWpCLElBQTZCLENBQUNHLEtBQUtKLE1BQUwsQ0FBWUUsR0FBWixDQUFnQkQsS0FBaEIsQ0FBbEMsRUFBMEQ7bUJBQy9DVCxjQUFQOzs7WUFHQWdCLFdBQVcsRUFBZjs7YUFFSyxJQUFJdkIsUUFBVCxJQUFxQm1CLEtBQUtKLE1BQUwsQ0FBWXpELEdBQVosQ0FBZ0IwRCxLQUFoQixFQUF1QnRCLE1BQXZCLEVBQXJCLEVBQXNEO3FCQUN6Q2hCLElBQVQsQ0FBY2dDLFFBQVFWLFFBQVIsRUFBa0IsSUFBbEIsRUFBd0JZLElBQXhCLENBQWQ7OztlQUdHSixRQUFRZ0IsR0FBUixDQUFZRCxRQUFaLENBQVA7OztxQkFHYTtZQUNUSixPQUFPLGdCQUFnQnpELGFBQWhCLEdBQWdDLEtBQUswRCxZQUFyQyxHQUFvRCxJQUEvRDs7WUFFSVIsT0FBT2hELE1BQU1DLElBQU4sQ0FBV3dELFNBQVgsQ0FBWDs7WUFFSSxDQUFFTCxLQUFGLEVBQVNILE9BQVQsSUFBcUJELEtBQUtVLE1BQUwsQ0FBWSxDQUFaLEVBQWUsQ0FBZixDQUF6Qjs7WUFFSSxPQUFPTixLQUFQLEtBQWlCLFFBQWpCLElBQTZCLENBQUMvRCxPQUFPQyxTQUFQLENBQWlCMkQsT0FBakIsQ0FBOUIsSUFBMkQsQ0FBQ00sS0FBS0osTUFBTCxDQUFZRSxHQUFaLENBQWdCRCxLQUFoQixDQUFoRSxFQUF3RjttQkFDN0VULGNBQVA7OztZQUdBZ0IsV0FBVyxFQUFmOzthQUVLLElBQUl2QixRQUFULElBQXFCbUIsS0FBS0osTUFBTCxDQUFZekQsR0FBWixDQUFnQjBELEtBQWhCLEVBQXVCdEIsTUFBdkIsRUFBckIsRUFBc0Q7cUJBQ3pDaEIsSUFBVCxDQUFjZ0MsUUFBUVYsUUFBUixFQUFrQixJQUFsQixFQUF3QlksSUFBeEIsRUFBOEJDLE9BQTlCLENBQWQ7OztlQUdHTCxRQUFRZ0IsR0FBUixDQUFZRCxRQUFaLENBQVA7O0NBSVI7O0FDL0ZBLE1BQU03RCxhQUFOLENBQW9CO2dCQUNKWSxXQUFXLElBQXZCLEVBQTZCO2FBQ3BCM0IsSUFBTCxDQUFVMkIsUUFBVjs7O1NBR0NBLFFBQUwsRUFBZTthQUNOQSxRQUFMLEdBQXdCQSxRQUF4QjthQUNLbUQsZ0JBQUwsR0FBd0IsQ0FBQyxDQUF6Qjs7YUFFS0MsYUFBTCxHQUF3QixJQUFJaEYsYUFBSixFQUF4QjthQUNLaUYsYUFBTCxHQUF3QixJQUFJdkMsYUFBSixFQUF4QjthQUNLd0MsZ0JBQUwsR0FBd0IsSUFBSWhELGdCQUFKLEVBQXhCO2FBQ0t3QyxZQUFMLEdBQXdCLElBQUlOLFlBQUosRUFBeEI7O2FBRUtlLG9CQUFMLEdBQTRCLElBQUloRixHQUFKLEVBQTVCO2FBQ0tpRixlQUFMLEdBQTRCLElBQUlqRixHQUFKLEVBQTVCOzthQUVLcUIsUUFBTCxHQUFnQk4sTUFBTUMsSUFBTixDQUFXLEVBQUVjLFFBQVMsS0FBS0wsUUFBaEIsRUFBWCxFQUF1QyxPQUFPLEVBQUVYLFlBQVksQ0FBZCxFQUFQLENBQXZDLENBQWhCOzs7d0JBR2dCQSxVQUFwQixFQUFnQztlQUNyQkMsTUFDRkMsSUFERSxDQUNHLEtBQUtpRSxlQURSLEVBRUZoQyxNQUZFLENBRUtpQyxNQUFNcEUsV0FBV2dDLElBQVgsQ0FBZ0JxQyxLQUFLQSxNQUFNRCxHQUFHLENBQUgsQ0FBM0IsQ0FGWCxFQUdGRSxHQUhFLENBR0VGLE1BQU1BLEdBQUcsQ0FBSCxDQUhSLEVBSUZoRSxNQUpFLENBSUssQ0FBQ0MsSUFBRCxFQUFPQyxJQUFQLEtBQWdCRCxPQUFPQyxJQUo1QixFQUlrQyxDQUpsQyxDQUFQOzs7dUJBT2U7WUFDWGlFLGNBQWMsS0FBSzVELFFBQXZCOzthQUVLQSxRQUFMLElBQWlCLENBQWpCOzthQUVLSixRQUFMLEdBQWdCLENBQUMsR0FBRyxLQUFLQSxRQUFULEVBQW1CLEdBQUdOLE1BQU1DLElBQU4sQ0FBVyxFQUFFYyxRQUFTdUQsV0FBWCxFQUFYLEVBQXFDLE9BQU8sRUFBRXZFLFlBQVksQ0FBZCxFQUFQLENBQXJDLENBQXRCLENBQWhCOzthQUVLLElBQUlRLElBQUkrRCxXQUFiLEVBQTBCL0QsSUFBSSxLQUFLRyxRQUFuQyxFQUE2QyxFQUFFSCxDQUEvQyxFQUFrRDtnQkFDMUNDLFNBQVMsS0FBS0YsUUFBTCxDQUFjQyxDQUFkLENBQWI7O2lCQUVLLE1BQU1kLFdBQVgsSUFBMEIsS0FBS3VFLGdCQUFMLENBQXNCTyxhQUF0QixHQUFzQ3JFLElBQXRDLEVBQTFCLEVBQXdFO29CQUNoRXNFLGdCQUFnQixJQUFwQjs7cUJBRUssSUFBSSxDQUFDckQsR0FBRCxFQUFNc0QsS0FBTixDQUFULElBQXlCLEtBQUtQLGVBQUwsQ0FBcUJRLE9BQXJCLEVBQXpCLEVBQXlEO3dCQUNqREQsVUFBVWhGLFdBQWQsRUFBMkI7d0NBQ1AwQixHQUFoQjs7Ozs7O3VCQU1EMUIsV0FBUCxJQUFzQixLQUFLdUUsZ0JBQUwsQ0FBc0JXLFlBQXRCLENBQW1DbEYsV0FBbkMsQ0FBdEI7O3VCQUVPbUYsY0FBUCxDQUFzQnBFLE1BQXRCLEVBQThCZ0UsYUFBOUIsRUFBNkMsRUFBRTlFLE1BQU07K0JBQVMsS0FBS0QsV0FBTCxDQUFQO3FCQUFWLEVBQXNDb0YsY0FBYyxJQUFwRCxFQUE3Qzs7Ozs7Y0FLRjlFLFVBQVYsRUFBc0I7WUFDZEMsTUFBTXdDLE9BQU4sQ0FBY3pDLFVBQWQsQ0FBSixFQUErQjt5QkFDZCxLQUFLK0UsbUJBQUwsQ0FBeUIvRSxVQUF6QixDQUFiOzs7WUFHQSxDQUFDVixPQUFPQyxTQUFQLENBQWlCUyxVQUFqQixDQUFELElBQWlDQSxjQUFjLENBQW5ELEVBQXNEO21CQUMzQyxFQUFFWixJQUFLLEtBQUt1QixRQUFaLEVBQXNCRixRQUFTLElBQS9CLEVBQVA7OztZQUdBckIsS0FBSyxDQUFUOzs7ZUFHT0EsS0FBSyxLQUFLdUIsUUFBakIsRUFBMkIsRUFBRXZCLEVBQTdCLEVBQWlDO2dCQUN6QixLQUFLbUIsUUFBTCxDQUFjbkIsRUFBZCxFQUFrQlksVUFBbEIsS0FBaUMsQ0FBckMsRUFBd0M7Ozs7O1lBS3hDWixNQUFNLEtBQUt1QixRQUFmLEVBQXlCOzttQkFFZCxFQUFFdkIsSUFBSyxLQUFLdUIsUUFBWixFQUFzQkYsUUFBUyxJQUEvQixFQUFQOzs7WUFHQXJCLEtBQUssS0FBSzBFLGdCQUFkLEVBQWdDO2lCQUN2QkEsZ0JBQUwsR0FBd0IxRSxFQUF4Qjs7O2FBR0NtQixRQUFMLENBQWNuQixFQUFkLEVBQWtCWSxVQUFsQixHQUErQkEsVUFBL0I7O2FBRUtnRSxhQUFMLENBQW1CZ0IsU0FBbkIsQ0FBNkI1RixFQUE3QixFQUFpQ1ksVUFBakM7O2VBRU8sRUFBRVosRUFBRixFQUFNcUIsUUFBUyxLQUFLRixRQUFMLENBQWNuQixFQUFkLENBQWYsRUFBUDs7O2lCQUdTQSxFQUFiLEVBQWlCOzs7YUFHUjRFLGFBQUwsQ0FBbUJpQixZQUFuQixDQUFnQzdGLEVBQWhDOzthQUVLbUIsUUFBTCxDQUFjbkIsRUFBZCxFQUFrQlksVUFBbEIsR0FBK0IsQ0FBL0I7O1lBRUlaLEtBQUssS0FBSzBFLGdCQUFkLEVBQWdDOzs7O2FBSTNCLElBQUl0RCxJQUFJcEIsRUFBYixFQUFpQm9CLEtBQUssQ0FBdEIsRUFBeUIsRUFBRUEsQ0FBM0IsRUFBOEI7Z0JBQ3RCLEtBQUtELFFBQUwsQ0FBY0MsQ0FBZCxFQUFpQlIsVUFBakIsS0FBZ0MsQ0FBcEMsRUFBdUM7cUJBQzlCOEQsZ0JBQUwsR0FBd0J0RCxDQUF4Qjs7Ozs7O2FBTUhzRCxnQkFBTCxHQUF3QixDQUF4Qjs7O2NBR00xRSxFQUFWLEVBQWM7WUFDTixDQUFDRSxPQUFPQyxTQUFQLENBQWlCSCxFQUFqQixDQUFELElBQXlCQSxLQUFLLENBQWxDLEVBQXFDO21CQUMxQlUsU0FBUDs7O2VBR0csS0FBS1MsUUFBTCxDQUFjbkIsRUFBZCxDQUFQOzs7aUJBR1NBLEVBQWIsRUFBaUJ3QixTQUFqQixFQUE0QjtZQUNwQixPQUFPQSxTQUFQLEtBQXFCLFFBQXpCLEVBQW1DO3dCQUNuQixLQUFLbUUsbUJBQUwsQ0FBeUIsQ0FBRW5FLFNBQUYsQ0FBekIsQ0FBWjs7O1lBR0EsQ0FBQ3RCLE9BQU9DLFNBQVAsQ0FBaUJxQixTQUFqQixDQUFELElBQWdDQSxhQUFhLENBQWpELEVBQW9EO21CQUN6QyxLQUFQOzs7Y0FHRUgsU0FBUyxLQUFLeUUsU0FBTCxDQUFlOUYsRUFBZixDQUFmOztZQUVJLENBQUNxQixNQUFMLEVBQWE7bUJBQ0YsS0FBUDs7O2VBR0csQ0FBQ0EsT0FBT1QsVUFBUCxHQUFvQlksU0FBckIsTUFBb0NBLFNBQTNDOzs7OztLQUtIdUUsZUFBRCxDQUFpQm5GLGFBQWEsQ0FBOUIsRUFBaUM7YUFDeEIsSUFBSVosS0FBSyxDQUFkLEVBQWlCQSxNQUFNLEtBQUswRSxnQkFBNUIsRUFBOEMsRUFBRTFFLEVBQWhELEVBQW9EO2dCQUM1Q1ksZUFBZSxDQUFmLElBQW9CLENBQUMsS0FBS08sUUFBTCxDQUFjbkIsRUFBZCxFQUFrQlksVUFBbEIsR0FBK0JBLFVBQWhDLE1BQWdEQSxVQUF4RSxFQUFvRjtzQkFDMUUsRUFBRVosRUFBRixFQUFNcUIsUUFBUyxLQUFLRixRQUFMLENBQWNuQixFQUFkLENBQWYsRUFBTjs7Ozs7S0FLWGdHLGdCQUFELENBQWtCQyxNQUFNLEVBQXhCLEVBQTRCO1lBQ3BCLENBQUNwRixNQUFNd0MsT0FBTixDQUFjNEMsR0FBZCxDQUFMLEVBQXlCOzs7O2FBSXBCLE1BQU1qRyxFQUFYLElBQWlCaUcsR0FBakIsRUFBc0I7Z0JBQ2QvRixPQUFPQyxTQUFQLENBQWlCSCxFQUFqQixLQUF3QkEsTUFBTSxDQUE5QixJQUFtQ0EsS0FBSyxLQUFLbUIsUUFBTCxDQUFjUyxNQUExRCxFQUFrRTtzQkFDeEQsRUFBRTVCLEVBQUYsRUFBTXFCLFFBQVEsS0FBS0YsUUFBTCxDQUFjbkIsRUFBZCxDQUFkLEVBQU47Ozs7OzRCQUtZO2NBQ2RrRyxrQkFBa0JoRSxLQUFLRCxHQUFMLENBQVMsQ0FBVCxFQUFZLEdBQUcsS0FBSzZDLG9CQUFMLENBQTBCL0QsSUFBMUIsRUFBZixJQUFtRCxDQUEzRTs7YUFFSytELG9CQUFMLENBQTBCekUsR0FBMUIsQ0FBOEI2RixlQUE5QixFQUErQyxLQUFLdkIsYUFBTCxDQUFtQndCLG1CQUFuQixFQUEvQzs7ZUFFT0QsZUFBUDs7Ozs7c0JBS2NFLElBQWxCLEVBQXdCNUUsU0FBeEIsRUFBbUM7WUFDM0IsT0FBTzRFLElBQVAsS0FBZ0IsUUFBaEIsSUFBNEJBLEtBQUt4RSxNQUFMLEtBQWdCLENBQWhELEVBQW1EO2tCQUN6Q3hCLFVBQVUsa0NBQVYsQ0FBTjs7O1lBR0EsS0FBSzJFLGVBQUwsQ0FBcUJ4RSxHQUFyQixDQUF5QjZGLElBQXpCLEtBQWtDLElBQXRDLEVBQTRDOzs7O2NBSXRDOUYsY0FBYyxLQUFLdUUsZ0JBQUwsQ0FBc0J3QixpQkFBdEIsQ0FBd0M3RSxTQUF4QyxDQUFwQjs7YUFFS3VELGVBQUwsQ0FBcUIxRSxHQUFyQixDQUF5QitGLElBQXpCLEVBQStCOUYsV0FBL0I7O2FBRUssSUFBSWUsTUFBVCxJQUFtQixLQUFLRixRQUF4QixFQUFrQzttQkFDdkJiLFdBQVAsSUFBc0IsS0FBS3VFLGdCQUFMLENBQXNCVyxZQUF0QixDQUFtQ2xGLFdBQW5DLENBQXRCO21CQUNPbUYsY0FBUCxDQUFzQnBFLE1BQXRCLEVBQThCK0UsSUFBOUIsRUFBb0MsRUFBRTdGLE1BQU07MkJBQVMsS0FBS0QsV0FBTCxDQUFQO2lCQUFWLEVBQXNDb0YsY0FBYyxJQUFwRCxFQUFwQzs7O1lBR0F6RixXQUFKOztnQkFFUSxPQUFPdUIsU0FBZjtpQkFDUyxVQUFMOzhCQUErQkEsU0FBZCxDQUF5QjtpQkFDckMsUUFBTDs7a0NBQ2tCLFlBQVc7NkJBQ2hCLElBQUlRLEdBQVQsSUFBZ0JzRSxPQUFPdkYsSUFBUCxDQUFZUyxTQUFaLENBQWhCLEVBQXdDO2lDQUMvQlEsR0FBTCxJQUFZUixVQUFVUSxHQUFWLENBQVo7O3FCQUZSOzs7Ozs4QkFRbUIsWUFBVzsyQkFBU1IsU0FBUDtpQkFBM0IsQ0FBK0M7OzthQUd2RG1ELGFBQUwsQ0FBbUI0QixtQkFBbkIsQ0FBdUNqRyxXQUF2QyxFQUFvREwsV0FBcEQ7O2VBRU9LLFdBQVA7OztpQkFHU21DLFFBQWIsRUFBdUJqQixTQUF2QixFQUFrQztZQUMxQixPQUFPQSxTQUFQLEtBQXFCLFFBQXpCLEVBQW1DO2lCQUMxQkwsUUFBTCxDQUFjc0IsUUFBZCxFQUF3QjdCLFVBQXhCLElBQXNDLEtBQUttRSxlQUFMLENBQXFCeEUsR0FBckIsQ0FBeUJpQixTQUF6QixDQUF0QztTQURKLE1BRU87aUJBQ0VMLFFBQUwsQ0FBY3NCLFFBQWQsRUFBd0I3QixVQUF4QixJQUFzQ1ksU0FBdEM7Ozs7b0JBSVFpQixRQUFoQixFQUEwQmpCLFNBQTFCLEVBQXFDO1lBQzdCLE9BQU9BLFNBQVAsS0FBcUIsUUFBekIsRUFBbUM7aUJBQzFCTCxRQUFMLENBQWNzQixRQUFkLEVBQXdCN0IsVUFBeEIsSUFBc0MsQ0FBQyxLQUFLbUUsZUFBTCxDQUFxQnhFLEdBQXJCLENBQXlCaUIsU0FBekIsQ0FBdkM7U0FESixNQUVPO2lCQUNFTCxRQUFMLENBQWNzQixRQUFkLEVBQXdCN0IsVUFBeEIsSUFBc0MsQ0FBQ1ksU0FBdkM7Ozs7OzttQkFNT3dCLElBQWYsRUFBcUJwQyxVQUFyQixFQUFpQ3FDLFFBQWpDLEVBQTJDO1lBQ25DcEMsTUFBTXdDLE9BQU4sQ0FBY3pDLFVBQWQsQ0FBSixFQUErQjt5QkFDZCxLQUFLK0UsbUJBQUwsQ0FBeUIvRSxVQUF6QixDQUFiOzs7Y0FHRU8sV0FBVyxFQUFqQjs7MkJBRXNCLEtBQUs0RSxlQUFMLENBQXFCbkYsVUFBckIsQ0FBdEIsRUFBd0Q7a0JBQTdDLEVBQUVaLEVBQUYsRUFBNkM7O3FCQUMzQzJCLElBQVQsQ0FBYzNCLEVBQWQ7OztlQUdHLEtBQUs0RSxhQUFMLENBQW1CNEIsY0FBbkIsQ0FBa0N4RCxJQUFsQyxFQUF3Q3BDLFVBQXhDLEVBQW9ETyxRQUFwRCxFQUE4RDhCLFFBQTlELENBQVA7Ozt3QkFHZ0JyQyxVQUFwQixFQUFnQ3FDLFFBQWhDLEVBQTBDO2VBQy9CLEtBQUt1RCxjQUFMLENBQW9CcEUsV0FBV2MsS0FBL0IsRUFBc0N0QyxVQUF0QyxFQUFrRHFDLFFBQWxELENBQVA7Ozt5QkFHaUJyQyxVQUFyQixFQUFpQ3FDLFFBQWpDLEVBQTJDO2VBQ2hDLEtBQUt1RCxjQUFMLENBQW9CcEUsV0FBV2UsTUFBL0IsRUFBdUN2QyxVQUF2QyxFQUFtRHFDLFFBQW5ELENBQVA7Ozt1QkFHZXJDLFVBQW5CLEVBQStCcUMsUUFBL0IsRUFBeUM7ZUFDOUIsS0FBS3VELGNBQUwsQ0FBb0JwRSxXQUFXZ0IsSUFBL0IsRUFBcUN4QyxVQUFyQyxFQUFpRHFDLFFBQWpELENBQVA7OztpQkFHU0ssUUFBYixFQUF1QjtlQUNaLEtBQUtzQixhQUFMLENBQW1CNkIsWUFBbkIsQ0FBZ0NuRCxRQUFoQyxDQUFQOzs7WUFHSW9ELElBQVIsRUFBYzthQUNMLElBQUk1RCxNQUFULElBQW1CLEtBQUs4QixhQUFMLENBQW1CdEMsWUFBbkIsQ0FBZ0NLLE1BQWhDLEVBQW5CLEVBQTZEO21CQUNsRE0sUUFBUCxDQUFnQnZCLElBQWhCLENBQXFCLElBQXJCLEVBQTJCLEtBQUtzRSxnQkFBTCxDQUFzQmxELE9BQU8zQixRQUE3QixDQUEzQixFQUFtRXVGLElBQW5FOzs7O2FBSUNBLElBQVQsRUFBZTthQUNOLElBQUk1RCxNQUFULElBQW1CLEtBQUs4QixhQUFMLENBQW1CckMsYUFBbkIsQ0FBaUNJLE1BQWpDLEVBQW5CLEVBQThEO21CQUNuRE0sUUFBUCxDQUFnQnZCLElBQWhCLENBQXFCLElBQXJCLEVBQTJCLEtBQUtzRSxnQkFBTCxDQUFzQmxELE9BQU8zQixRQUE3QixDQUEzQixFQUFtRXVGLElBQW5FOzs7O1dBSURBLElBQVAsRUFBYTthQUNKLElBQUk1RCxNQUFULElBQW1CLEtBQUs4QixhQUFMLENBQW1CcEMsV0FBbkIsQ0FBK0JHLE1BQS9CLEVBQW5CLEVBQTREO21CQUNqRE0sUUFBUCxDQUFnQnZCLElBQWhCLENBQXFCLElBQXJCLEVBQTJCLEtBQUtzRSxnQkFBTCxDQUFzQmxELE9BQU8zQixRQUE3QixDQUEzQixFQUFtRXVGLElBQW5FOzs7Ozs7d0JBTVlsRixTQUFwQixFQUErQnZCLFdBQS9CLEVBQTRDO1lBQ3BDLE9BQU91QixTQUFQLEtBQXFCLFFBQXpCLEVBQW1DO2lCQUMxQm1ELGFBQUwsQ0FBbUI0QixtQkFBbkIsQ0FBdUMsS0FBS3hCLGVBQUwsQ0FBcUJ4RSxHQUFyQixDQUF5QmlCLFNBQXpCLENBQXZDLEVBQTRFdkIsV0FBNUU7U0FESixNQUVPO2lCQUNFMEUsYUFBTCxDQUFtQjRCLG1CQUFuQixDQUF1Qy9FLFNBQXZDLEVBQWtEdkIsV0FBbEQ7Ozs7WUFJQTthQUNDMEUsYUFBTCxDQUFtQmdDLEtBQW5COztlQUVPLElBQVA7OztrQkFHVW5GLFNBQWQsRUFBeUJ2QixXQUF6QixFQUFzQztZQUM5QixPQUFPdUIsU0FBUCxLQUFxQixRQUF6QixFQUFtQztpQkFDMUJtRCxhQUFMLENBQW1CaUMsYUFBbkIsQ0FBaUMsS0FBSzdCLGVBQUwsQ0FBcUJ4RSxHQUFyQixDQUF5QmlCLFNBQXpCLENBQWpDLEVBQXNFdkIsV0FBdEU7U0FESixNQUVPO2lCQUNFMEUsYUFBTCxDQUFtQmlDLGFBQW5CLENBQWlDcEYsU0FBakMsRUFBNEN2QixXQUE1Qzs7O2VBR0csSUFBUDs7O1dBR0dRLEtBQVAsRUFBY3lGLGVBQWQsRUFBK0I7WUFDdkJuRyxnQkFBZ0JXLFNBQXBCOztZQUVJUixPQUFPQyxTQUFQLENBQWlCK0YsZUFBakIsS0FBcUNBLGtCQUFrQixDQUEzRCxFQUE4RDs0QkFDMUMsS0FBS3BCLG9CQUFMLENBQTBCdkUsR0FBMUIsQ0FBOEIyRixlQUE5QixDQUFoQjs7Z0JBRUluRyxrQkFBa0JXLFNBQXRCLEVBQWlDO3NCQUN2Qm1HLE1BQU0sNkhBQU4sQ0FBTjs7OztlQUlELEtBQUtsQyxhQUFMLENBQW1CbUMsTUFBbkIsQ0FBMEIsSUFBMUIsRUFBZ0NyRyxLQUFoQyxFQUF1Q1YsYUFBdkMsQ0FBUDs7Ozs7V0FLR2tFLEtBQVAsRUFBY2hCLFFBQWQsRUFBd0I7ZUFDYixLQUFLb0IsWUFBTCxDQUFrQjBDLE1BQWxCLENBQXlCOUMsS0FBekIsRUFBZ0NoQixRQUFoQyxDQUFQOzs7ZUFHT2tCLE9BQVgsRUFBb0I7ZUFDVCxLQUFLRSxZQUFMLENBQWtCMkMsVUFBbEIsQ0FBNkI3QyxPQUE3QixDQUFQOzs7Y0FHTTtlQUNDLEtBQUtFLFlBQUwsQ0FBa0I0QyxPQUFsQixDQUEwQnZGLElBQTFCLENBQStCLElBQS9CLEVBQXFDLEdBQUc0QyxTQUF4QyxDQUFQOzs7cUJBR2E7ZUFDTixLQUFLRCxZQUFMLENBQWtCNkMsY0FBbEIsQ0FBaUN4RixJQUFqQyxDQUFzQyxJQUF0QyxFQUE0QyxHQUFHNEMsU0FBL0MsQ0FBUDs7Q0FJUjs7Ozs7Ozs7Ozs7In0=
