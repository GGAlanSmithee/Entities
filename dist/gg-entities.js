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

            this.entities = Array.from({ length: this.capacity }, () => ({ components: 0 }));
        }

        increaseCapacity() {
            const oldCapacity = this.capacity;

            this.capacity *= 2;

            this.entities = [...this.entities, ...Array.from({ length: oldCapacity }, () => ({ components: 0 }))];

            for (let i = oldCapacity; i < this.capacity; ++i) {
                const entity = this.entities[i];

                for (const componentId of this.componentManager.getComponents().keys()) {
                    entity[componentId] = this.componentManager.newComponent(componentId);
                }
            }
        }

        newEntity(components) {
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

        registerComponent(component) {
            const componentId = this.componentManager.registerComponent(component);

            for (const entity of this.entities) {
                entity[componentId] = this.componentManager.newComponent(componentId);
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
            this.entities[entityId].components |= component;
        }

        removeComponent(entityId, component) {
            this.entities[entityId].components &= ~component;
        }

        // System Manager

        registerSystem(type, components, callback) {
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
            this.entityFactory.registerInitializer(component, initializer);
        }

        build() {
            this.entityFactory.build();

            return this;
        }

        withComponent(component, initializer) {
            this.entityFactory.withComponent(component, initializer);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2VudGl0eS1mYWN0b3J5LmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9zeXN0ZW0tbWFuYWdlci5qcyIsIi4uL3NyYy9jb3JlL2V2ZW50LWhhbmRsZXIuanMiLCIuLi9zcmMvY29yZS9lbnRpdHktbWFuYWdlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcblxuY2xhc3MgRW50aXR5RmFjdG9yeSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzICA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihpZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2lkIG11c3QgYmUgYSBwb3NldGl2ZSBpbnRlZ2VyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaW5pdGlhbGl6ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzLnNldChpZCwgaW5pdGlhbGl6ZXIpXG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIHdpdGhDb21wb25lbnQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSB0aGlzLmluaXRpYWxpemVycy5nZXQoY29tcG9uZW50SWQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5zZXQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlQ29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvblxuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoZW50aXR5TWFuYWdlciwgY291bnQgPSAxLCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuY29uZmlndXJhdGlvblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gQXJyYXkuZnJvbShjb25maWd1cmF0aW9uLmtleXMoKSkucmVkdWNlKChjdXJyLCBuZXh0KSA9PiBjdXJyIHw9IG5leHQsIDApXG4gICAgICAgIFxuICAgICAgICBsZXQgZW50aXRpZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgICAgICAgICBsZXQgeyBpZCwgZW50aXR5IH0gPSBlbnRpdHlNYW5hZ2VyLm5ld0VudGl0eShjb21wb25lbnRzKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAobGV0IFtjb21wb25lbnQsIGluaXRpYWxpemVyXSBvZiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZW50aXR5W2NvbXBvbmVudF0gIT09ICdvYmplY3QnICYmIHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBlbnRpdGllcy5wdXNoKHsgaWQsIGVudGl0eSB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZW50aXRpZXMubGVuZ3RoID09PSAxID8gZW50aXRpZXNbMF0gOiBlbnRpdGllc1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5RmFjdG9yeSB9XG4iLCJjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIG5ld0NvbXBvbmVudChjb21wb25lbnRJZCkge1xuICAgICAgICBsZXQgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzLmdldChjb21wb25lbnRJZClcbiAgICAgICAgXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50KClcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCcgIDoge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKGNvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbXBvbmVudCkuZm9yRWFjaChrZXkgPT4gcmV0W2tleV0gPSBjb21wb25lbnRba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRcbiAgICAgICAgICAgICAgICB9KShjb21wb25lbnQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnRcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gbnVsbCB8fCBjb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnQgY2Fubm90IGJlIG51bGwgb3IgdW5kZWZpbmVkLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KC4uLnRoaXMuY29tcG9uZW50cy5rZXlzKCkpXG4gICAgICAgIFxuICAgICAgICBjb25zdCBpZCA9IG1heCA9PT0gdW5kZWZpbmVkIHx8IG1heCA9PT0gbnVsbCB8fCBtYXggPT09IC1JbmZpbml0eSA/IDEgOiBtYXggPT09IDAgPyAxIDogbWF4ICogMlxuXG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5zZXQoaWQsIGNvbXBvbmVudClcblxuICAgICAgICByZXR1cm4gaWRcbiAgICB9XG4gICAgXG4gICAgZ2V0Q29tcG9uZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50c1xuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XG4iLCJleHBvcnQgY29uc3QgU3lzdGVtVHlwZSA9IHtcbiAgICBMb2dpYyAgOiAwLFxuICAgIFJlbmRlciA6IDEsXG4gICAgSW5pdCAgIDogMlxufVxuXG5jbGFzcyBTeXN0ZW1NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5sb2dpY1N5c3RlbXMgID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMucmVuZGVyU3lzdGVtcyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGUgIT09IFN5c3RlbVR5cGUuTG9naWMgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5SZW5kZXIgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5Jbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ3R5cGUgbXVzdCBiZSBhIHZhbGlkIFN5c3RlbVR5cGUuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRzICE9PSAnbnVtYmVyJykgIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBtdXN0IGJlIGEgbnVtYmVyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHN5c3RlbSA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMsXG4gICAgICAgICAgICBjYWxsYmFja1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBzeXN0ZW1JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMubG9naWNTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5yZW5kZXJTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5pbml0U3lzdGVtcy5rZXlzKCkpICsgMVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuTG9naWMgOiB0aGlzLmxvZ2ljU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuUmVuZGVyIDogdGhpcy5yZW5kZXJTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Jbml0IDogdGhpcy5pbml0U3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzeXN0ZW1JZFxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naWNTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpXG4gICAgfVxufVxuXG5leHBvcnQgeyBTeXN0ZW1NYW5hZ2VyIH1cbiIsImltcG9ydCB7IEVudGl0eU1hbmFnZXIgfSBmcm9tICcuL2VudGl0eS1tYW5hZ2VyJ1xuXG5jb25zdCBlbXB0eVByb21pc2UgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICByZXNvbHZlKClcbiAgICB9KVxufVxuXG5jb25zdCBwcm9taXNlID0gKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSA9PiB7XG4gICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJlc29sdmUodHlwZW9mIGNvbnRleHQgPT09ICAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSlcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpXG4gICAgICAgIH0pXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcgPyBjYWxsYmFjay5jYWxsKGNvbnRleHQsIC4uLmFyZ3MpIDogY2FsbGJhY2suYXBwbHkoY29udGV4dCwgLi4uYXJncykpXG4gICAgfSlcbn1cbiAgICBcbmNsYXNzIEV2ZW50SGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5zZXQoZXZlbnQsIG5ldyBNYXAoKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGV2ZW50SWQgPSAtMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgICAgICBldmVudElkID0gTWF0aC5tYXgoZXZlbnRJZCwgLi4uZXZlbnQua2V5cygpKVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgICsrZXZlbnRJZFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZ2V0KGV2ZW50KS5zZXQoZXZlbnRJZCwgY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZXZlbnRJZFxuICAgIH1cbiAgICBcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcbiAgICAgICAgZm9yIChsZXQgZXZlbnRzIG9mIHRoaXMuZXZlbnRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlkID09PSBldmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudHMuZGVsZXRlKGV2ZW50SWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCwgdGltZW91dCBdID0gYXJncy5zcGxpY2UoMCwgMilcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHRpbWVvdXQpIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgdGltZW91dCkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XG4iLCJpbXBvcnQgeyBFbnRpdHlGYWN0b3J5IH0gICAgICAgICAgICAgZnJvbSAnLi9lbnRpdHktZmFjdG9yeSdcbmltcG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfSAgICAgICAgICBmcm9tICcuL2NvbXBvbmVudC1tYW5hZ2VyJ1xuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXG5pbXBvcnQgeyBFdmVudEhhbmRsZXIgfSAgICAgICAgICAgICAgZnJvbSAnLi9ldmVudC1oYW5kbGVyJ1xuXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihjYXBhY2l0eSA9IDEwMDApIHtcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAgICAgICAgID0gY2FwYWNpdHlcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeSAgICA9IG5ldyBFbnRpdHlGYWN0b3J5KClcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKVxuICAgICAgICB0aGlzLmNvbXBvbmVudE1hbmFnZXIgPSBuZXcgQ29tcG9uZW50TWFuYWdlcigpXG4gICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucyA9IG5ldyBNYXAoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IEFycmF5LmZyb20oeyBsZW5ndGggOiB0aGlzLmNhcGFjaXR5IH0sICgpID0+ICh7IGNvbXBvbmVudHM6IDAgfSkpXG4gICAgfVxuICAgIFxuICAgIGluY3JlYXNlQ2FwYWNpdHkoKSB7XG4gICAgICAgIGNvbnN0IG9sZENhcGFjaXR5ID0gdGhpcy5jYXBhY2l0eVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAqPSAyXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gWy4uLnRoaXMuZW50aXRpZXMsIC4uLkFycmF5LmZyb20oeyBsZW5ndGggOiBvbGRDYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKV1cblxuICAgICAgICBmb3IgKGxldCBpID0gb2xkQ2FwYWNpdHk7IGkgPCB0aGlzLmNhcGFjaXR5OyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnRJZCBvZiB0aGlzLmNvbXBvbmVudE1hbmFnZXIuZ2V0Q29tcG9uZW50cygpLmtleXMoKSkge1xuICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRJZF0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGNvbXBvbmVudElkKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIG5ld0VudGl0eShjb21wb25lbnRzKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRzKSB8fCBjb21wb25lbnRzIDw9IDApIHtcbiAgICAgICAgICAgIHJldHVybiB7IGlkIDogdGhpcy5jYXBhY2l0eSwgZW50aXR5IDogbnVsbCB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBpZCA9IDBcbiAgICAgICAgXG4gICAgICAgIGZvciAoOyBpZCA8IHRoaXMuY2FwYWNpdHk7ICsraWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkID49IHRoaXMuY2FwYWNpdHkpIHtcbiAgICAgICAgICAgIC8vIHRvZG86IGF1dG8gaW5jcmVhc2UgY2FwYWNpdHk/XG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPiB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IGlkXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSBjb21wb25lbnRzXG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBpZCwgZW50aXR5IDogdGhpcy5lbnRpdGllc1tpZF0gfVxuICAgIH1cbiAgICBcbiAgICBkZWxldGVFbnRpdHkoaWQpIHtcbiAgICAgICAgLy90b2RvIGFkZCBzYW5pdHkgY2hlY2tcbiAgICAgICAgdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9IDBcbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA8IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSBpZDsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVudGl0aWVzW2ldLmNvbXBvbmVudHMgIT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSAwXG4gICAgfVxuXG4gICAgLy8gRG9lcyBub3QgYWxsb3cgY29tcG9uZW50cyB0byBiZSBhbnl0aGluZyBvdGhlciB0aGFuIGEgYml0bWFzayBmb3IgcGVyZm9ybWFuY2UgcmVhc29uc1xuICAgIC8vIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGZvciBldmVyeSBzeXN0ZW0gZm9yIGV2ZXJ5IGxvb3AgKHdoaWNoIG1pZ2h0IGJlIGFzIGhpZ2ggYXMgNjAgLyBzZWNvbmQpXG4gICAgKmdldEVudGl0aWVzKGNvbXBvbmVudHMgPSAwKSB7XG4gICAgICAgIGZvciAobGV0IGlkID0gMDsgaWQgPD0gdGhpcy5jdXJyZW50TWF4RW50aXR5OyArK2lkKSB7XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50cyA9PT0gMCB8fCAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyAmIGNvbXBvbmVudHMpID09PSBjb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgeWllbGQgeyBpZCwgZW50aXR5IDogdGhpcy5lbnRpdGllc1tpZF0gfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyQ29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgY29uc3QgY29uZmlndXJhdGlvbklkID0gTWF0aC5tYXgoMCwgLi4udGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5rZXlzKCkpICsgMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5zZXQoY29uZmlndXJhdGlvbklkLCB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlQ29uZmlndXJhdGlvbigpKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbmZpZ3VyYXRpb25JZFxuICAgIH1cbiAgICBcbiAgICAvLyBDb21wb25lbnQgTWFuYWdlclxuICAgIFxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgICAgICBjb25zdCBjb21wb25lbnRJZCA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5yZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpXG4gICAgICAgIFxuICAgICAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiB0aGlzLmVudGl0aWVzKSB7XG4gICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50SWRdID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnRJZClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGluaXRpYWxpemVyXG5cbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6IGluaXRpYWxpemVyID0gY29tcG9uZW50OyBicmVha1xuICAgICAgICAgICAgY2FzZSAnb2JqZWN0Jzoge1xuICAgICAgICAgICAgICAgIGluaXRpYWxpemVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhjb21wb25lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2tleV0gPSBjb21wb25lbnRba2V5XVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6IGluaXRpYWxpemVyID0gZnVuY3Rpb24oKSB7IHJldHVybiBjb21wb25lbnQgfTsgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudElkXG4gICAgfVxuICAgIFxuICAgIGFkZENvbXBvbmVudChlbnRpdHlJZCwgY29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgfD0gY29tcG9uZW50XG4gICAgfVxuICAgIFxuICAgIHJlbW92ZUNvbXBvbmVudChlbnRpdHlJZCwgY29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgJj0gfmNvbXBvbmVudCAgIFxuICAgIH1cbiAgICBcbiAgICAvLyBTeXN0ZW0gTWFuYWdlclxuICAgIFxuICAgIHJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyTG9naWNTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5Mb2dpYywgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyUmVuZGVyU3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuUmVuZGVyLCBjb21wb25lbnRzLCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0U3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuSW5pdCwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlbW92ZVN5c3RlbShzeXN0ZW1JZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbW92ZVN5c3RlbShzeXN0ZW1JZClcbiAgICB9XG4gICAgXG4gICAgb25Mb2dpYyhvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIubG9naWNTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBvblJlbmRlcihvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIucmVuZGVyU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkluaXQob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmluaXRTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBFbnRpdHkgRmFjdG9yeVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50LCBpbml0aWFsaXplcikge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnQsIGluaXRpYWxpemVyKVxuICAgIH1cbiAgICBcbiAgICBidWlsZCgpIHtcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LmJ1aWxkKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIHdpdGhDb21wb25lbnQoY29tcG9uZW50LCBpbml0aWFsaXplcikge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudChjb21wb25lbnQsIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGNvdW50LCBjb25maWd1cmF0aW9uSWQpIHtcbiAgICAgICAgbGV0IGNvbmZpZ3VyYXRpb24gPSB1bmRlZmluZWRcbiAgICAgICAgXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGNvbmZpZ3VyYXRpb25JZCkgJiYgY29uZmlndXJhdGlvbklkID4gMCkge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuZ2V0KGNvbmZpZ3VyYXRpb25JZClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdDb3VsZCBub3QgZmluZCBlbnRpdHkgY29uZmlndXJhdGlvbi4gSWYgeW91IHdpc2ggdG8gY3JlYXRlIGVudGl0aWVzIHdpdGhvdXQgYSBjb25maWd1cmF0aW9uLCBkbyBub3QgcGFzcyBhIGNvbmZpZ3VyYXRpb25JZC4nKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZSh0aGlzLCBjb3VudCwgY29uZmlndXJhdGlvbilcbiAgICB9XG4gICAgXG4gICAgLy8gRXZlbnQgSGFuZGxlclxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLmxpc3RlbihldmVudCwgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIuc3RvcExpc3RlbihldmVudElkKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIudHJpZ2dlci5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyRGVsYXllZC5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVudGl0eU1hbmFnZXIgfVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztJQUVBLE1BQU0sYUFBTixDQUFvQjtBQUNoQixJQUFBLGtCQUFjO0FBQ1YsSUFBQSxhQUFLLFlBQUwsR0FBcUIsSUFBSSxHQUFKLEVBQXJCO0FBQ0EsSUFBQSxhQUFLLGFBQUwsR0FBcUIsSUFBSSxHQUFKLEVBQXJCO0FBQ0gsSUFBQTs7QUFFRCxJQUFBLHdCQUFvQixFQUFwQixFQUF3QixXQUF4QixFQUFxQztBQUNqQyxJQUFBLFlBQUksQ0FBQyxPQUFPLFNBQVAsQ0FBaUIsRUFBakIsQ0FBRCxJQUF5QixNQUFNLENBQW5DLEVBQXNDO0FBQ2xDLElBQUEsa0JBQU0sVUFBVSxnQ0FBVixDQUFOO0FBQ0gsSUFBQTs7QUFFRCxJQUFBLFlBQUksT0FBTyxXQUFQLEtBQXVCLFVBQTNCLEVBQXVDO0FBQ25DLElBQUEsa0JBQU0sVUFBVSxpQ0FBVixDQUFOO0FBQ0gsSUFBQTs7QUFFRCxJQUFBLGFBQUssWUFBTCxDQUFrQixHQUFsQixDQUFzQixFQUF0QixFQUEwQixXQUExQjtBQUNILElBQUE7O0FBRUQsSUFBQSxZQUFRO0FBQ0osSUFBQSxhQUFLLGFBQUwsR0FBcUIsSUFBSSxHQUFKLEVBQXJCOztBQUVBLElBQUEsZUFBTyxJQUFQO0FBQ0gsSUFBQTs7QUFFRCxJQUFBLGtCQUFjLFdBQWQsRUFBMkIsV0FBM0IsRUFBd0M7QUFDcEMsSUFBQSxZQUFJLENBQUMsT0FBTyxTQUFQLENBQWlCLFdBQWpCLENBQUQsSUFBa0MsZUFBZSxDQUFyRCxFQUF3RDtBQUNwRCxJQUFBLG1CQUFPLElBQVA7QUFDSCxJQUFBOztBQUVELElB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
