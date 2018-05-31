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

/**
 * This function adds one to its input.
 * @param {number} input any number
 * @returns {number} that number, plus one.
 */
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

        const id = max === undefined || max === null || max === -Infinity ? 1 : max === 0 ? 1 : max * 2;

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

const emptyPromise = () => {
    return new Promise(resolve => {
        resolve();
    });
};

const promise = (callback, context, args, timeout) => {
    if (timeout) {
        return new Promise(resolve => {
            setTimeout(function () {
                resolve(typeof context === 'object' ? callback.call(context, ...args) : callback.apply(context, ...args));
            }, timeout);
        });
    }

    return new Promise(resolve => {
        resolve(typeof context === 'object' ? callback.call(context, ...args) : callback.apply(context, ...args));
    });
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
            components = Array.from(this.componentLookup).reduce((curr, next) => ['', curr[1] | next[1]], ['', 0])[1];
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
            components = Array.from(this.componentLookup).reduce((curr, next) => ['', curr[1] | next[1]], ['', 0])[1];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMubW9kdWxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29yZS9lbnRpdHktZmFjdG9yeS5qcyIsIi4uL3NyYy9jb3JlL2NvbXBvbmVudC1tYW5hZ2VyLmpzIiwiLi4vc3JjL2NvcmUvc3lzdGVtLW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9ldmVudC1oYW5kbGVyLmpzIiwiLi4vc3JjL2NvcmUvZW50aXR5LW1hbmFnZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW50aXR5TWFuYWdlciB9IGZyb20gJy4vZW50aXR5LW1hbmFnZXInXHJcblxyXG5jbGFzcyBFbnRpdHlGYWN0b3J5IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplcnMgID0gbmV3IE1hcCgpXHJcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoaWQsIGluaXRpYWxpemVyKSB7XHJcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaWQgbXVzdCBiZSBhIHBvc2V0aXZlIGludGVnZXIuJylcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2luaXRpYWxpemVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmluaXRpYWxpemVycy5zZXQoaWQsIGluaXRpYWxpemVyKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBidWlsZCgpIHtcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xyXG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGluaXRpYWxpemVyID0gdGhpcy5pbml0aWFsaXplcnMuZ2V0KGNvbXBvbmVudElkKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uc2V0KGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjcmVhdGVDb25maWd1cmF0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb25cclxuICAgIH1cclxuICAgIFxyXG4gICAgY3JlYXRlKGVudGl0eU1hbmFnZXIsIGNvdW50ID0gMSwgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW11cclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB0aGlzLmNvbmZpZ3VyYXRpb25cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IEFycmF5LmZyb20oY29uZmlndXJhdGlvbi5rZXlzKCkpLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gY3VyciB8PSBuZXh0LCAwKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBlbnRpdGllcyA9IFtdXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XHJcbiAgICAgICAgICAgIGxldCB7IGlkLCBlbnRpdHkgfSA9IGVudGl0eU1hbmFnZXIubmV3RW50aXR5KGNvbXBvbmVudHMpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIChsZXQgW2NvbXBvbmVudCwgaW5pdGlhbGl6ZXJdIG9mIGNvbmZpZ3VyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVudGl0eVtjb21wb25lbnRdICE9PSAnb2JqZWN0JyAmJiByZXN1bHQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVudGl0aWVzLnB1c2goeyBpZCwgZW50aXR5IH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5sZW5ndGggPT09IDEgPyBlbnRpdGllc1swXSA6IGVudGl0aWVzXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IEVudGl0eUZhY3RvcnkgfVxyXG4iLCIvKipcclxuICogVGhpcyBmdW5jdGlvbiBhZGRzIG9uZSB0byBpdHMgaW5wdXQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbnB1dCBhbnkgbnVtYmVyXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IHRoYXQgbnVtYmVyLCBwbHVzIG9uZS5cclxuICovXHJcbmNsYXNzIENvbXBvbmVudE1hbmFnZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdCgpIHtcclxuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBuZXcgTWFwKClcclxuICAgIH1cclxuICAgIFxyXG4gICAgbmV3Q29tcG9uZW50KGNvbXBvbmVudElkKSB7XHJcbiAgICAgICAgbGV0IGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50cy5nZXQoY29tcG9uZW50SWQpXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gbnVsbCB8fCBjb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcclxuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjb21wb25lbnQoKVxyXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnICA6IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoKGNvbXBvbmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCByZXQgPSB7fVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbXBvbmVudCkuZm9yRWFjaChrZXkgPT4gcmV0W2tleV0gPSBjb21wb25lbnRba2V5XSlcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0XHJcbiAgICAgICAgICAgICAgICB9KShjb21wb25lbnQpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnRcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudCkge1xyXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnQgY2Fubm90IGJlIG51bGwgb3IgdW5kZWZpbmVkLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KC4uLnRoaXMuY29tcG9uZW50cy5rZXlzKCkpXHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgaWQgPSBtYXggPT09IHVuZGVmaW5lZCB8fCBtYXggPT09IG51bGwgfHwgbWF4ID09PSAtSW5maW5pdHkgPyAxIDogbWF4ID09PSAwID8gMSA6IG1heCAqIDJcclxuXHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRzLnNldChpZCwgY29tcG9uZW50KVxyXG5cclxuICAgICAgICByZXR1cm4gaWRcclxuICAgIH1cclxuICAgIFxyXG4gICAgZ2V0Q29tcG9uZW50cygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb21wb25lbnRzXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfVxyXG4iLCJleHBvcnQgY29uc3QgU3lzdGVtVHlwZSA9IHtcclxuICAgIExvZ2ljICA6IDAsXHJcbiAgICBSZW5kZXIgOiAxLFxyXG4gICAgSW5pdCAgIDogMlxyXG59XHJcblxyXG5jbGFzcyBTeXN0ZW1NYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgdGhpcy5sb2dpY1N5c3RlbXMgID0gbmV3IE1hcCgpXHJcbiAgICAgICAgdGhpcy5yZW5kZXJTeXN0ZW1zID0gbmV3IE1hcCgpXHJcbiAgICAgICAgdGhpcy5pbml0U3lzdGVtcyAgID0gbmV3IE1hcCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKHR5cGUgIT09IFN5c3RlbVR5cGUuTG9naWMgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5SZW5kZXIgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5Jbml0KSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigndHlwZSBtdXN0IGJlIGEgdmFsaWQgU3lzdGVtVHlwZS4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudHMgIT09ICdudW1iZXInKSAge1xyXG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2NvbXBvbmVudHMgbXVzdCBiZSBhIG51bWJlci4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IHN5c3RlbSA9IHtcclxuICAgICAgICAgICAgY29tcG9uZW50cyxcclxuICAgICAgICAgICAgY2FsbGJhY2tcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3Qgc3lzdGVtSWQgPSBNYXRoLm1heCgwLCAuLi50aGlzLmxvZ2ljU3lzdGVtcy5rZXlzKCksIC4uLnRoaXMucmVuZGVyU3lzdGVtcy5rZXlzKCksIC4uLnRoaXMuaW5pdFN5c3RlbXMua2V5cygpKSArIDFcclxuICAgICAgICBcclxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBTeXN0ZW1UeXBlLkxvZ2ljIDogdGhpcy5sb2dpY1N5c3RlbXMuc2V0KHN5c3RlbUlkLCBzeXN0ZW0pOyBicmVha1xyXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuUmVuZGVyIDogdGhpcy5yZW5kZXJTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcclxuICAgICAgICAgICAgY2FzZSBTeXN0ZW1UeXBlLkluaXQgOiB0aGlzLmluaXRTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHN5c3RlbUlkXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlbW92ZVN5c3RlbShzeXN0ZW1JZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxvZ2ljU3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpIHx8IHRoaXMucmVuZGVyU3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpIHx8IHRoaXMuaW5pdFN5c3RlbXMuZGVsZXRlKHN5c3RlbUlkKVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgeyBTeXN0ZW1NYW5hZ2VyIH1cclxuIiwiaW1wb3J0IHsgRW50aXR5TWFuYWdlciB9IGZyb20gJy4vZW50aXR5LW1hbmFnZXInXHJcblxyXG5jb25zdCBlbXB0eVByb21pc2UgPSAoKSA9PiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICB9KVxyXG59XHJcblxyXG5jb25zdCBwcm9taXNlID0gKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSA9PiB7XHJcbiAgICBpZiAodGltZW91dCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gICdvYmplY3QnID8gY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSA6IGNhbGxiYWNrLmFwcGx5KGNvbnRleHQsIC4uLmFyZ3MpKVxyXG4gICAgICAgICAgICB9LCB0aW1lb3V0KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuICAgICAgICByZXNvbHZlKHR5cGVvZiBjb250ZXh0ID09PSAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSlcclxuICAgIH0pXHJcbn1cclxuICAgIFxyXG5jbGFzcyBFdmVudEhhbmRsZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdCgpIHtcclxuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBNYXAoKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBsaXN0ZW4oZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIXRoaXMuZXZlbnRzLmhhcyhldmVudCkpIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMuc2V0KGV2ZW50LCBuZXcgTWFwKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBldmVudElkID0gLTFcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgZXZlbnRJZCA9IE1hdGgubWF4KGV2ZW50SWQsIC4uLmV2ZW50LmtleXMoKSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgICsrZXZlbnRJZFxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZXZlbnRzLmdldChldmVudCkuc2V0KGV2ZW50SWQsIGNhbGxiYWNrKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBldmVudElkXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xyXG4gICAgICAgIGZvciAobGV0IGV2ZW50cyBvZiB0aGlzLmV2ZW50cy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaWQgPT09IGV2ZW50SWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnRzLmRlbGV0ZShldmVudElkKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlcigpIHtcclxuICAgICAgICBsZXQgc2VsZiA9IHRoaXMgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyID8gdGhpcy5ldmVudEhhbmRsZXIgOiB0aGlzXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cylcclxuICAgICAgICBcclxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCAhc2VsZi5ldmVudHMuaGFzKGV2ZW50KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBzZWxmLmV2ZW50cy5nZXQoZXZlbnQpLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XHJcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlciA/IHRoaXMuZXZlbnRIYW5kbGVyIDogdGhpc1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IFsgZXZlbnQsIHRpbWVvdXQgXSA9IGFyZ3Muc3BsaWNlKDAsIDIpXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgIU51bWJlci5pc0ludGVnZXIodGltZW91dCkgfHwgIXNlbGYuZXZlbnRzLmhhcyhldmVudCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVtcHR5UHJvbWlzZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBwcm9taXNlcyA9IFtdXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2Ygc2VsZi5ldmVudHMuZ2V0KGV2ZW50KS52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UoY2FsbGJhY2ssIHRoaXMsIGFyZ3MsIHRpbWVvdXQpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XHJcbiIsImltcG9ydCB7IEVudGl0eUZhY3RvcnkgfSAgICAgICAgICAgICBmcm9tICcuL2VudGl0eS1mYWN0b3J5J1xyXG5pbXBvcnQgeyBDb21wb25lbnRNYW5hZ2VyIH0gICAgICAgICAgZnJvbSAnLi9jb21wb25lbnQtbWFuYWdlcidcclxuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXHJcbmltcG9ydCB7IEV2ZW50SGFuZGxlciB9ICAgICAgICAgICAgICBmcm9tICcuL2V2ZW50LWhhbmRsZXInXHJcblxyXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKGNhcGFjaXR5ID0gMTAwMCkge1xyXG4gICAgICAgIHRoaXMuaW5pdChjYXBhY2l0eSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdChjYXBhY2l0eSkge1xyXG4gICAgICAgIHRoaXMuY2FwYWNpdHkgICAgICAgICA9IGNhcGFjaXR5XHJcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTFcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkgICAgPSBuZXcgRW50aXR5RmFjdG9yeSgpXHJcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKVxyXG4gICAgICAgIHRoaXMuY29tcG9uZW50TWFuYWdlciA9IG5ldyBDb21wb25lbnRNYW5hZ2VyKClcclxuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlciAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKClcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zID0gbmV3IE1hcCgpXHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRMb29rdXAgICAgICA9IG5ldyBNYXAoKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoIDogdGhpcy5jYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpbmNyZWFzZUNhcGFjaXR5KCkge1xyXG4gICAgICAgIGxldCBvbGRDYXBhY2l0eSA9IHRoaXMuY2FwYWNpdHlcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNhcGFjaXR5ICo9IDJcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0aWVzID0gWy4uLnRoaXMuZW50aXRpZXMsIC4uLkFycmF5LmZyb20oeyBsZW5ndGggOiBvbGRDYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKV1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IG9sZENhcGFjaXR5OyBpIDwgdGhpcy5jYXBhY2l0eTsgKytpKSB7XHJcbiAgICAgICAgICAgIGxldCBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudElkIG9mIHRoaXMuY29tcG9uZW50TWFuYWdlci5nZXRDb21wb25lbnRzKCkua2V5cygpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29tcG9uZW50TmFtZSA9IG51bGxcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgW2tleSwgdmFsdWVdIG9mIHRoaXMuY29tcG9uZW50TG9va3VwLmVudHJpZXMoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gY29tcG9uZW50SWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50TmFtZSA9IGtleVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZW50aXR5W2NvbXBvbmVudElkXSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoY29tcG9uZW50SWQpXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbnRpdHksIGNvbXBvbmVudE5hbWUsIHsgZ2V0KCkgeyByZXR1cm4gdGhpc1tjb21wb25lbnRJZF0gfSwgY29uZmlndXJhYmxlOiB0cnVlIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIG5ld0VudGl0eShjb21wb25lbnRzKSB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcclxuICAgICAgICAgICAgY29tcG9uZW50cyA9IEFycmF5LmZyb20odGhpcy5jb21wb25lbnRMb29rdXApLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gWycnLCBjdXJyWzFdIHwgbmV4dFsxXV0sIFsnJywgMF0pWzFdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRzKSB8fCBjb21wb25lbnRzIDw9IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGlkID0gMFxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciAoOyBpZCA8IHRoaXMuY2FwYWNpdHk7ICsraWQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGlkID49IHRoaXMuY2FwYWNpdHkpIHtcclxuICAgICAgICAgICAgLy8gdG9kbzogYXV0byBpbmNyZWFzZSBjYXBhY2l0eT9cclxuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGlkID4gdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IGlkXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSBjb21wb25lbnRzXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgZGVsZXRlRW50aXR5KGlkKSB7XHJcbiAgICAgICAgLy90b2RvIGFkZCBzYW5pdHkgY2hlY2tcclxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gMFxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChpZCA8IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGlkOyBpID49IDA7IC0taSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpXS5jb21wb25lbnRzICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSAwXHJcbiAgICB9XHJcblxyXG4gICAgLy8gRG9lcyBub3QgYWxsb3cgY29tcG9uZW50cyB0byBiZSBhbnl0aGluZyBvdGhlciB0aGFuIGEgYml0bWFzayBmb3IgcGVyZm9ybWFuY2UgcmVhc29uc1xyXG4gICAgLy8gVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgZm9yIGV2ZXJ5IHN5c3RlbSBmb3IgZXZlcnkgbG9vcCAod2hpY2ggbWlnaHQgYmUgYXMgaGlnaCBhcyA2MCAvIHNlY29uZClcclxuICAgICpnZXRFbnRpdGllcyhjb21wb25lbnRzID0gMCkge1xyXG4gICAgICAgIGZvciAobGV0IGlkID0gMDsgaWQgPD0gdGhpcy5jdXJyZW50TWF4RW50aXR5OyArK2lkKSB7XHJcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRzID09PSAwIHx8ICh0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzICYgY29tcG9uZW50cykgPT09IGNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgICAgIHlpZWxkIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVnaXN0ZXJDb25maWd1cmF0aW9uKCkge1xyXG4gICAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMua2V5cygpKSArIDFcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLnNldChjb25maWd1cmF0aW9uSWQsIHRoaXMuZW50aXR5RmFjdG9yeS5jcmVhdGVDb25maWd1cmF0aW9uKCkpXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGNvbmZpZ3VyYXRpb25JZFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBDb21wb25lbnQgTWFuYWdlclxyXG4gICAgXHJcbiAgICByZWdpc3RlckNvbXBvbmVudChuYW1lLCBjb21wb25lbnQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnIHx8IG5hbWUubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignbmFtZSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KG5hbWUpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudElkID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudClcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNvbXBvbmVudExvb2t1cC5zZXQobmFtZSwgY29tcG9uZW50SWQpXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgZW50aXR5IG9mIHRoaXMuZW50aXRpZXMpIHtcclxuICAgICAgICAgICAgZW50aXR5W2NvbXBvbmVudElkXSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoY29tcG9uZW50SWQpXHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbnRpdHksIG5hbWUsIHsgZ2V0KCkgeyByZXR1cm4gdGhpc1tjb21wb25lbnRJZF0gfSwgY29uZmlndXJhYmxlOiB0cnVlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBpbml0aWFsaXplclxyXG5cclxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcclxuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOiBpbml0aWFsaXplciA9IGNvbXBvbmVudDsgYnJlYWtcclxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0Jzoge1xyXG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoY29tcG9uZW50KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2tleV0gPSBjb21wb25lbnRba2V5XVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGluaXRpYWxpemVyID0gZnVuY3Rpb24oKSB7IHJldHVybiBjb21wb25lbnQgfTsgYnJlYWtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBjb21wb25lbnRJZFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBhZGRDb21wb25lbnQoZW50aXR5SWQsIGNvbXBvbmVudCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzIHw9IHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyB8PSBjb21wb25lbnRcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlbW92ZUNvbXBvbmVudChlbnRpdHlJZCwgY29tcG9uZW50KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgJj0gfnRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyAmPSB+Y29tcG9uZW50ICAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBTeXN0ZW0gTWFuYWdlclxyXG4gICAgXHJcbiAgICByZWdpc3RlclN5c3RlbSh0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNvbXBvbmVudHMpKSB7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSBBcnJheS5mcm9tKHRoaXMuY29tcG9uZW50TG9va3VwKS5yZWR1Y2UoKGN1cnIsIG5leHQpID0+IFsnJywgY3VyclsxXSB8IG5leHRbMV1dLCBbJycsIDBdKVsxXVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZWdpc3RlckxvZ2ljU3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5Mb2dpYywgY29tcG9uZW50cywgY2FsbGJhY2spXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVyUmVuZGVyU3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5SZW5kZXIsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZWdpc3RlckluaXRTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLkluaXQsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbW92ZVN5c3RlbShzeXN0ZW1JZClcclxuICAgIH1cclxuICAgIFxyXG4gICAgb25Mb2dpYyhvcHRzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5sb2dpY1N5c3RlbXMudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBvblJlbmRlcihvcHRzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5yZW5kZXJTeXN0ZW1zLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvbkluaXQob3B0cykge1xyXG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIuaW5pdFN5c3RlbXMudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBFbnRpdHkgRmFjdG9yeVxyXG4gICAgXHJcbiAgICByZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIodGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudCksIGluaXRpYWxpemVyKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBidWlsZCgpIHtcclxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkuYnVpbGQoKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHdpdGhDb21wb25lbnQoY29tcG9uZW50LCBpbml0aWFsaXplcikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudCh0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KSwgaW5pdGlhbGl6ZXIpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQoY29tcG9uZW50LCBpbml0aWFsaXplcilcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIFxyXG4gICAgY3JlYXRlKGNvdW50LCBjb25maWd1cmF0aW9uSWQpIHtcclxuICAgICAgICBsZXQgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZFxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGNvbmZpZ3VyYXRpb25JZCkgJiYgY29uZmlndXJhdGlvbklkID4gMCkge1xyXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5nZXQoY29uZmlndXJhdGlvbklkKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIGVudGl0eSBjb25maWd1cmF0aW9uLiBJZiB5b3Ugd2lzaCB0byBjcmVhdGUgZW50aXRpZXMgd2l0aG91dCBhIGNvbmZpZ3VyYXRpb24sIGRvIG5vdCBwYXNzIGEgY29uZmlndXJhdGlvbklkLicpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZW50aXR5RmFjdG9yeS5jcmVhdGUodGhpcywgY291bnQsIGNvbmZpZ3VyYXRpb24pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEV2ZW50IEhhbmRsZXJcclxuICAgIFxyXG4gICAgbGlzdGVuKGV2ZW50LCBjYWxsYmFjaykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci5saXN0ZW4oZXZlbnQsIGNhbGxiYWNrKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIuc3RvcExpc3RlbihldmVudElkKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0cmlnZ2VyKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0cmlnZ2VyRGVsYXllZCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIudHJpZ2dlckRlbGF5ZWQuY2FsbCh0aGlzLCAuLi5hcmd1bWVudHMpXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IEVudGl0eU1hbmFnZXIgfVxyXG4iXSwibmFtZXMiOlsiRW50aXR5RmFjdG9yeSIsImluaXQiLCJpbml0aWFsaXplcnMiLCJNYXAiLCJjb25maWd1cmF0aW9uIiwiaWQiLCJpbml0aWFsaXplciIsIk51bWJlciIsImlzSW50ZWdlciIsIlR5cGVFcnJvciIsInNldCIsImNvbXBvbmVudElkIiwiZ2V0IiwiZW50aXR5TWFuYWdlciIsImNvdW50IiwidW5kZWZpbmVkIiwiRW50aXR5TWFuYWdlciIsImNvbXBvbmVudHMiLCJBcnJheSIsImZyb20iLCJrZXlzIiwicmVkdWNlIiwiY3VyciIsIm5leHQiLCJlbnRpdGllcyIsImkiLCJlbnRpdHkiLCJuZXdFbnRpdHkiLCJjYXBhY2l0eSIsImNvbXBvbmVudCIsInJlc3VsdCIsImNhbGwiLCJwdXNoIiwibGVuZ3RoIiwiQ29tcG9uZW50TWFuYWdlciIsInJldCIsImZvckVhY2giLCJrZXkiLCJtYXgiLCJNYXRoIiwiSW5maW5pdHkiLCJTeXN0ZW1UeXBlIiwiU3lzdGVtTWFuYWdlciIsImxvZ2ljU3lzdGVtcyIsInJlbmRlclN5c3RlbXMiLCJpbml0U3lzdGVtcyIsInR5cGUiLCJjYWxsYmFjayIsIkxvZ2ljIiwiUmVuZGVyIiwiSW5pdCIsInN5c3RlbSIsInN5c3RlbUlkIiwiZGVsZXRlIiwiZW1wdHlQcm9taXNlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJwcm9taXNlIiwiY29udGV4dCIsImFyZ3MiLCJ0aW1lb3V0IiwiYXBwbHkiLCJFdmVudEhhbmRsZXIiLCJldmVudHMiLCJldmVudCIsImhhcyIsImV2ZW50SWQiLCJ2YWx1ZXMiLCJzZWxmIiwiZXZlbnRIYW5kbGVyIiwiYXJndW1lbnRzIiwic3BsaWNlIiwicHJvbWlzZXMiLCJhbGwiLCJjdXJyZW50TWF4RW50aXR5IiwiZW50aXR5RmFjdG9yeSIsInN5c3RlbU1hbmFnZXIiLCJjb21wb25lbnRNYW5hZ2VyIiwiZW50aXR5Q29uZmlndXJhdGlvbnMiLCJjb21wb25lbnRMb29rdXAiLCJvbGRDYXBhY2l0eSIsImdldENvbXBvbmVudHMiLCJjb21wb25lbnROYW1lIiwidmFsdWUiLCJlbnRyaWVzIiwibmV3Q29tcG9uZW50IiwiZGVmaW5lUHJvcGVydHkiLCJjb25maWd1cmFibGUiLCJpc0FycmF5IiwiZ2V0RW50aXRpZXMiLCJjb25maWd1cmF0aW9uSWQiLCJjcmVhdGVDb25maWd1cmF0aW9uIiwibmFtZSIsInJlZ2lzdGVyQ29tcG9uZW50IiwiT2JqZWN0IiwicmVnaXN0ZXJJbml0aWFsaXplciIsImVudGl0eUlkIiwicmVnaXN0ZXJTeXN0ZW0iLCJyZW1vdmVTeXN0ZW0iLCJvcHRzIiwiYnVpbGQiLCJ3aXRoQ29tcG9uZW50IiwiRXJyb3IiLCJjcmVhdGUiLCJsaXN0ZW4iLCJzdG9wTGlzdGVuIiwidHJpZ2dlciIsInRyaWdnZXJEZWxheWVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSxNQUFNQSxhQUFOLENBQW9CO2tCQUNGO2FBQ0xDLElBQUw7OztXQUdHO2FBQ0VDLFlBQUwsR0FBcUIsSUFBSUMsR0FBSixFQUFyQjthQUNLQyxhQUFMLEdBQXFCLElBQUlELEdBQUosRUFBckI7Ozt3QkFHZ0JFLEVBQXBCLEVBQXdCQyxXQUF4QixFQUFxQztZQUM3QixDQUFDQyxPQUFPQyxTQUFQLENBQWlCSCxFQUFqQixDQUFELElBQXlCQSxNQUFNLENBQW5DLEVBQXNDO2tCQUM1QkksVUFBVSxnQ0FBVixDQUFOOzs7WUFHQSxPQUFPSCxXQUFQLEtBQXVCLFVBQTNCLEVBQXVDO2tCQUM3QkcsVUFBVSxpQ0FBVixDQUFOOzs7YUFHQ1AsWUFBTCxDQUFrQlEsR0FBbEIsQ0FBc0JMLEVBQXRCLEVBQTBCQyxXQUExQjs7O1lBR0k7YUFDQ0YsYUFBTCxHQUFxQixJQUFJRCxHQUFK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
