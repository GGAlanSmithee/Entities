'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _core_Event = require('.core/Event');
_core_Event = 'default' in _core_Event ? _core_Event['default'] : _core_Event;

var NoneComponent = 0;

var ComponentType = {
    Dynamic: 0,
    SemiDynamic: 1,
    Static: 2
};

var SelectorType = {
    Get: 0,
    GetWith: 1,
    GetWithOnly: 2,
    GetWithout: 3
};

var World = (function () {
    function World(capacity) {
        _classCallCheck(this, World);

        this.capacity = typeof capacity === 'number' ? capacity : 100;

        this.currentMaxEntity = -1;

        this.entities = Array.from({ length: this.capacity }, function (v) {
            return v = { id: 0 };
        });

        this.components = new Map();
        this.components.set(NoneComponent, { type: null, object: null });
    }

    _createClass(World, [{
        key: 'increaseCapacity',
        value: function increaseCapacity() {
            this.capacity *= 2;

            for (var i = this.capacity / 2; i < this.capacity; ++i) {
                this.entities[i] = { id: 0 };

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = this.components[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var _step$value = _slicedToArray(_step.value, 2);

                        var key = _step$value[0];
                        var component = _step$value[1];

                        if (component.type === ComponentType.Static) {
                            this.entities[i][key] = this.newComponent(component.object);
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
        }
    }, {
        key: 'newComponent',
        value: function newComponent(object) {
            if (object === null || object === undefined) {
                return null;
            }

            switch (typeof object) {
                case 'function':
                    return new object();
                case 'object':
                    {
                        return (function (object) {
                            var ret = {};

                            Object.keys(object).forEach(function (key) {
                                return ret[key] = object[key];
                            });

                            return ret;
                        })(object);
                    }
            }

            return object;
        }
    }, {
        key: 'registerComponent',
        value: function registerComponent(object) {
            var _this = this;

            var type = arguments[1] === undefined ? ComponentType.Static : arguments[1];
            var returnDetails = arguments[2] === undefined ? false : arguments[2];

            if (object === null || object === undefined) {
                throw TypeError('object cannot be null.');
            }

            var max = Math.max.apply(Math, _toConsumableArray(this.components.keys()));

            var id = max === undefined || max === null || max === -Infinity ? 0 : max === 0 ? 1 : max * 2;

            this.components.set(id, { type: type, object: object });

            if (type === ComponentType.Static) {
                this.entities.forEach(function (entity) {
                    return entity[id] = _this.newComponent(object);
                });
            }

            return returnDetails ? this.components.get(id) : id;
        }
    }, {
        key: 'addComponent',
        value: function addComponent(entity, componentId) {
            var component = this.components.get(componentId);

            if (!component) {
                return;
            }

            if ((this.entities[entity].id & componentId) !== componentId) {
                this.entities[entity].id |= componentId;
            }

            if (component.type === ComponentType.Static || this.entities[entity][componentId] !== null && this.entities[entity][componentId] !== undefined) {
                return;
            }

            this.entities[entity][componentId] = this.newComponent(component.object);
        }
    }, {
        key: 'removeComponent',
        value: function removeComponent(entityId, componentId) {
            var component = this.components.get(componentId);

            if (!component) {
                return;
            }

            if ((this.entities[entityId].id & componentId) === componentId) {
                this.entities[entityId].id &= ~componentId;
            }

            if (component.type === ComponentType.Static || component.type === ComponentType.SemiDynamic || this.entities[entityId][componentId] === null || this.entities[entityId][componentId] === undefined) {
                return;
            }

            this.entities[entityId][componentId] = null;
        }
    }, {
        key: 'newEntity',
        value: function newEntity(components) {
            var returnDetails = arguments[1] === undefined ? false : arguments[1];

            if (typeof components !== 'number' || components <= 0) {
                return returnDetails ? null : this.capacity;
            }

            var entity = this.getFirstUnusedEntity();

            if (entity >= this.capacity) {
                return returnDetails ? null : this.capacity;
            }

            if (entity > this.currentMaxEntity) {
                this.currentMaxEntity = entity;
            }

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.components.keys()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var component = _step2.value;

                    if (component !== NoneComponent && (components & component) === component) {
                        this.addComponent(entity, component);
                    } else {
                        this.removeComponent(entity, component);
                    }
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

            return returnDetails ? this.entities[entity] : entity;
        }
    }, {
        key: 'removeEntity',
        value: function removeEntity(entity) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.components.keys()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var key = _step3.value;

                    if (key === NoneComponent) {
                        continue;
                    }

                    this.removeComponent(entity, key);
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

            if (entity <= this.currentMaxEntity) {
                return;
            }

            for (var i = entity; i >= 0; --i) {
                if (this.entities[i].id !== NoneComponent) {
                    this.currentMaxEntity = i;

                    break;
                }
            }
        }
    }, {
        key: 'getFirstUnusedEntity',
        value: function getFirstUnusedEntity() {
            var returnDetails = arguments[0] === undefined ? false : arguments[0];

            for (var entity in this.entities) {
                if (this.entities[entity].id === NoneComponent) {
                    return returnDetails ? this.entities[entity] : Math.floor(entity);
                }
            }

            return returnDetails ? null : this.capacity;
        }
    }, {
        key: 'getEntities',
        value: regeneratorRuntime.mark(function getEntities() {
            var type = arguments[0] === undefined ? SelectorType.Get : arguments[0];
            var components = arguments[1] === undefined ? NoneComponent : arguments[1];
            var returnDetails = arguments[2] === undefined ? false : arguments[2];
            var entity;
            return regeneratorRuntime.wrap(function getEntities$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        context$2$0.t0 = type;
                        context$2$0.next = context$2$0.t0 === SelectorType.GetWith ? 3 : context$2$0.t0 === SelectorType.GetWithOnly ? 14 : context$2$0.t0 === SelectorType.GetWithout ? 25 : 36;
                        break;

                    case 3:
                        context$2$0.t1 = regeneratorRuntime.keys(this.entities);

                    case 4:
                        if ((context$2$0.t2 = context$2$0.t1()).done) {
                            context$2$0.next = 13;
                            break;
                        }

                        entity = context$2$0.t2.value;

                        if (!(entity > this.currentMaxEntity)) {
                            context$2$0.next = 8;
                            break;
                        }

                        return context$2$0.abrupt('return');

                    case 8:
                        if (!(this.entities[entity].id !== NoneComponent && (this.entities[entity].id & components) === components)) {
                            context$2$0.next = 11;
                            break;
                        }

                        context$2$0.next = 11;
                        return returnDetails ? this.entities[entity] : Math.floor(entity);

                    case 11:
                        context$2$0.next = 4;
                        break;

                    case 13:
                        return context$2$0.abrupt('break', 45);

                    case 14:
                        context$2$0.t3 = regeneratorRuntime.keys(this.entities);

                    case 15:
                        if ((context$2$0.t4 = context$2$0.t3()).done) {
                            context$2$0.next = 24;
                            break;
                        }

                        entity = context$2$0.t4.value;

                        if (!(entity > this.currentMaxEntity)) {
                            context$2$0.next = 19;
                            break;
                        }

                        return context$2$0.abrupt('return');

                    case 19:
                        if (!(this.entities[entity].id !== NoneComponent && this.entities[entity].id === components)) {
                            context$2$0.next = 22;
                            break;
                        }

                        context$2$0.next = 22;
                        return returnDetails ? this.entities[entity] : Math.floor(entity);

                    case 22:
                        context$2$0.next = 15;
                        break;

                    case 24:
                        return context$2$0.abrupt('break', 45);

                    case 25:
                        context$2$0.t5 = regeneratorRuntime.keys(this.entities);

                    case 26:
                        if ((context$2$0.t6 = context$2$0.t5()).done) {
                            context$2$0.next = 35;
                            break;
                        }

                        entity = context$2$0.t6.value;

                        if (!(entity > this.currentMaxEntity)) {
                            context$2$0.next = 30;
                            break;
                        }

                        return context$2$0.abrupt('return');

                    case 30:
                        if (!(this.entities[entity].id !== NoneComponent && (this.entities[entity].id & components) !== components)) {
                            context$2$0.next = 33;
                            break;
                        }

                        context$2$0.next = 33;
                        return returnDetails ? this.entities[entity] : Math.floor(entity);

                    case 33:
                        context$2$0.next = 26;
                        break;

                    case 35:
                        return context$2$0.abrupt('break', 45);

                    case 36:
                        context$2$0.t7 = regeneratorRuntime.keys(this.entities);

                    case 37:
                        if ((context$2$0.t8 = context$2$0.t7()).done) {
                            context$2$0.next = 45;
                            break;
                        }

                        entity = context$2$0.t8.value;

                        if (!(entity > this.currentMaxEntity)) {
                            context$2$0.next = 41;
                            break;
                        }

                        return context$2$0.abrupt('return');

                    case 41:
                        context$2$0.next = 43;
                        return returnDetails ? this.entities[entity] : Math.floor(entity);

                    case 43:
                        context$2$0.next = 37;
                        break;

                    case 45:
                    case 'end':
                        return context$2$0.stop();
                }
            }, getEntities, this);
        })
    }]);

    return World;
})();

