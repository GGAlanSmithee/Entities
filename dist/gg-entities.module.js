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

    getEntity(id) {
        if (!Number.isInteger(id) || id < 0) {
            return undefined;
        }

        return this.entities[id];
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
            components = this._componentNamesToId(components);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMubW9kdWxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29yZS9lbnRpdHktZmFjdG9yeS5qcyIsIi4uL3NyYy9jb3JlL2NvbXBvbmVudC1tYW5hZ2VyLmpzIiwiLi4vc3JjL2NvcmUvc3lzdGVtLW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9ldmVudC1oYW5kbGVyLmpzIiwiLi4vc3JjL2NvcmUvZW50aXR5LW1hbmFnZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW50aXR5TWFuYWdlciB9IGZyb20gJy4vZW50aXR5LW1hbmFnZXInXHJcblxyXG5jbGFzcyBFbnRpdHlGYWN0b3J5IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplcnMgID0gbmV3IE1hcCgpXHJcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoaWQsIGluaXRpYWxpemVyKSB7XHJcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaWQgbXVzdCBiZSBhIHBvc2V0aXZlIGludGVnZXIuJylcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2luaXRpYWxpemVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmluaXRpYWxpemVycy5zZXQoaWQsIGluaXRpYWxpemVyKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBidWlsZCgpIHtcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xyXG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGluaXRpYWxpemVyID0gdGhpcy5pbml0aWFsaXplcnMuZ2V0KGNvbXBvbmVudElkKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uc2V0KGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjcmVhdGVDb25maWd1cmF0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb25cclxuICAgIH1cclxuICAgIFxyXG4gICAgY3JlYXRlKGVudGl0eU1hbmFnZXIsIGNvdW50ID0gMSwgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW11cclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB0aGlzLmNvbmZpZ3VyYXRpb25cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IEFycmF5LmZyb20oY29uZmlndXJhdGlvbi5rZXlzKCkpLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gY3VyciB8PSBuZXh0LCAwKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBlbnRpdGllcyA9IFtdXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XHJcbiAgICAgICAgICAgIGxldCB7IGlkLCBlbnRpdHkgfSA9IGVudGl0eU1hbmFnZXIubmV3RW50aXR5KGNvbXBvbmVudHMpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIChsZXQgW2NvbXBvbmVudCwgaW5pdGlhbGl6ZXJdIG9mIGNvbmZpZ3VyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVudGl0eVtjb21wb25lbnRdICE9PSAnb2JqZWN0JyAmJiByZXN1bHQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVudGl0aWVzLnB1c2goeyBpZCwgZW50aXR5IH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5sZW5ndGggPT09IDEgPyBlbnRpdGllc1swXSA6IGVudGl0aWVzXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IEVudGl0eUZhY3RvcnkgfVxyXG4iLCJjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIG5ld0NvbXBvbmVudChjb21wb25lbnRJZCkge1xyXG4gICAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHMuZ2V0KGNvbXBvbmVudElkKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGxcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50KClcclxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JyAgOiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKChjb21wb25lbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge31cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb21wb25lbnQpLmZvckVhY2goa2V5ID0+IHJldFtrZXldID0gY29tcG9uZW50W2tleV0pXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldFxyXG4gICAgICAgICAgICAgICAgfSkoY29tcG9uZW50KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcclxuICAgICAgICBpZiAoY29tcG9uZW50ID09PSBudWxsIHx8IGNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50IGNhbm5vdCBiZSBudWxsIG9yIHVuZGVmaW5lZC4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1heCguLi50aGlzLmNvbXBvbmVudHMua2V5cygpKVxyXG5cclxuICAgICAgICBjb25zdCBpZCA9IG1heCA9PT0gbnVsbCB8fCBtYXggPT09IHVuZGVmaW5lZCB8fCBtYXggPT09IC1JbmZpbml0eSB8fCBtYXggPT09IDAgPyAxIDogbWF4ICogMlxyXG5cclxuICAgICAgICB0aGlzLmNvbXBvbmVudHMuc2V0KGlkLCBjb21wb25lbnQpXHJcblxyXG4gICAgICAgIHJldHVybiBpZFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBnZXRDb21wb25lbnRzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudHNcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XHJcbiIsImV4cG9ydCBjb25zdCBTeXN0ZW1UeXBlID0ge1xyXG4gICAgTG9naWMgIDogMCxcclxuICAgIFJlbmRlciA6IDEsXHJcbiAgICBJbml0ICAgOiAyXHJcbn1cclxuXHJcbmNsYXNzIFN5c3RlbU1hbmFnZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdCgpIHtcclxuICAgICAgICB0aGlzLmxvZ2ljU3lzdGVtcyAgPSBuZXcgTWFwKClcclxuICAgICAgICB0aGlzLnJlbmRlclN5c3RlbXMgPSBuZXcgTWFwKClcclxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcclxuICAgICAgICBpZiAodHlwZSAhPT0gU3lzdGVtVHlwZS5Mb2dpYyAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLlJlbmRlciAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLkluaXQpIHtcclxuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCd0eXBlIG11c3QgYmUgYSB2YWxpZCBTeXN0ZW1UeXBlLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50cyAhPT0gJ251bWJlcicpICB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBtdXN0IGJlIGEgbnVtYmVyLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJylcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3Qgc3lzdGVtID0ge1xyXG4gICAgICAgICAgICBjb21wb25lbnRzLFxyXG4gICAgICAgICAgICBjYWxsYmFja1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBzeXN0ZW1JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMubG9naWNTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5yZW5kZXJTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5pbml0U3lzdGVtcy5rZXlzKCkpICsgMVxyXG4gICAgICAgIFxyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuTG9naWMgOiB0aGlzLmxvZ2ljU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXHJcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5SZW5kZXIgOiB0aGlzLnJlbmRlclN5c3RlbXMuc2V0KHN5c3RlbUlkLCBzeXN0ZW0pOyBicmVha1xyXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuSW5pdCA6IHRoaXMuaW5pdFN5c3RlbXMuc2V0KHN5c3RlbUlkLCBzeXN0ZW0pOyBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gc3lzdGVtSWRcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVtb3ZlU3lzdGVtKHN5c3RlbUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naWNTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IFN5c3RlbU1hbmFnZXIgfVxyXG4iLCJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcclxuXHJcbmNvbnN0IGVtcHR5UHJvbWlzZSA9ICgpID0+IFByb21pc2UucmVzb2x2ZSgpXHJcblxyXG5jb25zdCBwcm9taXNlID0gKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSA9PiB7XHJcbiAgICBpZiAodGltZW91dCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSlcclxuICAgICAgICAgICAgfSwgdGltZW91dClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykpXHJcbn1cclxuICAgIFxyXG5jbGFzcyBFdmVudEhhbmRsZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdCgpIHtcclxuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBNYXAoKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBsaXN0ZW4oZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIXRoaXMuZXZlbnRzLmhhcyhldmVudCkpIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMuc2V0KGV2ZW50LCBuZXcgTWFwKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBldmVudElkID0gLTFcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgZXZlbnRJZCA9IE1hdGgubWF4KGV2ZW50SWQsIC4uLmV2ZW50LmtleXMoKSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgICsrZXZlbnRJZFxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZXZlbnRzLmdldChldmVudCkuc2V0KGV2ZW50SWQsIGNhbGxiYWNrKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBldmVudElkXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xyXG4gICAgICAgIGZvciAobGV0IGV2ZW50cyBvZiB0aGlzLmV2ZW50cy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaWQgPT09IGV2ZW50SWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnRzLmRlbGV0ZShldmVudElkKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlcigpIHtcclxuICAgICAgICBsZXQgc2VsZiA9IHRoaXMgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyID8gdGhpcy5ldmVudEhhbmRsZXIgOiB0aGlzXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cylcclxuICAgICAgICBcclxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCAhc2VsZi5ldmVudHMuaGFzKGV2ZW50KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBzZWxmLmV2ZW50cy5nZXQoZXZlbnQpLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XHJcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlciA/IHRoaXMuZXZlbnRIYW5kbGVyIDogdGhpc1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IFsgZXZlbnQsIHRpbWVvdXQgXSA9IGFyZ3Muc3BsaWNlKDAsIDIpXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgIU51bWJlci5pc0ludGVnZXIodGltZW91dCkgfHwgIXNlbGYuZXZlbnRzLmhhcyhldmVudCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVtcHR5UHJvbWlzZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBwcm9taXNlcyA9IFtdXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2Ygc2VsZi5ldmVudHMuZ2V0KGV2ZW50KS52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UoY2FsbGJhY2ssIHRoaXMsIGFyZ3MsIHRpbWVvdXQpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XHJcbiIsImltcG9ydCB7IEVudGl0eUZhY3RvcnkgfSAgICAgICAgICAgICBmcm9tICcuL2VudGl0eS1mYWN0b3J5J1xyXG5pbXBvcnQgeyBDb21wb25lbnRNYW5hZ2VyIH0gICAgICAgICAgZnJvbSAnLi9jb21wb25lbnQtbWFuYWdlcidcclxuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXHJcbmltcG9ydCB7IEV2ZW50SGFuZGxlciB9ICAgICAgICAgICAgICBmcm9tICcuL2V2ZW50LWhhbmRsZXInXHJcblxyXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKGNhcGFjaXR5ID0gMTAwMCkge1xyXG4gICAgICAgIHRoaXMuaW5pdChjYXBhY2l0eSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdChjYXBhY2l0eSkge1xyXG4gICAgICAgIHRoaXMuY2FwYWNpdHkgICAgICAgICA9IGNhcGFjaXR5XHJcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTFcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkgICAgPSBuZXcgRW50aXR5RmFjdG9yeSgpXHJcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKVxyXG4gICAgICAgIHRoaXMuY29tcG9uZW50TWFuYWdlciA9IG5ldyBDb21wb25lbnRNYW5hZ2VyKClcclxuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlciAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKClcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zID0gbmV3IE1hcCgpXHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRMb29rdXAgICAgICA9IG5ldyBNYXAoKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoIDogdGhpcy5jYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKVxyXG4gICAgfVxyXG5cclxuICAgIF9jb21wb25lbnROYW1lc1RvSWQoY29tcG9uZW50cykge1xyXG4gICAgICAgIHJldHVybiBBcnJheVxyXG4gICAgICAgICAgICAuZnJvbSh0aGlzLmNvbXBvbmVudExvb2t1cClcclxuICAgICAgICAgICAgLmZpbHRlcihjbCA9PiBjb21wb25lbnRzLnNvbWUoYyA9PiBjID09PSBjbFswXSkpXHJcbiAgICAgICAgICAgIC5tYXAoY2wgPT4gY2xbMV0pXHJcbiAgICAgICAgICAgIC5yZWR1Y2UoKGN1cnIsIG5leHQpID0+IGN1cnIgfCBuZXh0LCAwKVxyXG4gICAgfVxyXG5cclxuICAgIGluY3JlYXNlQ2FwYWNpdHkoKSB7XHJcbiAgICAgICAgbGV0IG9sZENhcGFjaXR5ID0gdGhpcy5jYXBhY2l0eVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY2FwYWNpdHkgKj0gMlxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBbLi4udGhpcy5lbnRpdGllcywgLi4uQXJyYXkuZnJvbSh7IGxlbmd0aCA6IG9sZENhcGFjaXR5IH0sICgpID0+ICh7IGNvbXBvbmVudHM6IDAgfSkpXVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gb2xkQ2FwYWNpdHk7IGkgPCB0aGlzLmNhcGFjaXR5OyArK2kpIHtcclxuICAgICAgICAgICAgbGV0IGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgY29tcG9uZW50SWQgb2YgdGhpcy5jb21wb25lbnRNYW5hZ2VyLmdldENvbXBvbmVudHMoKS5rZXlzKCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb21wb25lbnROYW1lID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5jb21wb25lbnRMb29rdXAuZW50cmllcygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBjb21wb25lbnRJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnROYW1lID0ga2V5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50SWRdID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnRJZClcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVudGl0eSwgY29tcG9uZW50TmFtZSwgeyBnZXQoKSB7IHJldHVybiB0aGlzW2NvbXBvbmVudElkXSB9LCBjb25maWd1cmFibGU6IHRydWUgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgbmV3RW50aXR5KGNvbXBvbmVudHMpIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xyXG4gICAgICAgICAgICBjb21wb25lbnRzID0gdGhpcy5fY29tcG9uZW50TmFtZXNUb0lkKGNvbXBvbmVudHMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRzKSB8fCBjb21wb25lbnRzIDw9IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGlkID0gMFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vdG9kbyBpZiByZS11c2luZyBhbiBvbGQgZW50aXR5LCBzaG91bGQgd2UgcmVzZXQgY29tcG9uZW50cz9cclxuICAgICAgICBmb3IgKDsgaWQgPCB0aGlzLmNhcGFjaXR5OyArK2lkKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChpZCA+PSB0aGlzLmNhcGFjaXR5KSB7XHJcbiAgICAgICAgICAgIC8vIHRvZG86IGF1dG8gaW5jcmVhc2UgY2FwYWNpdHk/XHJcbiAgICAgICAgICAgIHJldHVybiB7IGlkIDogdGhpcy5jYXBhY2l0eSwgZW50aXR5IDogbnVsbCB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChpZCA+IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpZFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gY29tcG9uZW50c1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB7IGlkLCBlbnRpdHkgOiB0aGlzLmVudGl0aWVzW2lkXSB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGRlbGV0ZUVudGl0eShpZCkge1xyXG4gICAgICAgIC8vdG9kbyBhZGQgc2FuaXR5IGNoZWNrXHJcbiAgICAgICAgdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9IDBcclxuICAgICAgICBcclxuICAgICAgICBpZiAoaWQgPCB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciAobGV0IGkgPSBpZDsgaSA+PSAwOyAtLWkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaV0uY29tcG9uZW50cyAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gMFxyXG4gICAgfVxyXG5cclxuICAgIGdldEVudGl0eShpZCkge1xyXG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihpZCkgfHwgaWQgPCAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmVudGl0aWVzW2lkXVxyXG4gICAgfVxyXG5cclxuICAgIC8vIERvZXMgbm90IGFsbG93IGNvbXBvbmVudHMgdG8gYmUgYW55dGhpbmcgb3RoZXIgdGhhbiBhIGJpdG1hc2sgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnNcclxuICAgIC8vIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGZvciBldmVyeSBzeXN0ZW0gZm9yIGV2ZXJ5IGxvb3AgKHdoaWNoIG1pZ2h0IGJlIGFzIGhpZ2ggYXMgNjAgLyBzZWNvbmQpXHJcbiAgICAqZ2V0RW50aXRpZXMoY29tcG9uZW50cyA9IDApIHtcclxuICAgICAgICBmb3IgKGxldCBpZCA9IDA7IGlkIDw9IHRoaXMuY3VycmVudE1heEVudGl0eTsgKytpZCkge1xyXG4gICAgICAgICAgICBpZiAoY29tcG9uZW50cyA9PT0gMCB8fCAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyAmIGNvbXBvbmVudHMpID09PSBjb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICB5aWVsZCB7IGlkLCBlbnRpdHkgOiB0aGlzLmVudGl0aWVzW2lkXSB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVyQ29uZmlndXJhdGlvbigpIHtcclxuICAgICAgICBjb25zdCBjb25maWd1cmF0aW9uSWQgPSBNYXRoLm1heCgwLCAuLi50aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLmtleXMoKSkgKyAxXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5zZXQoY29uZmlndXJhdGlvbklkLCB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlQ29uZmlndXJhdGlvbigpKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBjb25maWd1cmF0aW9uSWRcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gQ29tcG9uZW50IE1hbmFnZXJcclxuICAgIFxyXG4gICAgcmVnaXN0ZXJDb21wb25lbnQobmFtZSwgY29tcG9uZW50KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJyB8fCBuYW1lLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ25hbWUgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJylcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50TG9va3VwLmdldChuYW1lKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBjb21wb25lbnRJZCA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5yZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRMb29rdXAuc2V0KG5hbWUsIGNvbXBvbmVudElkKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciAobGV0IGVudGl0eSBvZiB0aGlzLmVudGl0aWVzKSB7XHJcbiAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRJZF0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGNvbXBvbmVudElkKVxyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZW50aXR5LCBuYW1lLCB7IGdldCgpIHsgcmV0dXJuIHRoaXNbY29tcG9uZW50SWRdIH0sIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsZXQgaW5pdGlhbGl6ZXJcclxuXHJcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzogaW5pdGlhbGl6ZXIgPSBjb21wb25lbnQ7IGJyZWFrXHJcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6IHtcclxuICAgICAgICAgICAgICAgIGluaXRpYWxpemVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKGNvbXBvbmVudCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1trZXldID0gY29tcG9uZW50W2tleV1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkZWZhdWx0OiBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gY29tcG9uZW50IH07IGJyZWFrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gY29tcG9uZW50SWRcclxuICAgIH1cclxuICAgIFxyXG4gICAgYWRkQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyB8PSB0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgfD0gY29tcG9uZW50XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZW1vdmVDb21wb25lbnQoZW50aXR5SWQsIGNvbXBvbmVudCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzICY9IH50aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgJj0gfmNvbXBvbmVudCAgIFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gU3lzdGVtIE1hbmFnZXJcclxuICAgIFxyXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xyXG4gICAgICAgICAgICBjb21wb25lbnRzID0gdGhpcy5fY29tcG9uZW50TmFtZXNUb0lkKGNvbXBvbmVudHMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVyTG9naWNTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLkxvZ2ljLCBjb21wb25lbnRzLCBjYWxsYmFjaylcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVnaXN0ZXJSZW5kZXJTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLlJlbmRlciwgY29tcG9uZW50cywgY2FsbGJhY2spXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVySW5pdFN5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuSW5pdCwgY29tcG9uZW50cywgY2FsbGJhY2spXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlbW92ZVN5c3RlbShzeXN0ZW1JZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVtb3ZlU3lzdGVtKHN5c3RlbUlkKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBvbkxvZ2ljKG9wdHMpIHtcclxuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmxvZ2ljU3lzdGVtcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIG9uUmVuZGVyKG9wdHMpIHtcclxuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbmRlclN5c3RlbXMudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uSW5pdChvcHRzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5pbml0U3lzdGVtcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEVudGl0eSBGYWN0b3J5XHJcbiAgICBcclxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50LCBpbml0aWFsaXplcikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcih0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KSwgaW5pdGlhbGl6ZXIpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50LCBpbml0aWFsaXplcilcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGJ1aWxkKCkge1xyXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5idWlsZCgpXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIFxyXG4gICAgd2l0aENvbXBvbmVudChjb21wb25lbnQsIGluaXRpYWxpemVyKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS53aXRoQ29tcG9uZW50KHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpLCBpbml0aWFsaXplcilcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudChjb21wb25lbnQsIGluaXRpYWxpemVyKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjcmVhdGUoY291bnQsIGNvbmZpZ3VyYXRpb25JZCkge1xyXG4gICAgICAgIGxldCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoY29uZmlndXJhdGlvbklkKSAmJiBjb25maWd1cmF0aW9uSWQgPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLmdldChjb25maWd1cmF0aW9uSWQpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignQ291bGQgbm90IGZpbmQgZW50aXR5IGNvbmZpZ3VyYXRpb24uIElmIHlvdSB3aXNoIHRvIGNyZWF0ZSBlbnRpdGllcyB3aXRob3V0IGEgY29uZmlndXJhdGlvbiwgZG8gbm90IHBhc3MgYSBjb25maWd1cmF0aW9uSWQuJylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZSh0aGlzLCBjb3VudCwgY29uZmlndXJhdGlvbilcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRXZlbnQgSGFuZGxlclxyXG4gICAgXHJcbiAgICBsaXN0ZW4oZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLmxpc3RlbihldmVudCwgY2FsbGJhY2spXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci5zdG9wTGlzdGVuKGV2ZW50SWQpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRyaWdnZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXIuY2FsbCh0aGlzLCAuLi5hcmd1bWVudHMpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRyaWdnZXJEZWxheWVkKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyRGVsYXllZC5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHsgRW50aXR5TWFuYWdlciB9XHJcbiJdLCJuYW1lcyI6WyJFbnRpdHlGYWN0b3J5IiwiaW5pdCIsImluaXRpYWxpemVycyIsIk1hcCIsImNvbmZpZ3VyYXRpb24iLCJpZCIsImluaXRpYWxpemVyIiwiTnVtYmVyIiwiaXNJbnRlZ2VyIiwiVHlwZUVycm9yIiwic2V0IiwiY29tcG9uZW50SWQiLCJnZXQiLCJlbnRpdHlNYW5hZ2VyIiwiY291bnQiLCJ1bmRlZmluZWQiLCJFbnRpdHlNYW5hZ2VyIiwiY29tcG9uZW50cyIsIkFycmF5IiwiZnJvbSIsImtleXMiLCJyZWR1Y2UiLCJjdXJyIiwibmV4dCIsImVudGl0aWVzIiwiaSIsImVudGl0eSIsIm5ld0VudGl0eSIsImNhcGFjaXR5IiwiY29tcG9uZW50IiwicmVzdWx0IiwiY2FsbCIsInB1c2giLCJsZW5ndGgiLCJDb21wb25lbnRNYW5hZ2VyIiwicmV0IiwiZm9yRWFjaCIsImtleSIsIm1heCIsIk1hdGgiLCJJbmZpbml0eSIsIlN5c3RlbVR5cGUiLCJTeXN0ZW1NYW5hZ2VyIiwibG9naWNTeXN0ZW1zIiwicmVuZGVyU3lzdGVtcyIsImluaXRTeXN0ZW1zIiwidHlwZSIsImNhbGxiYWNrIiwiTG9naWMiLCJSZW5kZXIiLCJJbml0Iiwic3lzdGVtIiwic3lzdGVtSWQiLCJkZWxldGUiLCJlbXB0eVByb21pc2UiLCJQcm9taXNlIiwicmVzb2x2ZSIsInByb21pc2UiLCJjb250ZXh0IiwiYXJncyIsInRpbWVvdXQiLCJFdmVudEhhbmRsZXIiLCJldmVudHMiLCJldmVudCIsImhhcyIsImV2ZW50SWQiLCJ2YWx1ZXMiLCJzZWxmIiwiZXZlbnRIYW5kbGVyIiwiYXJndW1lbnRzIiwic3BsaWNlIiwicHJvbWlzZXMiLCJhbGwiLCJjdXJyZW50TWF4RW50aXR5IiwiZW50aXR5RmFjdG9yeSIsInN5c3RlbU1hbmFnZXIiLCJjb21wb25lbnRNYW5hZ2VyIiwiZW50aXR5Q29uZmlndXJhdGlvbnMiLCJjb21wb25lbnRMb29rdXAiLCJmaWx0ZXIiLCJjbCIsInNvbWUiLCJjIiwibWFwIiwib2xkQ2FwYWNpdHkiLCJnZXRDb21wb25lbnRzIiwiY29tcG9uZW50TmFtZSIsInZhbHVlIiwiZW50cmllcyIsIm5ld0NvbXBvbmVudCIsImRlZmluZVByb3BlcnR5IiwiY29uZmlndXJhYmxlIiwiaXNBcnJheSIsIl9jb21wb25lbnROYW1lc1RvSWQiLCJnZXRFbnRpdGllcyIsImNvbmZpZ3VyYXRpb25JZCIsImNyZWF0ZUNvbmZpZ3VyYXRpb24iLCJuYW1lIiwicmVnaXN0ZXJDb21wb25lbnQiLCJPYmplY3QiLCJyZWdpc3RlckluaXRpYWxpemVyIiwiZW50aXR5SWQiLCJyZWdpc3RlclN5c3RlbSIsInJlbW92ZVN5c3RlbSIsIm9wdHMiLCJidWlsZCIsIndpdGhDb21wb25lbnQiLCJFcnJvciIsImNyZWF0ZSIsImxpc3RlbiIsInN0b3BMaXN0ZW4iLCJ0cmlnZ2VyIiwidHJpZ2dlckRlbGF5ZWQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLE1BQU1BLGFBQU4sQ0FBb0I7a0JBQ0Y7YUFDTEMsSUFBTDs7O1dBR0c7YUFDRUMsWUFBTCxHQUFxQixJQUFJQyxHQUFKLEVBQXJCO2FBQ0tDLGFBQUwsR0FBcUIsSUFBSUQsR0FBSixFQUFyQjs7O3dCQUdnQkUsRUFBcEIsRUFBd0JDLFdBQXhCLEVBQXFDO1lBQzdCLENBQUNDLE9BQU9DLFNBQVAsQ0FBaUJILEVBQWpCLENBQUQsSUFBeUJBLE1BQU0sQ0FBbkMsRUFBc0M7a0JBQzVCSSxVQUFVLGdDQUFWLENBQU47OztZQUdBLE9BQU9ILFdBQVAsS0FBdUIsVUFBM0IsRUFBdUM7a0JBQzdCRyxVQUFVLGlDQUFWLENBQU47OzthQUdDUCxZQUFMLENBQWtCUSxH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
