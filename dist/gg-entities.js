(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define('GGEntities', ['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.GGEntities = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, '__esModule', {
        value: true
    });

    var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

    var _slice = Array.prototype.slice;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

    var SystemType = {
        Logic: 0,
        Render: 1
    };

    var SystemManager = (function () {
        function SystemManager() {
            _classCallCheck(this, SystemManager);

            this.logicSystems = new Map();
            this.renderSystems = new Map();
        }

        _createClass(SystemManager, [{
            key: 'registerSystem',
            value: function registerSystem(type, selector, components, callback) {
                if (type !== SystemType.Logic && type !== SystemType.Render) {
                    throw TypeError('type must be a valid SystemType.');
                }

                if (selector !== SelectorType.Get && selector !== SelectorType.GetWith && selector !== SelectorType.GetWithOnly && selector !== SelectorType.GetWithout) {
                    throw TypeError('selector must be a valid SelectorType.');
                }

                if (typeof components !== 'number') {
                    throw TypeError('components must be a number.');
                }

                if (typeof callback !== 'function') {
                    throw TypeError('callback must be a function.');
                }

                var system = {
                    selector: selector,
                    components: components,
                    callback: callback
                };

                var systemId = Math.max.apply(Math, [0].concat(_toConsumableArray(this.logicSystems.keys()), _toConsumableArray(this.renderSystems.keys()))) + 1;

                switch (type) {
                    case SystemType.Logic:
                        this.logicSystems.set(systemId, system);break;
                    case SystemType.Render:
                        this.renderSystems.set(systemId, system);break;
                }

                return systemId;
            }
        }, {
            key: 'removeSystem',
            value: function removeSystem(systemId) {
                return this.logicSystems['delete'](systemId) || this.renderSystems['delete'](systemId);
            }
        }]);

        return SystemManager;
    })();

    var ComponentManager = (function () {
        function ComponentManager() {
            _classCallCheck(this, ComponentManager);

            this.components = new Map();
        }

        _createClass(ComponentManager, [{
            key: 'newComponent',
            value: function newComponent(componentId) {
                var component = this.components.get(componentId);

                if (component === null || component === undefined) {
                    return null;
                }

                switch (typeof component) {
                    case 'function':
                        return new component();
                    case 'object':
                        {
                            return (function (component) {
                                var ret = {};

                                Object.keys(component).forEach(function (key) {
                                    return ret[key] = component[key];
                                });

                                return ret;
                            })(component);
                        }
                }

                return component;
            }
        }, {
            key: 'registerComponent',
            value: function registerComponent(component) {
                if (component === null || component === undefined) {
                    throw TypeError('component cannot be null.');
                }

                var max = Math.max.apply(Math, _toConsumableArray(this.components.keys()));

                var id = max === undefined || max === null || max === -Infinity ? 1 : max === 0 ? 1 : max * 2;

                this.components.set(id, component);

                return id;
            }
        }, {
            key: 'getComponents',
            value: function getComponents() {
                return this.components;
            }
        }]);

        return ComponentManager;
    })();

    var SelectorType = {
        Get: 0,
        GetWith: 1,
        GetWithOnly: 2,
        GetWithout: 3
    };

    var EntityManager = (function () {
        function EntityManager() {
            var capacity = arguments.length <= 0 || arguments[0] === undefined ? 1000 : arguments[0];

            _classCallCheck(this, EntityManager);

            this.capacity = capacity;
            this.currentMaxEntity = -1;

            this.entityFactory = new EntityFactory();
            this.systemManager = new SystemManager();
            this.componentManager = new ComponentManager();
            this.eventHandler = new EventHandler();

            this.entities = Array.from({ length: this.capacity }, function () {
                return 0;
            });
        }

        _createClass(EntityManager, [{
            key: 'increaseCapacity',
            value: function increaseCapacity() {
                var oldCapacity = this.capacity;

                this.capacity *= 2;

                for (var i = oldCapacity; i < this.capacity; ++i) {
                    this.entities[i] = 0;
                }

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = this.componentManager.getComponents().keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var componentId = _step.value;

                        for (var i = oldCapacity; i < this.capacity; ++i) {
                            this[componentId].push(this.componentManager.newComponent(componentId));
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator['return']) {
                            _iterator['return']();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
        }, {
            key: 'newEntity',
            value: function newEntity(components) {
                if (typeof components !== 'number' || components <= 0) {
                    return this.capacity;
                }

                var entityId = 0;

                for (; entityId < this.capacity; ++entityId) {
                    if (this.entities[entityId] === 0) {
                        break;
                    }
                }

                if (entityId >= this.capacity) {
                    // todo: auto increase capacity?
                    return this.capacity;
                }

                if (entityId > this.currentMaxEntity) {
                    this.currentMaxEntity = entityId;
                }

                this.entities[entityId] = components;

                return entityId;
            }
        }, {
            key: 'deleteEntity',
            value: function deleteEntity(entityId) {
                this.entities[entityId] = 0;

                if (entityId < this.currentMaxEntity) {
                    return;
                }

                for (var i = entityId; i >= 0; --i) {
                    if (this.entities[i] !== 0) {
                        this.currentMaxEntity = i;

                        return;
                    }
                }
            }
        }, {
            key: 'getEntities',
            value: regeneratorRuntime.mark(function getEntities() {
                var components = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
                var type = arguments.length <= 1 || arguments[1] === undefined ? SelectorType.GetWith : arguments[1];
                var entityId;
                return regeneratorRuntime.wrap(function getEntities$(context$2$0) {
                    while (1) switch (context$2$0.prev = context$2$0.next) {
                        case 0:
                            context$2$0.t0 = type;
                            context$2$0.next = context$2$0.t0 === SelectorType.GetWith ? 3 : context$2$0.t0 === SelectorType.GetWithOnly ? 14 : context$2$0.t0 === SelectorType.GetWithout ? 25 : context$2$0.t0 === SelectorType.Get ? 36 : 46;
                            break;

                        case 3:
                            context$2$0.t1 = regeneratorRuntime.keys(this.entities);

                        case 4:
                            if ((context$2$0.t2 = context$2$0.t1()).done) {
                                context$2$0.next = 13;
                                break;
                            }

                            entityId = context$2$0.t2.value;

                            if (!(entityId > this.currentMaxEntity)) {
                                context$2$0.next = 8;
                                break;
                            }

                            return context$2$0.abrupt('return');

                        case 8:
                            if (!(this.entities[entityId] !== 0 && (this.entities[entityId] & components) === components)) {
                                context$2$0.next = 11;
                                break;
                            }

                            context$2$0.next = 11;
                            return Math.floor(entityId);

                        case 11:
                            context$2$0.next = 4;
                            break;

                        case 13:
                            return context$2$0.abrupt('break', 46);

                        case 14:
                            context$2$0.t3 = regeneratorRuntime.keys(this.entities);

                        case 15:
                            if ((context$2$0.t4 = context$2$0.t3()).done) {
                                context$2$0.next = 24;
                                break;
                            }

                            entityId = context$2$0.t4.value;

                            if (!(entityId > this.currentMaxEntity)) {
                                context$2$0.next = 19;
                                break;
                            }

                            return context$2$0.abrupt('return');

                        case 19:
                            if (!(this.entities[entityId] !== 0 && this.entities[entityId] === components)) {
                                context$2$0.next = 22;
                                break;
                            }

                            context$2$0.next = 22;
                            return Math.floor(entityId);

                        case 22:
                            context$2$0.next = 15;
                            break;

                        case 24:
                            return context$2$0.abrupt('break', 46);

                        case 25:
                            context$2$0.t5 = regeneratorRuntime.keys(this.entities);

                        case 26:
                            if ((context$2$0.t6 = context$2$0.t5()).done) {
                                context$2$0.next = 35;
                                break;
                            }

                            entityId = context$2$0.t6.value;

                            if (!(entityId > this.currentMaxEntity)) {
                                context$2$0.next = 30;
                                break;
                            }

                            return context$2$0.abrupt('return');

                        case 30:
                            if (!(this.entities[entityId] !== 0 && (this.entities[entityId] & components) !== components)) {
                                context$2$0.next = 33;
                                break;
                            }

                            context$2$0.next = 33;
                            return Math.floor(entityId);

                        case 33:
                            context$2$0.next = 26;
                            break;

                        case 35:
                            return context$2$0.abrupt('break', 46);

                        case 36:
                            context$2$0.t7 = regeneratorRuntime.keys(this.entities);

                        case 37:
                            if ((context$2$0.t8 = context$2$0.t7()).done) {
                                context$2$0.next = 45;
                                break;
                            }

                            entityId = context$2$0.t8.value;

                            if (!(entityId > this.currentMaxEntity)) {
                                context$2$0.next = 41;
                                break;
                            }

                            return context$2$0.abrupt('return');

                        case 41:
                            context$2$0.next = 43;
                            return Math.floor(entityId);

                        case 43:
                            context$2$0.next = 37;
                            break;

                        case 45:
                            return context$2$0.abrupt('break', 46);

                        case 46:
                        case 'end':
                            return context$2$0.stop();
                    }
                }, getEntities, this);
            })

            // Component Manager

        }, {
            key: 'registerComponent',
            value: function registerComponent(component) {
                var componentId = this.componentManager.registerComponent(component);

                this[componentId] = [];

                for (var i = 0; i < this.capacity; ++i) {
                    this[componentId].push(this.componentManager.newComponent(componentId));
                }

                var initializer = undefined;

                switch (typeof component) {
                    case 'function':
                        initializer = component;break;
                    case 'object':
                        {
                            initializer = function () {
                                var _iteratorNormalCompletion2 = true;
                                var _didIteratorError2 = false;
                                var _iteratorError2 = undefined;

                                try {
                                    for (var _iterator2 = Object.keys(component)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                        var key = _step2.value;

                                        this[key] = component[key];
                                    }
                                } catch (err) {
                                    _didIteratorError2 = true;
                                    _iteratorError2 = err;
                                } finally {
                                    try {
                                        if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                                            _iterator2['return']();
                                        }
                                    } finally {
                                        if (_didIteratorError2) {
                                            throw _iteratorError2;
                                        }
                                    }
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
        }, {
            key: 'addComponent',
            value: function addComponent(entityId, componentId) {
                this.entities[entityId] |= componentId;
            }
        }, {
            key: 'removeComponent',
            value: function removeComponent(entityId, componentId) {
                this.entities[entityId] &= ~componentId;
            }

            // System Manager

        }, {
            key: 'registerSystem',
            value: function registerSystem(type, selector, components, callback) {
                return this.systemManager.registerSystem(type, selector, components, callback);
            }
        }, {
            key: 'registerLogicSystem',
            value: function registerLogicSystem(selector, components, callback) {
                return this.systemManager.registerSystem(SystemType.Logic, selector, components, callback);
            }
        }, {
            key: 'registerRenderSystem',
            value: function registerRenderSystem(selector, components, callback) {
                return this.systemManager.registerSystem(SystemType.Render, selector, components, callback);
            }
        }, {
            key: 'removeSystem',
            value: function removeSystem(systemId) {
                return this.systemManager.removeSystem(systemId);
            }
        }, {
            key: 'onLogic',
            value: function onLogic(delta, opts) {
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = this.systemManager.logicSystems.values()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var system = _step3.value;

                        system.callback.call(this, this.getEntities(system.components, system.selector), delta, opts);
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                            _iterator3['return']();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }
            }
        }, {
            key: 'onRender',
            value: function onRender(delta, opts) {
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = this.systemManager.renderSystems.values()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var system = _step4.value;

                        system.callback.call(this, this.getEntities(system.components, system.selector), delta, opts);
                    }
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4['return']) {
                            _iterator4['return']();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }
            }

            // Entity Factory

        }, {
            key: 'registerInitializer',
            value: function registerInitializer(componentId, initializer) {
                this.entityFactory.registerInitializer(componentId, initializer);
            }
        }, {
            key: 'build',
            value: function build() {
                this.entityFactory.build();

                return this;
            }
        }, {
            key: 'withComponent',
            value: function withComponent(componentId, initializer) {
                this.entityFactory.withComponent(componentId, initializer);

                return this;
            }
        }, {
            key: 'createConfiguration',
            value: function createConfiguration() {
                return this.entityFactory.createConfiguration();
            }
        }, {
            key: 'create',
            value: function create(count, configuration) {
                return this.entityFactory.create(this, count, configuration);
            }

            // Event Handler

        }, {
            key: 'listen',
            value: function listen(event, callback) {
                return this.eventHandler.listen(event, callback);
            }
        }, {
            key: 'stopListen',
            value: function stopListen(eventId) {
                return this.eventHandler.stopListen(eventId);
            }
        }, {
            key: 'trigger',
            value: function trigger() {
                var _eventHandler$trigger;

                return (_eventHandler$trigger = this.eventHandler.trigger).call.apply(_eventHandler$trigger, [this].concat(_slice.call(arguments)));
            }
        }, {
            key: 'triggerDelayed',
            value: function triggerDelayed() {
                var _eventHandler$triggerDelayed;

                return (_eventHandler$triggerDelayed = this.eventHandler.triggerDelayed).call.apply(_eventHandler$triggerDelayed, [this].concat(_slice.call(arguments)));
            }
        }]);

        return EntityManager;
    })();

    var EntityFactory = (function () {
        function EntityFactory() {
            _classCallCheck(this, EntityFactory);

            this.initializers = new Map();
            this.configuration = new Map();
        }

        _createClass(EntityFactory, [{
            key: 'registerInitializer',
            value: function registerInitializer(componentId, initializer) {
                if (!Number.isInteger(componentId) || typeof initializer !== 'function') {
                    return;
                }

                this.initializers.set(componentId, initializer);
            }
        }, {
            key: 'build',
            value: function build() {
                this.configuration = new Map();

                return this;
            }
        }, {
            key: 'withComponent',
            value: function withComponent(componentId, initializer) {
                if (!Number.isInteger(componentId)) {
                    return this;
                }

                if (typeof initializer !== 'function') {
                    initializer = this.initializers.get(componentId);
                }

                this.configuration.set(componentId, initializer);

                return this;
            }
        }, {
            key: 'createConfiguration',
            value: function createConfiguration() {
                return this.configuration;
            }
        }, {
            key: 'create',
            value: function create(entityManager) {
                var count = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
                var configuration = arguments.length <= 2 || arguments[2] === undefined ? undefined : arguments[2];

                if (!(entityManager instanceof EntityManager)) {
                    return [];
                }

                configuration = configuration || this.configuration;

                var components = 0;

                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = configuration.keys()[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var component = _step5.value;

                        components |= component;
                    }
                } catch (err) {
                    _didIteratorError5 = true;
                    _iteratorError5 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion5 && _iterator5['return']) {
                            _iterator5['return']();
                        }
                    } finally {
                        if (_didIteratorError5) {
                            throw _iteratorError5;
                        }
                    }
                }

                var entities = [];

                for (var i = 0; i < count; ++i) {
                    var entityId = entityManager.newEntity(components);

                    if (entityId >= entityManager.capacity) {
                        continue;
                    }

                    var _iteratorNormalCompletion6 = true;
                    var _didIteratorError6 = false;
                    var _iteratorError6 = undefined;

                    try {
                        for (var _iterator6 = configuration[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                            var _step6$value = _slicedToArray(_step6.value, 2);

                            var componentId = _step6$value[0];
                            var initializer = _step6$value[1];

                            if (typeof initializer !== 'function') {
                                continue;
                            }

                            var result = initializer.call(entityManager[componentId][entityId]);

                            if (typeof entityManager[componentId][entityId] !== 'function' && typeof entityManager[componentId][entityId] !== 'object' && result !== undefined) {
                                entityManager[componentId][entityId] = result;
                            }
                        }
                    } catch (err) {
                        _didIteratorError6 = true;
                        _iteratorError6 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion6 && _iterator6['return']) {
                                _iterator6['return']();
                            }
                        } finally {
                            if (_didIteratorError6) {
                                throw _iteratorError6;
                            }
                        }
                    }

                    entities.push(entityId);
                }

                return entities.length === 1 ? entities[0] : entities;
            }
        }]);

        return EntityFactory;
    })();

    var EventHandler = (function () {
        function EventHandler() {
            _classCallCheck(this, EventHandler);

            this.events = new Map();
        }

        _createClass(EventHandler, [{
            key: 'emptyPromise',
            value: function emptyPromise() {
                return new Promise(function (resolve) {
                    resolve();
                });
            }
        }, {
            key: 'promise',
            value: function promise(callback, context, args, timeout) {
                if (timeout) {
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve(typeof context === 'object' ? callback.call.apply(callback, [context].concat(_toConsumableArray(args))) : callback.apply.apply(callback, [context].concat(_toConsumableArray(args))));
                        }, timeout);
                    });
                }

                return new Promise(function (resolve) {
                    resolve(typeof context === 'object' ? callback.call.apply(callback, [context].concat(_toConsumableArray(args))) : callback.apply.apply(callback, [context].concat(_toConsumableArray(args))));
                });
            }
        }, {
            key: 'listen',
            value: function listen(event, callback) {
                if (typeof event !== 'string' || typeof callback !== 'function') {
                    return;
                }

                if (!this.events.has(event)) {
                    this.events.set(event, new Map());
                }

                var eventId = -1;

                this.events.forEach(function (event) {
                    eventId = Math.max.apply(Math, [eventId].concat(_toConsumableArray(event.keys())));
                });

                ++eventId;

                this.events.get(event).set(eventId, callback);

                return eventId;
            }
        }, {
            key: 'stopListen',
            value: function stopListen(eventId) {
                var _iteratorNormalCompletion7 = true;
                var _didIteratorError7 = false;
                var _iteratorError7 = undefined;

                try {
                    for (var _iterator7 = this.events.values()[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                        var events = _step7.value;
                        var _iteratorNormalCompletion8 = true;
                        var _didIteratorError8 = false;
                        var _iteratorError8 = undefined;

                        try {
                            for (var _iterator8 = events.keys()[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                                var id = _step8.value;

                                if (id === eventId) {
                                    return events['delete'](eventId);
                                }
                            }
                        } catch (err) {
                            _didIteratorError8 = true;
                            _iteratorError8 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion8 && _iterator8['return']) {
                                    _iterator8['return']();
                                }
                            } finally {
                                if (_didIteratorError8) {
                                    throw _iteratorError8;
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError7 = true;
                    _iteratorError7 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion7 && _iterator7['return']) {
                            _iterator7['return']();
                        }
                    } finally {
                        if (_didIteratorError7) {
                            throw _iteratorError7;
                        }
                    }
                }

                return false;
            }
        }, {
            key: 'trigger',
            value: function trigger() {
                var self = this instanceof EntityManager ? this.eventHandler : this;

                var args = Array.from(arguments);

                var _args$splice = args.splice(0, 1);

                var _args$splice2 = _slicedToArray(_args$splice, 1);

                var event = _args$splice2[0];

                if (typeof event !== 'string' || !self.events.has(event)) {
                    return self.emptyPromise();
                }

                var promises = [];

                var _iteratorNormalCompletion9 = true;
                var _didIteratorError9 = false;
                var _iteratorError9 = undefined;

                try {
                    for (var _iterator9 = self.events.get(event).values()[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                        var callback = _step9.value;

                        promises.push(self.promise(callback, this, args, 1));
                    }
                } catch (err) {
                    _didIteratorError9 = true;
                    _iteratorError9 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion9 && _iterator9['return']) {
                            _iterator9['return']();
                        }
                    } finally {
                        if (_didIteratorError9) {
                            throw _iteratorError9;
                        }
                    }
                }

                return Promise.all(promises);
            }
        }, {
            key: 'triggerDelayed',
            value: function triggerDelayed() {
                var self = this instanceof EntityManager ? this.eventHandler : this;

                var args = Array.from(arguments);

                var _args$splice3 = args.splice(0, 2);

                var _args$splice32 = _slicedToArray(_args$splice3, 2);

                var event = _args$splice32[0];
                var timeout = _args$splice32[1];

                if (typeof event !== 'string' || !Number.isInteger(timeout) || !self.events.has(event)) {
                    return self.emptyPromise();
                }

                var promises = [];

                var _iteratorNormalCompletion10 = true;
                var _didIteratorError10 = false;
                var _iteratorError10 = undefined;

                try {
                    for (var _iterator10 = self.events.get(event).values()[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                        var callback = _step10.value;

                        promises.push(self.promise(callback, this, args, timeout));
                    }
                } catch (err) {
                    _didIteratorError10 = true;
                    _iteratorError10 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion10 && _iterator10['return']) {
                            _iterator10['return']();
                        }
                    } finally {
                        if (_didIteratorError10) {
                            throw _iteratorError10;
                        }
                    }
                }

                return Promise.all(promises);
            }
        }]);

        return EventHandler;
    })();

    var gg_entities = { EntityManager: EntityManager, SelectorType: SelectorType, SystemManager: SystemManager, SystemType: SystemType, ComponentManager: ComponentManager, EventHandler: EventHandler };

    exports.EntityManager = EntityManager;
    exports.SelectorType = SelectorType;
    exports.SystemManager = SystemManager;
    exports.SystemType = SystemType;
    exports.ComponentManager = ComponentManager;
    exports.EventHandler = EventHandler;
    exports['default'] = gg_entities;
});