var SystemType = {
    Init: 0,
    Logic: 1,
    Render: 2,
    CleanUp: 3
};

var SystemManager = (function () {
    function SystemManager() {
        _classCallCheck(this, SystemManager);

        this.systems = new Map();

        this.systems.set(SystemType.Init, new Map());
        this.systems.set(SystemType.Logic, new Map());
        this.systems.set(SystemType.Render, new Map());
        this.systems.set(SystemType.CleanUp, new Map());
    }

    _createClass(SystemManager, [{
        key: 'addSystem',
        value: function addSystem(callback) {
            var components = arguments[1] === undefined ? NoneComponent : arguments[1];
            var type = arguments[2] === undefined ? SystemType.Logic : arguments[2];
            var selector = arguments[3] === undefined ? SelectorType.GetWith : arguments[3];

            if (typeof callback !== 'function') {
                throw TypeError('callback must be a function.');
            }

            if (!Number.isInteger(components) || components === NoneComponent) {
                components = NoneComponent;
                selector = SelectorType.Get;
            }

            var system = {
                selector: selector,
                components: components,
                callback: callback
            };

            var maxId = -1;

            this.systems.forEach(function (system) {
                maxId = Math.max.apply(Math, [maxId].concat(_toConsumableArray(system.keys())));
            });

            var systemId = maxId + 1;

            this.systems.get(type).set(systemId, system);

            return systemId;
        }
    }, {
        key: 'removeSystem',
        value: function removeSystem(system) {
            if (!Number.isInteger(system)) {
                return false;
            }

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.systems.values()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var typeSystem = _step4.value;
                    var _iteratorNormalCompletion5 = true;
                    var _didIteratorError5 = false;
                    var _iteratorError5 = undefined;

                    try {
                        for (var _iterator5 = typeSystem.keys()[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                            var id = _step5.value;

                            if (id === system) {
                                return typeSystem['delete'](system);
                            }
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

            return false;
        }
    }, {
        key: 'getSystem',
        value: function getSystem(system) {
            if (!Number.isInteger(system)) {
                return;
            }

            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = this.systems.values()[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var typeSystem = _step6.value;
                    var _iteratorNormalCompletion7 = true;
                    var _didIteratorError7 = false;
                    var _iteratorError7 = undefined;

                    try {
                        for (var _iterator7 = typeSystem.keys()[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                            var id = _step7.value;

                            if (id === system) {
                                return typeSystem.get(system);
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
        }
    }]);

    return SystemManager;
})();

var EventHandler = (function () {
    function EventHandler() {
        _classCallCheck(this, EventHandler);

        this.events = new Map();
    }

    _createClass(EventHandler, [{
        key: 'emptyPromise',
        value: function emptyPromise() {
            return new Promise(function (resolve, reject) {
                resolve();
            });
        }
    }, {
        key: 'promise',
        value: function promise(callback, context, args, timeout) {
            if (timeout) {
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        resolve(typeof context === 'object' ? callback.call.apply(callback, [context].concat(_toConsumableArray(args))) : callback.apply.apply(callback, [context].concat(_toConsumableArray(args))));
                    }, timeout);
                });
            }

            return new Promise(function (resolve, reject) {
                resolve(typeof context === 'object' ? callback.call.apply(callback, [context].concat(_toConsumableArray(args))) : callback.apply.apply(callback, [context].concat(_toConsumableArray(args))));
            });
        }
    }, {
        key: 'getNextEventId',
        value: function getNextEventId() {
            var max = -1;

            this.events.forEach(function (event) {
                max = Math.max.apply(Math, [max].concat(_toConsumableArray(event.keys())));
            });

            return max + 1;
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

            var eventId = this.getNextEventId();

            this.events.get(event).set(eventId, callback);

            return eventId;
        }
    }, {
        key: 'stopListen',
        value: function stopListen(eventId) {
            if (!Number.isInteger(eventId)) {
                return false;
            }

            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = this.events.values()[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var events = _step8.value;
                    var _iteratorNormalCompletion9 = true;
                    var _didIteratorError9 = false;
                    var _iteratorError9 = undefined;

                    try {
                        for (var _iterator9 = events.keys()[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                            var id = _step9.value;

                            if (id === eventId) {
                                return events['delete'](eventId);
                            }
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

            return false;
        }
    }, {
        key: 'trigger',
        value: function trigger() {
            var args = arguments;
            var event = Array.prototype.splice.call(args, 0, 1)[0];

            var self = this instanceof EntityManager ? this.eventHandler : this;
            var context = this;

            if (typeof event !== 'string' || !self.events.has(event)) {
                return self.emptyPromise();
            }

            var promises = [];

            var _iteratorNormalCompletion10 = true;
            var _didIteratorError10 = false;
            var _iteratorError10 = undefined;

            try {
                for (var _iterator10 = self.events.get(event).values()[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                    var callback = _step10.value;

                    promises.push(self.promise(callback, context, args));
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
    }, {
        key: 'triggerDelayed',
        value: function triggerDelayed() {
            var args = arguments;

            var event = Array.prototype.splice.call(args, 0, 1)[0];
            var timeout = Array.prototype.splice.call(args, 0, 1)[0];

            var self = this instanceof EntityManager ? this.eventHandler : this;
            var context = this;

            if (typeof event !== 'string' || !Number.isInteger(timeout) || !self.events.has(event)) {
                return self.emptyPromise();
            }

            var promises = [];

            var _iteratorNormalCompletion11 = true;
            var _didIteratorError11 = false;
            var _iteratorError11 = undefined;

            try {
                for (var _iterator11 = self.events.get(event).values()[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                    var callback = _step11.value;

                    promises.push(self.promise(callback, context, args, timeout));
                }
            } catch (err) {
                _didIteratorError11 = true;
                _iteratorError11 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion11 && _iterator11['return']) {
                        _iterator11['return']();
                    }
                } finally {
                    if (_didIteratorError11) {
                        throw _iteratorError11;
                    }
                }
            }

            return Promise.all(promises);
        }
    }]);

    return EventHandler;
})();

var EntityManager = function EntityManager() {
    var entityFactory = arguments[0] === undefined ? new EntityFactory() : arguments[0];
    var systemManager = arguments[1] === undefined ? new SystemManager() : arguments[1];
    var eventHandler = arguments[2] === undefined ? new EventHandler() : arguments[2];

    _classCallCheck(this, EntityManager);

    this.entityFactory = entityFactory;
    this.systemManager = systemManager;
    this.eventHandler = eventHandler;
};

var EntityFactory = (function () {
    function EntityFactory() {
        _classCallCheck(this, EntityFactory);

        this.initializers = new Map();
        this.configuration = new Map();
    }

    _createClass(EntityFactory, [{
        key: 'registerInitializer',
        value: function registerInitializer(component, initializer) {
            if (!Number.isInteger(component) || typeof initializer !== 'function') {
                return;
            }

            this.initializers.set(component, initializer);
        }
    }, {
        key: 'build',
        value: function build() {
            this.configuration = new Map();

            return this;
        }
    }, {
        key: 'withComponent',
        value: function withComponent(component, initializer) {
            if (!Number.isInteger(component)) {
                return this;
            }

            if (typeof initializer !== 'function') {
                initializer = this.initializers.get(component);
            }

            this.configuration.set(component, initializer);

            return this;
        }
    }, {
        key: 'createConfiguration',
        value: function createConfiguration() {
            return this.configuration;
        }
    }, {
        key: 'create',
        value: function create(world) {
            var count = arguments[1] === undefined ? 1 : arguments[1];
            var configuration = arguments[2] === undefined ? undefined : arguments[2];

            if (!(world instanceof World)) {
                return [];
            }

            configuration = configuration || this.configuration;

            var components = NoneComponent;

            var _iteratorNormalCompletion12 = true;
            var _didIteratorError12 = false;
            var _iteratorError12 = undefined;

            try {
                for (var _iterator12 = configuration.keys()[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                    var component = _step12.value;

                    components |= component;
                }
            } catch (err) {
                _didIteratorError12 = true;
                _iteratorError12 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion12 && _iterator12['return']) {
                        _iterator12['return']();
                    }
                } finally {
                    if (_didIteratorError12) {
                        throw _iteratorError12;
                    }
                }
            }

            var entities = [];

            for (var i = 0; i < count; ++i) {
                var entity = world.newEntity(components, true);

                if (!entity) {
                    continue;
                }

                var _iteratorNormalCompletion13 = true;
                var _didIteratorError13 = false;
                var _iteratorError13 = undefined;

                try {
                    for (var _iterator13 = configuration[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                        var _step13$value = _slicedToArray(_step13.value, 2);

                        var component = _step13$value[0];
                        var initializer = _step13$value[1];

                        if (!initializer) {
                            continue;
                        }

                        var result = initializer.call(entity[component]);

                        if (typeof entity[component] !== 'function' && typeof entity[component] !== 'object' && result !== undefined) {
                            entity[component] = result;
                        }
                    }
                } catch (err) {
                    _didIteratorError13 = true;
                    _iteratorError13 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion13 && _iterator13['return']) {
                            _iterator13['return']();
                        }
                    } finally {
                        if (_didIteratorError13) {
                            throw _iteratorError13;
                        }
                    }
                }

                entities.push(entity);
            }

            return entities;
        }
    }]);

    return EntityFactory;
})();

var Entities = { NoneComponent: NoneComponent,
    ComponentType: ComponentType,
    World: World,
    SelectorType: SelectorType,
    SystemManager: SystemManager,
    SystemType: SystemType,
    EventHandler: EventHandler,
    EntityManager: EntityManager,
    EntityFactory: EntityFactory };

exports['default'] = Entities;
