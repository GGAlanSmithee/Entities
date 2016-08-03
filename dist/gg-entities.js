(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define('GGEntities', ['exports'], factory) :
    (factory((global.GGEntities = global.GGEntities || {})));
}(this, function (exports) { 'use strict';

    class EntityFactory {
        constructor() {
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

        unregisterInitializer(id) {
            if (!Number.isInteger(id) || id <= 0) {
                throw TypeError('id must be a number over 0.');
            }

            return this.initializers.delete(id);
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

        unregisterComponent(componentId) {
            if (!Number.isInteger(componentId) || componentId <= 0) {
                throw TypeError('componentId must be a number over 0.');
            }

            return this.components.delete(componentId);
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

            if (this.componentLookup.get(name) !== undefined) {
                this.unregisterComponent(name);
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

        unregisterComponent(component) {
            const typeofComponent = typeof component;

            if (typeofComponent !== 'string' && typeofComponent !== 'number') {
                throw TypeError('component must be either an id or name of a registered component.');
            }

            let id = null;
            let name = null;

            if (typeofComponent === 'string') {
                id = this.componentLookup.get(component);
                name = component;
            }

            if (typeofComponent === 'number') {
                id = component;

                let kvp = Array.from(this.componentLookup.entries()).find(entry => entry[1] === component);

                if (kvp) {
                    name = kvp[0];
                }
            }

            if (id === null || name === null) {
                return false;
            }

            this.componentManager.unregisterComponent(id);

            this.componentLookup.delete(name);

            this.entityFactory.unregisterInitializer(id);

            for (const entity of this.entities) {
                if (name !== null) {
                    delete entity[name];
                }

                if (id !== null) {
                    delete entity[id];
                }
            }
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

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2VudGl0eS1mYWN0b3J5LmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9zeXN0ZW0tbWFuYWdlci5qcyIsIi4uL3NyYy9jb3JlL2V2ZW50LWhhbmRsZXIuanMiLCIuLi9zcmMvY29yZS9lbnRpdHktbWFuYWdlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcblxuY2xhc3MgRW50aXR5RmFjdG9yeSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzICA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihpZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2lkIG11c3QgYmUgYSBwb3NldGl2ZSBpbnRlZ2VyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaW5pdGlhbGl6ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzLnNldChpZCwgaW5pdGlhbGl6ZXIpXG4gICAgfVxuICAgIFxuICAgIHVucmVnaXN0ZXJJbml0aWFsaXplcihpZCkge1xuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoaWQpIHx8IGlkIDw9IDApIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaWQgbXVzdCBiZSBhIG51bWJlciBvdmVyIDAuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5pdGlhbGl6ZXJzLmRlbGV0ZShpZClcbiAgICB9XG4gICAgXG4gICAgYnVpbGQoKSB7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IG5ldyBNYXAoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgd2l0aENvbXBvbmVudChjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGNvbXBvbmVudElkKSB8fCBjb21wb25lbnRJZCA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBpbml0aWFsaXplciA9IHRoaXMuaW5pdGlhbGl6ZXJzLmdldChjb21wb25lbnRJZClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLnNldChjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGVDb25maWd1cmF0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9uXG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZShlbnRpdHlNYW5hZ2VyLCBjb3VudCA9IDEsIGNvbmZpZ3VyYXRpb24gPSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKCEoZW50aXR5TWFuYWdlciBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIpKSB7XG4gICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgfVxuICAgIFxuICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gdGhpcy5jb25maWd1cmF0aW9uXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBBcnJheS5mcm9tKGNvbmZpZ3VyYXRpb24ua2V5cygpKS5yZWR1Y2UoKGN1cnIsIG5leHQpID0+IGN1cnIgfD0gbmV4dCwgMClcbiAgICAgICAgXG4gICAgICAgIGxldCBlbnRpdGllcyA9IFtdXG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyArK2kpIHtcbiAgICAgICAgICAgIGxldCB7IGlkLCBlbnRpdHkgfSA9IGVudGl0eU1hbmFnZXIubmV3RW50aXR5KGNvbXBvbmVudHMpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChpZCA+PSBlbnRpdHlNYW5hZ2VyLmNhcGFjaXR5KSB7XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChsZXQgW2NvbXBvbmVudCwgaW5pdGlhbGl6ZXJdIG9mIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGluaXRpYWxpemVyLmNhbGwoZW50aXR5W2NvbXBvbmVudF0pXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlbnRpdHlbY29tcG9uZW50XSAhPT0gJ29iamVjdCcgJiYgcmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZW50aXR5W2NvbXBvbmVudF0gPSByZXN1bHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVudGl0aWVzLnB1c2goeyBpZCwgZW50aXR5IH0pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5sZW5ndGggPT09IDEgPyBlbnRpdGllc1swXSA6IGVudGl0aWVzXG4gICAgfVxufVxuXG5leHBvcnQgeyBFbnRpdHlGYWN0b3J5IH1cbiIsImNsYXNzIENvbXBvbmVudE1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgbmV3Q29tcG9uZW50KGNvbXBvbmVudElkKSB7XG4gICAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHMuZ2V0KGNvbXBvbmVudElkKVxuICAgICAgICBcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gbnVsbCB8fCBjb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjb21wb25lbnQoKVxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JyAgOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgoY29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXQgPSB7fVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29tcG9uZW50KS5mb3JFYWNoKGtleSA9PiByZXRba2V5XSA9IGNvbXBvbmVudFtrZXldKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldFxuICAgICAgICAgICAgICAgIH0pKGNvbXBvbmVudClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudFxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgICAgICBpZiAoY29tcG9uZW50ID09PSBudWxsIHx8IGNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2NvbXBvbmVudCBjYW5ub3QgYmUgbnVsbCBvciB1bmRlZmluZWQuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3QgbWF4ID0gTWF0aC5tYXgoLi4udGhpcy5jb21wb25lbnRzLmtleXMoKSlcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGlkID0gbWF4ID09PSB1bmRlZmluZWQgfHwgbWF4ID09PSBudWxsIHx8IG1heCA9PT0gLUluZmluaXR5ID8gMSA6IG1heCA9PT0gMCA/IDEgOiBtYXggKiAyXG5cbiAgICAgICAgdGhpcy5jb21wb25lbnRzLnNldChpZCwgY29tcG9uZW50KVxuXG4gICAgICAgIHJldHVybiBpZFxuICAgIH1cbiAgICBcbiAgICB1bnJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudElkKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnRJZCBtdXN0IGJlIGEgbnVtYmVyIG92ZXIgMC4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5jb21wb25lbnRzLmRlbGV0ZShjb21wb25lbnRJZClcbiAgICB9XG4gICAgXG4gICAgZ2V0Q29tcG9uZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50c1xuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XG4iLCJleHBvcnQgY29uc3QgU3lzdGVtVHlwZSA9IHtcbiAgICBMb2dpYyAgOiAwLFxuICAgIFJlbmRlciA6IDEsXG4gICAgSW5pdCAgIDogMlxufVxuXG5jbGFzcyBTeXN0ZW1NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5sb2dpY1N5c3RlbXMgID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMucmVuZGVyU3lzdGVtcyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGUgIT09IFN5c3RlbVR5cGUuTG9naWMgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5SZW5kZXIgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5Jbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ3R5cGUgbXVzdCBiZSBhIHZhbGlkIFN5c3RlbVR5cGUuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRzICE9PSAnbnVtYmVyJykgIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBtdXN0IGJlIGEgbnVtYmVyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHN5c3RlbSA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMsXG4gICAgICAgICAgICBjYWxsYmFja1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBzeXN0ZW1JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMubG9naWNTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5yZW5kZXJTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5pbml0U3lzdGVtcy5rZXlzKCkpICsgMVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuTG9naWMgOiB0aGlzLmxvZ2ljU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuUmVuZGVyIDogdGhpcy5yZW5kZXJTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Jbml0IDogdGhpcy5pbml0U3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzeXN0ZW1JZFxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naWNTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpXG4gICAgfVxufVxuXG5leHBvcnQgeyBTeXN0ZW1NYW5hZ2VyIH1cbiIsImltcG9ydCB7IEVudGl0eU1hbmFnZXIgfSBmcm9tICcuL2VudGl0eS1tYW5hZ2VyJ1xuXG5jb25zdCBlbXB0eVByb21pc2UgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICByZXNvbHZlKClcbiAgICB9KVxufVxuXG5jb25zdCBwcm9taXNlID0gKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSA9PiB7XG4gICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJlc29sdmUodHlwZW9mIGNvbnRleHQgPT09ICAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSlcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpXG4gICAgICAgIH0pXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcgPyBjYWxsYmFjay5jYWxsKGNvbnRleHQsIC4uLmFyZ3MpIDogY2FsbGJhY2suYXBwbHkoY29udGV4dCwgLi4uYXJncykpXG4gICAgfSlcbn1cbiAgICBcbmNsYXNzIEV2ZW50SGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5zZXQoZXZlbnQsIG5ldyBNYXAoKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGV2ZW50SWQgPSAtMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgICAgICBldmVudElkID0gTWF0aC5tYXgoZXZlbnRJZCwgLi4uZXZlbnQua2V5cygpKVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgICsrZXZlbnRJZFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZ2V0KGV2ZW50KS5zZXQoZXZlbnRJZCwgY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZXZlbnRJZFxuICAgIH1cbiAgICBcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcbiAgICAgICAgZm9yIChsZXQgZXZlbnRzIG9mIHRoaXMuZXZlbnRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlkID09PSBldmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudHMuZGVsZXRlKGV2ZW50SWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCwgdGltZW91dCBdID0gYXJncy5zcGxpY2UoMCwgMilcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHRpbWVvdXQpIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgdGltZW91dCkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XG4iLCJpbXBvcnQgeyBFbnRpdHlGYWN0b3J5IH0gICAgICAgICAgICAgZnJvbSAnLi9lbnRpdHktZmFjdG9yeSdcbmltcG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfSAgICAgICAgICBmcm9tICcuL2NvbXBvbmVudC1tYW5hZ2VyJ1xuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXG5pbXBvcnQgeyBFdmVudEhhbmRsZXIgfSAgICAgICAgICAgICAgZnJvbSAnLi9ldmVudC1oYW5kbGVyJ1xuXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihjYXBhY2l0eSA9IDEwMDApIHtcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAgICAgICAgID0gY2FwYWNpdHlcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeSAgICA9IG5ldyBFbnRpdHlGYWN0b3J5KClcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKVxuICAgICAgICB0aGlzLmNvbXBvbmVudE1hbmFnZXIgPSBuZXcgQ29tcG9uZW50TWFuYWdlcigpXG4gICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbXBvbmVudExvb2t1cCAgICAgID0gbmV3IE1hcCgpXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gQXJyYXkuZnJvbSh7IGxlbmd0aCA6IHRoaXMuY2FwYWNpdHkgfSwgKCkgPT4gKHsgY29tcG9uZW50czogMCB9KSlcbiAgICB9XG4gICAgXG4gICAgaW5jcmVhc2VDYXBhY2l0eSgpIHtcbiAgICAgICAgbGV0IG9sZENhcGFjaXR5ID0gdGhpcy5jYXBhY2l0eVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAqPSAyXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gWy4uLnRoaXMuZW50aXRpZXMsIC4uLkFycmF5LmZyb20oeyBsZW5ndGggOiBvbGRDYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKV1cblxuICAgICAgICBmb3IgKGxldCBpID0gb2xkQ2FwYWNpdHk7IGkgPCB0aGlzLmNhcGFjaXR5OyArK2kpIHtcbiAgICAgICAgICAgIGxldCBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAoY29uc3QgY29tcG9uZW50SWQgb2YgdGhpcy5jb21wb25lbnRNYW5hZ2VyLmdldENvbXBvbmVudHMoKS5rZXlzKCkpIHtcbiAgICAgICAgICAgICAgICBsZXQgY29tcG9uZW50TmFtZSA9IG51bGxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5jb21wb25lbnRMb29rdXAuZW50cmllcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gY29tcG9uZW50SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudE5hbWUgPSBrZXlcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRJZF0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGNvbXBvbmVudElkKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbnRpdHksIGNvbXBvbmVudE5hbWUsIHsgZ2V0KCkgeyByZXR1cm4gdGhpc1tjb21wb25lbnRJZF0gfSwgY29uZmlndXJhYmxlOiB0cnVlIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgbmV3RW50aXR5KGNvbXBvbmVudHMpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSBBcnJheS5mcm9tKHRoaXMuY29tcG9uZW50TG9va3VwKS5yZWR1Y2UoKGN1cnIsIG5leHQpID0+IFsnJywgY3VyclsxXSB8IG5leHRbMV1dLCBbJycsIDBdKVsxXVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY29tcG9uZW50cykgfHwgY29tcG9uZW50cyA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaWQgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgKDsgaWQgPCB0aGlzLmNhcGFjaXR5OyArK2lkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA+PSB0aGlzLmNhcGFjaXR5KSB7XG4gICAgICAgICAgICAvLyB0b2RvOiBhdXRvIGluY3JlYXNlIGNhcGFjaXR5P1xuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkID4gdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpZFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gY29tcG9uZW50c1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICB9XG4gICAgXG4gICAgZGVsZXRlRW50aXR5KGlkKSB7XG4gICAgICAgIC8vdG9kbyBhZGQgc2FuaXR5IGNoZWNrXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSAwXG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPCB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gaWQ7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpXS5jb21wb25lbnRzICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gMFxuICAgIH1cblxuICAgIC8vIERvZXMgbm90IGFsbG93IGNvbXBvbmVudHMgdG8gYmUgYW55dGhpbmcgb3RoZXIgdGhhbiBhIGJpdG1hc2sgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnNcbiAgICAvLyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBmb3IgZXZlcnkgc3lzdGVtIGZvciBldmVyeSBsb29wICh3aGljaCBtaWdodCBiZSBhcyBoaWdoIGFzIDYwIC8gc2Vjb25kKVxuICAgICpnZXRFbnRpdGllcyhjb21wb25lbnRzID0gMCkge1xuICAgICAgICBmb3IgKGxldCBpZCA9IDA7IGlkIDw9IHRoaXMuY3VycmVudE1heEVudGl0eTsgKytpZCkge1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudHMgPT09IDAgfHwgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgJiBjb21wb25lbnRzKSA9PT0gY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgIHlpZWxkIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbmZpZ3VyYXRpb24oKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMua2V5cygpKSArIDFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuc2V0KGNvbmZpZ3VyYXRpb25JZCwgdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZUNvbmZpZ3VyYXRpb24oKSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb25maWd1cmF0aW9uSWRcbiAgICB9XG4gICAgXG4gICAgLy8gQ29tcG9uZW50IE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChuYW1lLCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJyB8fCBuYW1lLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCduYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQobmFtZSkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy51bnJlZ2lzdGVyQ29tcG9uZW50KG5hbWUpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudElkID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudClcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29tcG9uZW50TG9va3VwLnNldChuYW1lLCBjb21wb25lbnRJZClcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGVudGl0eSBvZiB0aGlzLmVudGl0aWVzKSB7XG4gICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50SWRdID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnRJZClcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbnRpdHksIG5hbWUsIHsgZ2V0KCkgeyByZXR1cm4gdGhpc1tjb21wb25lbnRJZF0gfSwgY29uZmlndXJhYmxlOiB0cnVlIH0pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBpbml0aWFsaXplclxuXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOiBpbml0aWFsaXplciA9IGNvbXBvbmVudDsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6IHtcbiAgICAgICAgICAgICAgICBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoY29tcG9uZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1trZXldID0gY29tcG9uZW50W2tleV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gY29tcG9uZW50IH07IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb21wb25lbnRJZFxuICAgIH1cbiAgICBcbiAgICB1bnJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgICAgICBjb25zdCB0eXBlb2ZDb21wb25lbnQgPSB0eXBlb2YgY29tcG9uZW50XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mQ29tcG9uZW50ICE9PSAnc3RyaW5nJyAmJiB0eXBlb2ZDb21wb25lbnQgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2NvbXBvbmVudCBtdXN0IGJlIGVpdGhlciBhbiBpZCBvciBuYW1lIG9mIGEgcmVnaXN0ZXJlZCBjb21wb25lbnQuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGlkICAgPSBudWxsXG4gICAgICAgIGxldCBuYW1lID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZkNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlkICAgPSB0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KVxuICAgICAgICAgICAgbmFtZSA9IGNvbXBvbmVudFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mQ29tcG9uZW50ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaWQgPSBjb21wb25lbnRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGV0IGt2cCA9IEFycmF5LmZyb20odGhpcy5jb21wb25lbnRMb29rdXAuZW50cmllcygpKS5maW5kKGVudHJ5ID0+IGVudHJ5WzFdID09PSBjb21wb25lbnQpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChrdnApIHtcbiAgICAgICAgICAgICAgICBuYW1lID0ga3ZwWzBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA9PT0gbnVsbCB8fCBuYW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jb21wb25lbnRNYW5hZ2VyLnVucmVnaXN0ZXJDb21wb25lbnQoaWQpXG4gICAgICAgIFxuICAgICAgICB0aGlzLmNvbXBvbmVudExvb2t1cC5kZWxldGUobmFtZSlcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS51bnJlZ2lzdGVySW5pdGlhbGl6ZXIoaWQpXG4gICAgICAgIFxuICAgICAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiB0aGlzLmVudGl0aWVzKSB7XG4gICAgICAgICAgICBpZiAobmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBlbnRpdHlbbmFtZV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGlkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGVudGl0eVtpZF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBhZGRDb21wb25lbnQoZW50aXR5SWQsIGNvbXBvbmVudCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgfD0gdGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgfD0gY29tcG9uZW50XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzICY9IH50aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyAmPSB+Y29tcG9uZW50ICAgXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gU3lzdGVtIE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlclN5c3RlbSh0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xuICAgICAgICAgICAgY29tcG9uZW50cyA9IEFycmF5LmZyb20odGhpcy5jb21wb25lbnRMb29rdXApLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gWycnLCBjdXJyWzFdIHwgbmV4dFsxXV0sIFsnJywgMF0pWzFdXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyTG9naWNTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5Mb2dpYywgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyUmVuZGVyU3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuUmVuZGVyLCBjb21wb25lbnRzLCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0U3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuSW5pdCwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlbW92ZVN5c3RlbShzeXN0ZW1JZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbW92ZVN5c3RlbShzeXN0ZW1JZClcbiAgICB9XG4gICAgXG4gICAgb25Mb2dpYyhvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIubG9naWNTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBvblJlbmRlcihvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIucmVuZGVyU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkluaXQob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmluaXRTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBFbnRpdHkgRmFjdG9yeVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50LCBpbml0aWFsaXplcikge1xuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpLCBpbml0aWFsaXplcilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgYnVpbGQoKSB7XG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5idWlsZCgpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudCh0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KSwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudChjb21wb25lbnQsIGluaXRpYWxpemVyKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoY291bnQsIGNvbmZpZ3VyYXRpb25JZCkge1xuICAgICAgICBsZXQgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZFxuICAgICAgICBcbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoY29uZmlndXJhdGlvbklkKSAmJiBjb25maWd1cmF0aW9uSWQgPiAwKSB7XG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5nZXQoY29uZmlndXJhdGlvbklkKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIGVudGl0eSBjb25maWd1cmF0aW9uLiBJZiB5b3Ugd2lzaCB0byBjcmVhdGUgZW50aXRpZXMgd2l0aG91dCBhIGNvbmZpZ3VyYXRpb24sIGRvIG5vdCBwYXNzIGEgY29uZmlndXJhdGlvbklkLicpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlKHRoaXMsIGNvdW50LCBjb25maWd1cmF0aW9uKVxuICAgIH1cbiAgICBcbiAgICAvLyBFdmVudCBIYW5kbGVyXG4gICAgXG4gICAgbGlzdGVuKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIubGlzdGVuKGV2ZW50LCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgc3RvcExpc3RlbihldmVudElkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci5zdG9wTGlzdGVuKGV2ZW50SWQpXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyRGVsYXllZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXJEZWxheWVkLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKVxuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5TWFuYWdlciB9XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0lBRUEsTUFBTSxhQUFOLENBQW9CO0FBQ2hCLElBQUEsa0JBQWM7QUFDVixJQUFBLGFBQUssWUFBTCxHQUFxQixJQUFJLEdBQUosRUFBckI7QUFDQSxJQUFBLGFBQUssYUFBTCxHQUFxQixJQUFJLEdBQUosRUFBckI7QUFDSCxJQUFBOztBQUVELElBQUEsd0JBQW9CLEVBQXBCLEVBQXdCLFdBQXhCLEVBQXFDO0FBQ2pDLElBQUEsWUFBSSxDQUFDLE9BQU8sU0FBUCxDQUFpQixFQUFqQixDQUFELElBQXlCLE1BQU0sQ0FBbkMsRUFBc0M7QUFDbEMsSUFBQSxrQkFBTSxVQUFVLGdDQUFWLENBQU47QUFDSCxJQUFBOztBQUVELElBQUEsWUFBSSxPQUFPLFdBQVAsS0FBdUIsVUFBM0IsRUFBdUM7QUFDbkMsSUFBQSxrQkFBTSxVQUFVLGlDQUFWLENBQU47QUFDSCxJQUFBOztBQUVELElBQUEsYUFBSyxZQUFMLENBQWtCLEdBQWxCLENBQXNCLEVBQXRCLEVBQTBCLFdBQTFCO0FBQ0gsSUFBQTs7QUFFRCxJQUFB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
