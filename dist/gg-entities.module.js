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

    registerSystem(type, components, callback) {
        if (type !== SystemType.Logic && type !== SystemType.Render && type !== SystemType.Init) {
            throw TypeError('type must be a valid SystemType.');
        }

        if (typeof components !== 'number') {
            throw TypeError('components must be a number.');
        }

        if (typeof callback !== 'function') {
            throw TypeError('callback must be a function.');
        }

        const system = {
            components,
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

    componentNamesToId(components) {
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
            components = this.componentNamesToId(components);
        }

        if (!Number.isInteger(components) || components <= 0) {
            return { id: this.capacity, entity: null };
        }

        let id = 0;

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

        return { id, entity: this.entities[id] };
    }

    deleteEntity(id) {
        //todo add sanity check
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

    // Does not allow components to be anything other than a bitmask for performance reasons
    // This method will be called for every system for every loop (which might be as high as 60 / second)
    *getEntities(components = 0) {
        for (let id = 0; id <= this.currentMaxEntity; ++id) {
            if (components === 0 || (this.entities[id].components & components) === components) {
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
            components = this.componentNamesToId(components);
        }

        return this.systemManager.registerSystem(type, components, callback);
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
            system.callback.call(this, this.getEntities(system.components), opts);
        }
    }

    onRender(opts) {
        for (let system of this.systemManager.renderSystems.values()) {
            system.callback.call(this, this.getEntities(system.components), opts);
        }
    }

    onInit(opts) {
        for (let system of this.systemManager.initSystems.values()) {
            system.callback.call(this, this.getEntities(system.components), opts);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMubW9kdWxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29yZS9lbnRpdHktZmFjdG9yeS5qcyIsIi4uL3NyYy9jb3JlL2NvbXBvbmVudC1tYW5hZ2VyLmpzIiwiLi4vc3JjL2NvcmUvc3lzdGVtLW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9ldmVudC1oYW5kbGVyLmpzIiwiLi4vc3JjL2NvcmUvZW50aXR5LW1hbmFnZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW50aXR5TWFuYWdlciB9IGZyb20gJy4vZW50aXR5LW1hbmFnZXInXHJcblxyXG5jbGFzcyBFbnRpdHlGYWN0b3J5IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplcnMgID0gbmV3IE1hcCgpXHJcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoaWQsIGluaXRpYWxpemVyKSB7XHJcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaWQgbXVzdCBiZSBhIHBvc2V0aXZlIGludGVnZXIuJylcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2luaXRpYWxpemVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmluaXRpYWxpemVycy5zZXQoaWQsIGluaXRpYWxpemVyKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBidWlsZCgpIHtcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xyXG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGluaXRpYWxpemVyID0gdGhpcy5pbml0aWFsaXplcnMuZ2V0KGNvbXBvbmVudElkKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uc2V0KGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjcmVhdGVDb25maWd1cmF0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb25cclxuICAgIH1cclxuICAgIFxyXG4gICAgY3JlYXRlKGVudGl0eU1hbmFnZXIsIGNvdW50ID0gMSwgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW11cclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB0aGlzLmNvbmZpZ3VyYXRpb25cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IEFycmF5LmZyb20oY29uZmlndXJhdGlvbi5rZXlzKCkpLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gY3VyciB8PSBuZXh0LCAwKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBlbnRpdGllcyA9IFtdXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XHJcbiAgICAgICAgICAgIGxldCB7IGlkLCBlbnRpdHkgfSA9IGVudGl0eU1hbmFnZXIubmV3RW50aXR5KGNvbXBvbmVudHMpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIChsZXQgW2NvbXBvbmVudCwgaW5pdGlhbGl6ZXJdIG9mIGNvbmZpZ3VyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVudGl0eVtjb21wb25lbnRdICE9PSAnb2JqZWN0JyAmJiByZXN1bHQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVudGl0aWVzLnB1c2goeyBpZCwgZW50aXR5IH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5sZW5ndGggPT09IDEgPyBlbnRpdGllc1swXSA6IGVudGl0aWVzXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IEVudGl0eUZhY3RvcnkgfVxyXG4iLCJjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIG5ld0NvbXBvbmVudChjb21wb25lbnRJZCkge1xyXG4gICAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHMuZ2V0KGNvbXBvbmVudElkKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGxcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50KClcclxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JyAgOiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKChjb21wb25lbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge31cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb21wb25lbnQpLmZvckVhY2goa2V5ID0+IHJldFtrZXldID0gY29tcG9uZW50W2tleV0pXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldFxyXG4gICAgICAgICAgICAgICAgfSkoY29tcG9uZW50KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcclxuICAgICAgICBpZiAoY29tcG9uZW50ID09PSBudWxsIHx8IGNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50IGNhbm5vdCBiZSBudWxsIG9yIHVuZGVmaW5lZC4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1heCguLi50aGlzLmNvbXBvbmVudHMua2V5cygpKVxyXG5cclxuICAgICAgICBjb25zdCBpZCA9IG1heCA9PT0gbnVsbCB8fCBtYXggPT09IHVuZGVmaW5lZCB8fCBtYXggPT09IC1JbmZpbml0eSB8fCBtYXggPT09IDAgPyAxIDogbWF4ICogMlxyXG5cclxuICAgICAgICB0aGlzLmNvbXBvbmVudHMuc2V0KGlkLCBjb21wb25lbnQpXHJcblxyXG4gICAgICAgIHJldHVybiBpZFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBnZXRDb21wb25lbnRzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudHNcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XHJcbiIsImV4cG9ydCBjb25zdCBTeXN0ZW1UeXBlID0ge1xyXG4gICAgTG9naWMgIDogMCxcclxuICAgIFJlbmRlciA6IDEsXHJcbiAgICBJbml0ICAgOiAyXHJcbn1cclxuXHJcbmNsYXNzIFN5c3RlbU1hbmFnZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdCgpIHtcclxuICAgICAgICB0aGlzLmxvZ2ljU3lzdGVtcyAgPSBuZXcgTWFwKClcclxuICAgICAgICB0aGlzLnJlbmRlclN5c3RlbXMgPSBuZXcgTWFwKClcclxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcclxuICAgICAgICBpZiAodHlwZSAhPT0gU3lzdGVtVHlwZS5Mb2dpYyAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLlJlbmRlciAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLkluaXQpIHtcclxuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCd0eXBlIG11c3QgYmUgYSB2YWxpZCBTeXN0ZW1UeXBlLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50cyAhPT0gJ251bWJlcicpICB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBtdXN0IGJlIGEgbnVtYmVyLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJylcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3Qgc3lzdGVtID0ge1xyXG4gICAgICAgICAgICBjb21wb25lbnRzLFxyXG4gICAgICAgICAgICBjYWxsYmFja1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBzeXN0ZW1JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMubG9naWNTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5yZW5kZXJTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5pbml0U3lzdGVtcy5rZXlzKCkpICsgMVxyXG4gICAgICAgIFxyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuTG9naWMgOiB0aGlzLmxvZ2ljU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXHJcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5SZW5kZXIgOiB0aGlzLnJlbmRlclN5c3RlbXMuc2V0KHN5c3RlbUlkLCBzeXN0ZW0pOyBicmVha1xyXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuSW5pdCA6IHRoaXMuaW5pdFN5c3RlbXMuc2V0KHN5c3RlbUlkLCBzeXN0ZW0pOyBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gc3lzdGVtSWRcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVtb3ZlU3lzdGVtKHN5c3RlbUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naWNTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IFN5c3RlbU1hbmFnZXIgfVxyXG4iLCJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcclxuXHJcbmNvbnN0IGVtcHR5UHJvbWlzZSA9ICgpID0+IFByb21pc2UucmVzb2x2ZSgpXHJcblxyXG5jb25zdCBwcm9taXNlID0gKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSA9PiB7XHJcbiAgICBpZiAodGltZW91dCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSlcclxuICAgICAgICAgICAgfSwgdGltZW91dClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykpXHJcbn1cclxuICAgIFxyXG5jbGFzcyBFdmVudEhhbmRsZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdCgpIHtcclxuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBNYXAoKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBsaXN0ZW4oZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIXRoaXMuZXZlbnRzLmhhcyhldmVudCkpIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMuc2V0KGV2ZW50LCBuZXcgTWFwKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBldmVudElkID0gLTFcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgZXZlbnRJZCA9IE1hdGgubWF4KGV2ZW50SWQsIC4uLmV2ZW50LmtleXMoKSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgICsrZXZlbnRJZFxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZXZlbnRzLmdldChldmVudCkuc2V0KGV2ZW50SWQsIGNhbGxiYWNrKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBldmVudElkXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xyXG4gICAgICAgIGZvciAobGV0IGV2ZW50cyBvZiB0aGlzLmV2ZW50cy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaWQgPT09IGV2ZW50SWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnRzLmRlbGV0ZShldmVudElkKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlcigpIHtcclxuICAgICAgICBsZXQgc2VsZiA9IHRoaXMgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyID8gdGhpcy5ldmVudEhhbmRsZXIgOiB0aGlzXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cylcclxuICAgICAgICBcclxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCAhc2VsZi5ldmVudHMuaGFzKGV2ZW50KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBzZWxmLmV2ZW50cy5nZXQoZXZlbnQpLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XHJcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlciA/IHRoaXMuZXZlbnRIYW5kbGVyIDogdGhpc1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IFsgZXZlbnQsIHRpbWVvdXQgXSA9IGFyZ3Muc3BsaWNlKDAsIDIpXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgIU51bWJlci5pc0ludGVnZXIodGltZW91dCkgfHwgIXNlbGYuZXZlbnRzLmhhcyhldmVudCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVtcHR5UHJvbWlzZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBwcm9taXNlcyA9IFtdXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2Ygc2VsZi5ldmVudHMuZ2V0KGV2ZW50KS52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UoY2FsbGJhY2ssIHRoaXMsIGFyZ3MsIHRpbWVvdXQpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XHJcbiIsImltcG9ydCB7IEVudGl0eUZhY3RvcnkgfSAgICAgICAgICAgICBmcm9tICcuL2VudGl0eS1mYWN0b3J5J1xyXG5pbXBvcnQgeyBDb21wb25lbnRNYW5hZ2VyIH0gICAgICAgICAgZnJvbSAnLi9jb21wb25lbnQtbWFuYWdlcidcclxuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXHJcbmltcG9ydCB7IEV2ZW50SGFuZGxlciB9ICAgICAgICAgICAgICBmcm9tICcuL2V2ZW50LWhhbmRsZXInXHJcblxyXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKGNhcGFjaXR5ID0gMTAwMCkge1xyXG4gICAgICAgIHRoaXMuaW5pdChjYXBhY2l0eSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdChjYXBhY2l0eSkge1xyXG4gICAgICAgIHRoaXMuY2FwYWNpdHkgICAgICAgICA9IGNhcGFjaXR5XHJcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTFcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkgICAgPSBuZXcgRW50aXR5RmFjdG9yeSgpXHJcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKVxyXG4gICAgICAgIHRoaXMuY29tcG9uZW50TWFuYWdlciA9IG5ldyBDb21wb25lbnRNYW5hZ2VyKClcclxuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlciAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKClcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zID0gbmV3IE1hcCgpXHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRMb29rdXAgICAgICA9IG5ldyBNYXAoKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoIDogdGhpcy5jYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVzVG9JZChjb21wb25lbnRzKSB7XHJcbiAgICAgICAgcmV0dXJuIEFycmF5XHJcbiAgICAgICAgICAgIC5mcm9tKHRoaXMuY29tcG9uZW50TG9va3VwKVxyXG4gICAgICAgICAgICAuZmlsdGVyKGNsID0+IGNvbXBvbmVudHMuc29tZShjID0+IGMgPT09IGNsWzBdKSlcclxuICAgICAgICAgICAgLm1hcChjbCA9PiBjbFsxXSlcclxuICAgICAgICAgICAgLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gY3VyciB8IG5leHQsIDApXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluY3JlYXNlQ2FwYWNpdHkoKSB7XHJcbiAgICAgICAgbGV0IG9sZENhcGFjaXR5ID0gdGhpcy5jYXBhY2l0eVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY2FwYWNpdHkgKj0gMlxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBbLi4udGhpcy5lbnRpdGllcywgLi4uQXJyYXkuZnJvbSh7IGxlbmd0aCA6IG9sZENhcGFjaXR5IH0sICgpID0+ICh7IGNvbXBvbmVudHM6IDAgfSkpXVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gb2xkQ2FwYWNpdHk7IGkgPCB0aGlzLmNhcGFjaXR5OyArK2kpIHtcclxuICAgICAgICAgICAgbGV0IGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgY29tcG9uZW50SWQgb2YgdGhpcy5jb21wb25lbnRNYW5hZ2VyLmdldENvbXBvbmVudHMoKS5rZXlzKCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb21wb25lbnROYW1lID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5jb21wb25lbnRMb29rdXAuZW50cmllcygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBjb21wb25lbnRJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnROYW1lID0ga2V5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50SWRdID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnRJZClcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVudGl0eSwgY29tcG9uZW50TmFtZSwgeyBnZXQoKSB7IHJldHVybiB0aGlzW2NvbXBvbmVudElkXSB9LCBjb25maWd1cmFibGU6IHRydWUgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgbmV3RW50aXR5KGNvbXBvbmVudHMpIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xyXG4gICAgICAgICAgICBjb21wb25lbnRzID0gdGhpcy5jb21wb25lbnROYW1lc1RvSWQoY29tcG9uZW50cylcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGNvbXBvbmVudHMpIHx8IGNvbXBvbmVudHMgPD0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsZXQgaWQgPSAwXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yICg7IGlkIDwgdGhpcy5jYXBhY2l0eTsgKytpZCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoaWQgPj0gdGhpcy5jYXBhY2l0eSkge1xyXG4gICAgICAgICAgICAvLyB0b2RvOiBhdXRvIGluY3JlYXNlIGNhcGFjaXR5P1xyXG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoaWQgPiB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaWRcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9IGNvbXBvbmVudHNcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4geyBpZCwgZW50aXR5IDogdGhpcy5lbnRpdGllc1tpZF0gfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBkZWxldGVFbnRpdHkoaWQpIHtcclxuICAgICAgICAvL3RvZG8gYWRkIHNhbml0eSBjaGVja1xyXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSAwXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGlkIDwgdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBpID0gaWQ7IGkgPj0gMDsgLS1pKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVudGl0aWVzW2ldLmNvbXBvbmVudHMgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IGlcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IDBcclxuICAgIH1cclxuXHJcbiAgICAvLyBEb2VzIG5vdCBhbGxvdyBjb21wb25lbnRzIHRvIGJlIGFueXRoaW5nIG90aGVyIHRoYW4gYSBiaXRtYXNrIGZvciBwZXJmb3JtYW5jZSByZWFzb25zXHJcbiAgICAvLyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBmb3IgZXZlcnkgc3lzdGVtIGZvciBldmVyeSBsb29wICh3aGljaCBtaWdodCBiZSBhcyBoaWdoIGFzIDYwIC8gc2Vjb25kKVxyXG4gICAgKmdldEVudGl0aWVzKGNvbXBvbmVudHMgPSAwKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaWQgPSAwOyBpZCA8PSB0aGlzLmN1cnJlbnRNYXhFbnRpdHk7ICsraWQpIHtcclxuICAgICAgICAgICAgaWYgKGNvbXBvbmVudHMgPT09IDAgfHwgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgJiBjb21wb25lbnRzKSA9PT0gY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICAgICAgeWllbGQgeyBpZCwgZW50aXR5IDogdGhpcy5lbnRpdGllc1tpZF0gfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZWdpc3RlckNvbmZpZ3VyYXRpb24oKSB7XHJcbiAgICAgICAgY29uc3QgY29uZmlndXJhdGlvbklkID0gTWF0aC5tYXgoMCwgLi4udGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5rZXlzKCkpICsgMVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuc2V0KGNvbmZpZ3VyYXRpb25JZCwgdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZUNvbmZpZ3VyYXRpb24oKSlcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gY29uZmlndXJhdGlvbklkXHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIENvbXBvbmVudCBNYW5hZ2VyXHJcbiAgICBcclxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KG5hbWUsIGNvbXBvbmVudCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycgfHwgbmFtZS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCduYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQobmFtZSkgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50SWQgPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIucmVnaXN0ZXJDb21wb25lbnQoY29tcG9uZW50KVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY29tcG9uZW50TG9va3VwLnNldChuYW1lLCBjb21wb25lbnRJZClcclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBlbnRpdHkgb2YgdGhpcy5lbnRpdGllcykge1xyXG4gICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50SWRdID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnRJZClcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVudGl0eSwgbmFtZSwgeyBnZXQoKSB7IHJldHVybiB0aGlzW2NvbXBvbmVudElkXSB9LCBjb25maWd1cmFibGU6IHRydWUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGluaXRpYWxpemVyXHJcblxyXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xyXG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6IGluaXRpYWxpemVyID0gY29tcG9uZW50OyBicmVha1xyXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiB7XHJcbiAgICAgICAgICAgICAgICBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhjb21wb25lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IGNvbXBvbmVudFtrZXldXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVmYXVsdDogaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGNvbXBvbmVudCB9OyBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudElkXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGFkZENvbXBvbmVudChlbnRpdHlJZCwgY29tcG9uZW50KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgfD0gdGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzIHw9IGNvbXBvbmVudFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVtb3ZlQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyAmPSB+dGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzICY9IH5jb21wb25lbnQgICBcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFN5c3RlbSBNYW5hZ2VyXHJcbiAgICBcclxuICAgIHJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcclxuICAgICAgICAgICAgY29tcG9uZW50cyA9IHRoaXMuY29tcG9uZW50TmFtZXNUb0lkKGNvbXBvbmVudHMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVyTG9naWNTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLkxvZ2ljLCBjb21wb25lbnRzLCBjYWxsYmFjaylcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVnaXN0ZXJSZW5kZXJTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLlJlbmRlciwgY29tcG9uZW50cywgY2FsbGJhY2spXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVySW5pdFN5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuSW5pdCwgY29tcG9uZW50cywgY2FsbGJhY2spXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlbW92ZVN5c3RlbShzeXN0ZW1JZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVtb3ZlU3lzdGVtKHN5c3RlbUlkKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBvbkxvZ2ljKG9wdHMpIHtcclxuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmxvZ2ljU3lzdGVtcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIG9uUmVuZGVyKG9wdHMpIHtcclxuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbmRlclN5c3RlbXMudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uSW5pdChvcHRzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5pbml0U3lzdGVtcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEVudGl0eSBGYWN0b3J5XHJcbiAgICBcclxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50LCBpbml0aWFsaXplcikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcih0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KSwgaW5pdGlhbGl6ZXIpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50LCBpbml0aWFsaXplcilcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGJ1aWxkKCkge1xyXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5idWlsZCgpXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIFxyXG4gICAgd2l0aENvbXBvbmVudChjb21wb25lbnQsIGluaXRpYWxpemVyKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS53aXRoQ29tcG9uZW50KHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpLCBpbml0aWFsaXplcilcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudChjb21wb25lbnQsIGluaXRpYWxpemVyKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjcmVhdGUoY291bnQsIGNvbmZpZ3VyYXRpb25JZCkge1xyXG4gICAgICAgIGxldCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoY29uZmlndXJhdGlvbklkKSAmJiBjb25maWd1cmF0aW9uSWQgPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLmdldChjb25maWd1cmF0aW9uSWQpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignQ291bGQgbm90IGZpbmQgZW50aXR5IGNvbmZpZ3VyYXRpb24uIElmIHlvdSB3aXNoIHRvIGNyZWF0ZSBlbnRpdGllcyB3aXRob3V0IGEgY29uZmlndXJhdGlvbiwgZG8gbm90IHBhc3MgYSBjb25maWd1cmF0aW9uSWQuJylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZSh0aGlzLCBjb3VudCwgY29uZmlndXJhdGlvbilcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRXZlbnQgSGFuZGxlclxyXG4gICAgXHJcbiAgICBsaXN0ZW4oZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLmxpc3RlbihldmVudCwgY2FsbGJhY2spXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci5zdG9wTGlzdGVuKGV2ZW50SWQpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRyaWdnZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXIuY2FsbCh0aGlzLCAuLi5hcmd1bWVudHMpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRyaWdnZXJEZWxheWVkKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyRGVsYXllZC5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHsgRW50aXR5TWFuYWdlciB9XHJcbiJdLCJuYW1lcyI6WyJFbnRpdHlGYWN0b3J5IiwiaW5pdCIsImluaXRpYWxpemVycyIsIk1hcCIsImNvbmZpZ3VyYXRpb24iLCJpZCIsImluaXRpYWxpemVyIiwiTnVtYmVyIiwiaXNJbnRlZ2VyIiwiVHlwZUVycm9yIiwic2V0IiwiY29tcG9uZW50SWQiLCJnZXQiLCJlbnRpdHlNYW5hZ2VyIiwiY291bnQiLCJ1bmRlZmluZWQiLCJFbnRpdHlNYW5hZ2VyIiwiY29tcG9uZW50cyIsIkFycmF5IiwiZnJvbSIsImtleXMiLCJyZWR1Y2UiLCJjdXJyIiwibmV4dCIsImVudGl0aWVzIiwiaSIsImVudGl0eSIsIm5ld0VudGl0eSIsImNhcGFjaXR5IiwiY29tcG9uZW50IiwicmVzdWx0IiwiY2FsbCIsInB1c2giLCJsZW5ndGgiLCJDb21wb25lbnRNYW5hZ2VyIiwicmV0IiwiZm9yRWFjaCIsImtleSIsIm1heCIsIk1hdGgiLCJJbmZpbml0eSIsIlN5c3RlbVR5cGUiLCJTeXN0ZW1NYW5hZ2VyIiwibG9naWNTeXN0ZW1zIiwicmVuZGVyU3lzdGVtcyIsImluaXRTeXN0ZW1zIiwidHlwZSIsImNhbGxiYWNrIiwiTG9naWMiLCJSZW5kZXIiLCJJbml0Iiwic3lzdGVtIiwic3lzdGVtSWQiLCJkZWxldGUiLCJlbXB0eVByb21pc2UiLCJQcm9taXNlIiwicmVzb2x2ZSIsInByb21pc2UiLCJjb250ZXh0IiwiYXJncyIsInRpbWVvdXQiLCJFdmVudEhhbmRsZXIiLCJldmVudHMiLCJldmVudCIsImhhcyIsImV2ZW50SWQiLCJ2YWx1ZXMiLCJzZWxmIiwiZXZlbnRIYW5kbGVyIiwiYXJndW1lbnRzIiwic3BsaWNlIiwicHJvbWlzZXMiLCJhbGwiLCJjdXJyZW50TWF4RW50aXR5IiwiZW50aXR5RmFjdG9yeSIsInN5c3RlbU1hbmFnZXIiLCJjb21wb25lbnRNYW5hZ2VyIiwiZW50aXR5Q29uZmlndXJhdGlvbnMiLCJjb21wb25lbnRMb29rdXAiLCJmaWx0ZXIiLCJjbCIsInNvbWUiLCJjIiwibWFwIiwib2xkQ2FwYWNpdHkiLCJnZXRDb21wb25lbnRzIiwiY29tcG9uZW50TmFtZSIsInZhbHVlIiwiZW50cmllcyIsIm5ld0NvbXBvbmVudCIsImRlZmluZVByb3BlcnR5IiwiY29uZmlndXJhYmxlIiwiaXNBcnJheSIsImNvbXBvbmVudE5hbWVzVG9JZCIsImdldEVudGl0aWVzIiwiY29uZmlndXJhdGlvbklkIiwiY3JlYXRlQ29uZmlndXJhdGlvbiIsIm5hbWUiLCJyZWdpc3RlckNvbXBvbmVudCIsIk9iamVjdCIsInJlZ2lzdGVySW5pdGlhbGl6ZXIiLCJlbnRpdHlJZCIsInJlZ2lzdGVyU3lzdGVtIiwicmVtb3ZlU3lzdGVtIiwib3B0cyIsImJ1aWxkIiwid2l0aENvbXBvbmVudCIsIkVycm9yIiwiY3JlYXRlIiwibGlzdGVuIiwic3RvcExpc3RlbiIsInRyaWdnZXIiLCJ0cmlnZ2VyRGVsYXllZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBRUEsTUFBTUEsYUFBTixDQUFvQjtrQkFDRjthQUNMQyxJQUFMOzs7V0FHRzthQUNFQyxZQUFMLEdBQXFCLElBQUlDLEdBQUosRUFBckI7YUFDS0MsYUFBTCxHQUFxQixJQUFJRCxHQUFKLEVBQXJCOzs7d0JBR2dCRSxFQUFwQixFQUF3QkMsV0FBeEIsRUFBcUM7WUFDN0IsQ0FBQ0MsT0FBT0MsU0FBUCxDQUFpQkgsRUFBakIsQ0FBRCxJQUF5QkEsTUFBTSxDQUFuQyxFQUFzQztrQkFDNUJJLFVBQVUsZ0NBQVYsQ0FBTjs7O1lBR0EsT0FBT0gsV0FBUCxLQUF1QixVQUEzQixFQUF1QztrQkFDN0JHLFVBQVUsaUNBQVYsQ0FBTjs7O2FBR0NQLFlBQUwsQ0FBa0JRLEdBQWxCLENBQXNCTCxFQUF0QixFQUEwQkMsV0FBMUI7OztZQUdJO2FBQ0NGLGFBQUwsR0FBcUIsSUFBSUQsR0FBSixFQUFyQjs7ZUFFTyxJQUFQOzs7a0JBR1VRLFdBQWQsRUFBMkJMLFdBQTNCLEVBQXdDO1lBQ2hDLENBQUNDLE9BQU9DLFNBQVAsQ0FBaUJHLFdBQWpCLENBQUQsSUFBa0NBLGVBQWUsQ0FBckQsRUFBd0Q7bUJBQzdDLElBQVA7OztZQUdBLE9BQU9MLFdBQVAsS0FBdUIsVUFBM0IsRUFBdUM7MEJBQ3JCLEtBQUtKLFlB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
