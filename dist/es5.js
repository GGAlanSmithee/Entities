'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var NoneComponent = 0;

var ComponentType = {
    Dynamic: 0,
    SemiDynamic: 1,
    Static: 2
};

exports.NoneComponent = NoneComponent;
exports.ComponentType = ComponentType;

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
        key: 'getNextComponentId',
        value: function getNextComponentId() {
            if (this.components === null || this.components === undefined) {
                this.components = new Map();
            }

            var max = Math.max.apply(Math, _toConsumableArray(this.components.keys()));

            return max === undefined || max === null || max === -Infinity ? 0 : max === 0 ? 1 : max * 2;
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
        key: 'registerComponentType',
        value: function registerComponentType(object) {
            var _this = this;

            var type = arguments[1] === undefined ? ComponentType.Static : arguments[1];
            var returnDetails = arguments[2] === undefined ? false : arguments[2];

            if (object === null || object === undefined) {
                throw TypeError('object cannot be null.');
            }

            var id = this.getNextComponentId(this.components);

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

exports.World = World;
exports.SelectorType = SelectorType;

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

        this.maxRegisteredSystemId = -1;
    }

    _createClass(SystemManager, [{
        key: 'getNextSystemId',
        value: function getNextSystemId() {
            if (!Number.isInteger(this.maxRegisteredSystemId)) {
                this.maxRegisteredSystemId = -1;
            }

            var max = this.maxRegisteredSystemId;

            this.systems.forEach(function (system) {
                max = Math.max.apply(Math, [max].concat(_toConsumableArray(system.keys())));
            });

            if (max > this.maxRegisteredSystemId) {
                this.maxRegisteredSystemId = max;
            }

            return this.maxRegisteredSystemId + 1;
        }
    }, {
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

            var systemId = this.getNextSystemId();

            this.systems.get(type).set(systemId, system);

            return this.maxRegisteredSystemId = systemId;
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
                for (var _iterator4 = this.systems[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var _step4$value = _slicedToArray(_step4.value, 2);

                    var typeSystem = _step4$value[1];
                    var _iteratorNormalCompletion5 = true;
                    var _didIteratorError5 = false;
                    var _iteratorError5 = undefined;

                    try {
                        for (var _iterator5 = typeSystem[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                            var _step5$value = _slicedToArray(_step5.value, 1);

                            var id = _step5$value[0];

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
                for (var _iterator6 = this.systems[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var _step6$value = _slicedToArray(_step6.value, 2);

                    var typeSystem = _step6$value[1];
                    var _iteratorNormalCompletion7 = true;
                    var _didIteratorError7 = false;
                    var _iteratorError7 = undefined;

                    try {
                        for (var _iterator7 = typeSystem[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                            var _step7$value = _slicedToArray(_step7.value, 1);

                            var id = _step7$value[0];

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

exports.SystemManager = SystemManager;
exports.SystemType = SystemType;

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

            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = configuration.keys()[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var component = _step8.value;

                    components |= component;
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

            var entities = [];

            for (var i = 0; i < count; ++i) {
                var entity = world.newEntity(components, true);

                if (!entity) {
                    continue;
                }

                var _iteratorNormalCompletion9 = true;
                var _didIteratorError9 = false;
                var _iteratorError9 = undefined;

                try {
                    for (var _iterator9 = configuration[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                        var _step9$value = _slicedToArray(_step9.value, 2);

                        var component = _step9$value[0];
                        var initializer = _step9$value[1];

                        if (!initializer) {
                            continue;
                        }

                        var result = initializer.call(entity[component]);

                        if (typeof entity[component] !== 'function' && typeof entity[component] !== 'object' && result !== undefined) {
                            entity[component] = result;
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

                entities.push(entity);
            }

            return entities;
        }
    }]);

    return EntityFactory;
})();

exports.EntityFactory = EntityFactory;
