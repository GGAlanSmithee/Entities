(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Entities = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _slice = Array.prototype.slice;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

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

exports.ComponentManager = ComponentManager;

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

exports.SystemManager = SystemManager;
exports.SystemType = SystemType;

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
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.events.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var events = _step.value;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = events.keys()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var id = _step2.value;

                            if (id === eventId) {
                                return events['delete'](eventId);
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

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = self.events.get(event).values()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var callback = _step3.value;

                    promises.push(self.promise(callback, this, args, 1));
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

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = self.events.get(event).values()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var callback = _step4.value;

                    promises.push(self.promise(callback, this, args, timeout));
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

            return Promise.all(promises);
        }
    }]);

    return EventHandler;
})();

exports.EventHandler = EventHandler;

var SelectorType = {
    Get: 0,
    GetWith: 1,
    GetWithOnly: 2,
    GetWithout: 3
};

var EntityManager = (function () {
    function EntityManager() {
        var capacity = arguments[0] === undefined ? 1000 : arguments[0];

        _classCallCheck(this, EntityManager);

        this.capacity = capacity;
        this.currentMaxEntity = -1;

        this.entityFactory = new EntityFactory();
        this.systemManager = new SystemManager();
        this.componentManager = new ComponentManager();
        this.eventHandler = new EventHandler();

        this.entities = Array.from({ length: this.capacity }, function (v) {
            return v = 0;
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

            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = this.componentManager.getComponents().keys()[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var componentId = _step5.value;

                    for (var i = oldCapacity; i < this.capacity; ++i) {
                        this[componentId].push(this.componentManager.newComponent(componentId));
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
            var components = arguments[0] === undefined ? 0 : arguments[0];
            var type = arguments[1] === undefined ? SelectorType.GetWith : arguments[1];
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
    }, {
        key: 'registerComponent',

        // Component Manager

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
                            var _iteratorNormalCompletion6 = true;
                            var _didIteratorError6 = false;
                            var _iteratorError6 = undefined;

                            try {
                                for (var _iterator6 = Object.keys(component)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                                    var key = _step6.value;

                                    this[key] = component[key];
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
    }, {
        key: 'registerSystem',

        // System Manager

        value: function registerSystem(type, selector, components, callback) {
            return this.systemManager.registerSystem(type, selector, components, callback);
        }
    }, {
        key: 'removeSystem',
        value: function removeSystem(systemId) {
            return this.systemManager.removeSystem(systemId);
        }
    }, {
        key: 'onLogic',
        value: function onLogic(delta) {
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = this.systemManager.logicSystems.values()[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var system = _step7.value;

                    system.callback.call(this, this.getEntities(system.components, system.selector), delta);
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
    }, {
        key: 'onRender',
        value: function onRender(delta) {
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = this.systemManager.renderSystems.values()[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var system = _step8.value;

                    system.callback.call(this, this.getEntities(system.components, system.selector), delta);
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
    }, {
        key: 'registerInitializer',

        // Entity Factory

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
    }, {
        key: 'listen',

        // Event Handler

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
            var count = arguments[1] === undefined ? 1 : arguments[1];
            var configuration = arguments[2] === undefined ? undefined : arguments[2];

            if (!(entityManager instanceof EntityManager)) {
                return [];
            }

            configuration = configuration || this.configuration;

            var components = 0;

            var _iteratorNormalCompletion9 = true;
            var _didIteratorError9 = false;
            var _iteratorError9 = undefined;

            try {
                for (var _iterator9 = configuration.keys()[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                    var component = _step9.value;

                    components |= component;
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

            var entities = [];

            for (var i = 0; i < count; ++i) {
                var entityId = entityManager.newEntity(components);

                if (entityId >= entityManager.capacity) {
                    continue;
                }

                var _iteratorNormalCompletion10 = true;
                var _didIteratorError10 = false;
                var _iteratorError10 = undefined;

                try {
                    for (var _iterator10 = configuration[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                        var _step10$value = _slicedToArray(_step10.value, 2);

                        var componentId = _step10$value[0];
                        var initializer = _step10$value[1];

                        if (typeof initializer !== 'function') {
                            continue;
                        }

                        var result = initializer.call(entityManager[componentId][entityId]);

                        if (typeof entityManager[componentId][entityId] !== 'function' && typeof entityManager[componentId][entityId] !== 'object' && result !== undefined) {
                            entityManager[componentId][entityId] = result;
                        }
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

                entities.push(entityId);
            }

            return entities.length === 1 ? entities[0] : entities;
        }
    }]);

    return EntityFactory;
})();

exports.EntityManager = EntityManager;
exports.SelectorType = SelectorType;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS91YnVudHUvd29ya3NwYWNlL2J1aWxkL2VudGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7SUFFUCxnQkFBZ0I7QUFDUCxhQURULGdCQUFnQixHQUNKOzhCQURaLGdCQUFnQjs7QUFFZCxZQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7S0FDL0I7O2lCQUhDLGdCQUFnQjs7ZUFLTixzQkFBQyxXQUFXLEVBQUU7QUFDdEIsZ0JBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDOztBQUVqRCxnQkFBSSxTQUFTLEtBQUssSUFBSSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7QUFDL0MsdUJBQU8sSUFBSSxDQUFDO2FBQ2Y7O0FBRUQsb0JBQVEsT0FBTyxTQUFTO0FBQ3BCLHFCQUFLLFVBQVU7QUFBRSwyQkFBTyxJQUFJLFNBQVMsRUFBRSxDQUFDO0FBQUEsQUFDeEMscUJBQUssUUFBUTtBQUFJO0FBQ2IsK0JBQU8sQ0FBQyxVQUFDLFNBQVMsRUFBSztBQUNuQixnQ0FBSSxHQUFHLEdBQUcsRUFBRSxDQUFDOztBQUViLGtDQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEdBQUc7dUNBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUM7NkJBQUEsQ0FBQyxDQUFDOztBQUVqRSxtQ0FBTyxHQUFHLENBQUM7eUJBQ2QsQ0FBQSxDQUFFLFNBQVMsQ0FBQyxDQUFDO3FCQUNqQjtBQUFBLGFBQ0o7O0FBRUQsbUJBQU8sU0FBUyxDQUFDO1NBQ3BCOzs7ZUFFZ0IsMkJBQUMsU0FBUyxFQUFFO0FBQ3pCLGdCQUFJLFNBQVMsS0FB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LFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7U0FDekQ7OztXQTVFQyxhQUFhOzs7QUErRW5CLE9BQU8sQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO0FBQ3RDLE9BQU8sQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuY2xhc3MgQ29tcG9uZW50TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgXG4gICAgbmV3Q29tcG9uZW50KGNvbXBvbmVudElkKSB7XG4gICAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHMuZ2V0KGNvbXBvbmVudElkKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzogcmV0dXJuIG5ldyBjb21wb25lbnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCcgIDoge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKGNvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge307XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb21wb25lbnQpLmZvckVhY2goa2V5ID0+IHJldFtrZXldID0gY29tcG9uZW50W2tleV0pO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgICAgICB9KShjb21wb25lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gY29tcG9uZW50O1xuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gbnVsbCB8fCBjb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnQgY2Fubm90IGJlIG51bGwuJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBtYXggPSBNYXRoLm1heCguLi50aGlzLmNvbXBvbmVudHMua2V5cygpKTtcbiAgICAgICAgXG4gICAgICAgIGxldCBpZCA9IG1heCA9PT0gdW5kZWZpbmVkIHx8IG1heCA9PT0gbnVsbCB8fCBtYXggPT09IC1JbmZpbml0eSA/IDEgOiBtYXggPT09IDAgPyAxIDogbWF4ICogMjtcblxuICAgICAgICB0aGlzLmNvbXBvbmVudHMuc2V0KGlkLCBjb21wb25lbnQpO1xuXG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG4gICAgXG4gICAgZ2V0Q29tcG9uZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50cztcbiAgICB9XG59XG5cbmV4cG9ydHMuQ29tcG9uZW50TWFuYWdlciA9IENvbXBvbmVudE1hbmFnZXI7XG5cbmNvbnN0IFN5c3RlbVR5cGUgPSB7XG4gICAgTG9naWMgICA6IDAsXG4gICAgUmVuZGVyICA6IDFcbn07XG5cbmNsYXNzIFN5c3RlbU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxvZ2ljU3lzdGVtcyAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMucmVuZGVyU3lzdGVtcyA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgc2VsZWN0b3IsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgXHRpZiAodHlwZSAhPT0gU3lzdGVtVHlwZS5Mb2dpYyAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLlJlbmRlcikge1xuICAgIFx0ICAgIHRocm93IFR5cGVFcnJvcigndHlwZSBtdXN0IGJlIGEgdmFsaWQgU3lzdGVtVHlwZS4nKTtcbiAgICBcdH1cbiAgICBcdFxuICAgIFx0aWYgKHNlbGVjdG9yICE9PSBTZWxlY3RvclR5cGUuR2V0ICYmIHNlbGVjdG9yICE9PSBTZWxlY3RvclR5cGUuR2V0V2l0aCAmJlxuICAgIFx0ICAgIHNlbGVjdG9yICE9PSBTZWxlY3RvclR5cGUuR2V0V2l0aE9ubHkgJiYgc2VsZWN0b3IgIT09IFNlbGVjdG9yVHlwZS5HZXRXaXRob3V0KSB7XG4gICAgXHQgICAgdGhyb3cgVHlwZUVycm9yKCdzZWxlY3RvciBtdXN0IGJlIGEgdmFsaWQgU2VsZWN0b3JUeXBlLicpO1xuICAgIFx0fVxuICAgIFx0XG4gICAgXHRpZiAodHlwZW9mIGNvbXBvbmVudHMgIT09ICdudW1iZXInKSAge1xuICAgIFx0XHR0aHJvdyBUeXBlRXJyb3IoJ2NvbXBvbmVudHMgbXVzdCBiZSBhIG51bWJlci4nKTtcbiAgICBcdH1cbiAgICBcdFxuICAgIFx0aWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIFx0XHR0aHJvdyBUeXBlRXJyb3IoJ2NhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICBcdH1cbiAgICBcdFxuICAgIFx0bGV0IHN5c3RlbSA9IHtcbiAgICBcdFx0c2VsZWN0b3IsXG4gICAgXHRcdGNvbXBvbmVudHMsXG4gICAgXHRcdGNhbGxiYWNrXG4gICAgXHR9O1xuICAgIFxuICAgICAgICBsZXQgc3lzdGVtSWQgPSBNYXRoLm1heCgwLCAuLi50aGlzLmxvZ2ljU3lzdGVtcy5rZXlzKCksIC4uLnRoaXMucmVuZGVyU3lzdGVtcy5rZXlzKCkpICsgMTtcbiAgICBcdFxuICAgIFx0c3dpdGNoICh0eXBlKSB7XG4gICAgXHQgICAgY2FzZSBTeXN0ZW1UeXBlLkxvZ2ljICA6IHRoaXMubG9naWNTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgIGJyZWFrO1xuICAgIFx0ICAgIGNhc2UgU3lzdGVtVHlwZS5SZW5kZXIgOiB0aGlzLnJlbmRlclN5c3RlbXMuc2V0KHN5c3RlbUlkLCBzeXN0ZW0pOyBicmVhaztcbiAgICBcdH1cblxuICAgIFx0cmV0dXJuIHN5c3RlbUlkO1xuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naWNTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCk7XG4gICAgfVxufVxuXG5leHBvcnRzLlN5c3RlbU1hbmFnZXIgPSBTeXN0ZW1NYW5hZ2VyO1xuZXhwb3J0cy5TeXN0ZW1UeXBlID0gU3lzdGVtVHlwZTtcblxuY2xhc3MgRXZlbnRIYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIFxuICAgIGVtcHR5UHJvbWlzZSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcHJvbWlzZShjYWxsYmFjaywgY29udGV4dCwgYXJncywgdGltZW91dCkge1xuICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gICdvYmplY3QnID8gY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSA6IGNhbGxiYWNrLmFwcGx5KGNvbnRleHQsIC4uLmFyZ3MpKTtcbiAgICAgICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICByZXNvbHZlKHR5cGVvZiBjb250ZXh0ID09PSAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBsaXN0ZW4oZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMuZXZlbnRzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnNldChldmVudCwgbmV3IE1hcCgpKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGV2ZW50SWQgPSAtMTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZXZlbnRzLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgICAgICAgZXZlbnRJZCA9IE1hdGgubWF4KGV2ZW50SWQsIC4uLmV2ZW50LmtleXMoKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgKytldmVudElkO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZ2V0KGV2ZW50KS5zZXQoZXZlbnRJZCwgY2FsbGJhY2spO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGV2ZW50SWQ7XG4gICAgfVxuICAgIFxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xuICAgICAgICBmb3IgKGxldCBldmVudHMgb2YgdGhpcy5ldmVudHMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGlkIG9mIGV2ZW50cy5rZXlzKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaWQgPT09IGV2ZW50SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2ZW50cy5kZWxldGUoZXZlbnRJZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXMgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyID8gdGhpcy5ldmVudEhhbmRsZXIgOiB0aGlzO1xuICAgICAgICBcbiAgICAgICAgbGV0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cyk7XG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSk7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCAhc2VsZi5ldmVudHMuaGFzKGV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYuZW1wdHlQcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBwcm9taXNlcyA9IFtdO1xuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2Ygc2VsZi5ldmVudHMuZ2V0KGV2ZW50KS52YWx1ZXMoKSkge1xuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChzZWxmLnByb21pc2UoY2FsbGJhY2ssIHRoaXMsIGFyZ3MsIDEpKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXM7XG4gICAgICAgIFxuICAgICAgICBsZXQgYXJncyA9IEFycmF5LmZyb20oYXJndW1lbnRzKTtcbiAgICAgICAgXG4gICAgICAgIGxldCBbIGV2ZW50LCB0aW1lb3V0IF0gPSBhcmdzLnNwbGljZSgwLCAyKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHRpbWVvdXQpIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5lbXB0eVByb21pc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW107XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBzZWxmLmV2ZW50cy5nZXQoZXZlbnQpLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHNlbGYucHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgdGltZW91dCkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIH1cbn1cblxuZXhwb3J0cy5FdmVudEhhbmRsZXIgPSBFdmVudEhhbmRsZXI7XG5cbmNvbnN0IFNlbGVjdG9yVHlwZSA9IHtcbiAgICBHZXQgICAgICAgICA6IDAsXG4gICAgR2V0V2l0aCAgICAgOiAxLFxuICAgIEdldFdpdGhPbmx5IDogMixcbiAgICBHZXRXaXRob3V0ICA6IDNcbn07XG5cbmNsYXNzIEVudGl0eU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKGNhcGFjaXR5ID0gMTAwMCkge1xuICAgICAgICB0aGlzLmNhcGFjaXR5ICAgICAgICAgPSBjYXBhY2l0eTtcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTE7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkgICAgPSBuZXcgRW50aXR5RmFjdG9yeSgpO1xuICAgICAgICB0aGlzLnN5c3RlbU1hbmFnZXIgICAgPSBuZXcgU3lzdGVtTWFuYWdlcigpO1xuICAgICAgICB0aGlzLmNvbXBvbmVudE1hbmFnZXIgPSBuZXcgQ29tcG9uZW50TWFuYWdlcigpO1xuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlciAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogdGhpcy5jYXBhY2l0eSB9LCB2ID0+IHYgPSAwKTtcbiAgICB9XG4gICAgXG4gICAgaW5jcmVhc2VDYXBhY2l0eSgpIHtcbiAgICAgICAgbGV0IG9sZENhcGFjaXR5ID0gdGhpcy5jYXBhY2l0eTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2FwYWNpdHkgKj0gMjtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSBvbGRDYXBhY2l0eTsgaSA8IHRoaXMuY2FwYWNpdHk7ICsraSkge1xuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tpXSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNvbXBvbmVudElkIG9mIHRoaXMuY29tcG9uZW50TWFuYWdlci5nZXRDb21wb25lbnRzKCkua2V5cygpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gb2xkQ2FwYWNpdHk7IGkgPCB0aGlzLmNhcGFjaXR5OyArK2kpIHtcbiAgICAgICAgICAgICAgICB0aGlzW2NvbXBvbmVudElkXS5wdXNoKHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoY29tcG9uZW50SWQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBuZXdFbnRpdHkoY29tcG9uZW50cykge1xuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudHMgIT09ICdudW1iZXInIHx8IGNvbXBvbmVudHMgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FwYWNpdHk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBlbnRpdHlJZCA9IDA7XG4gICAgICAgIFxuICAgICAgICBmb3IgKDsgZW50aXR5SWQgPCB0aGlzLmNhcGFjaXR5OyArK2VudGl0eUlkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tlbnRpdHlJZF0gPT09IDApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGVudGl0eUlkID49IHRoaXMuY2FwYWNpdHkpIHtcbiAgICAgICAgICAgIC8vIHRvZG86IGF1dG8gaW5jcmVhc2UgY2FwYWNpdHk/XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYXBhY2l0eTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGVudGl0eUlkID4gdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBlbnRpdHlJZDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0gPSBjb21wb25lbnRzO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGVudGl0eUlkO1xuICAgIH1cbiAgICBcbiAgICBkZWxldGVFbnRpdHkoZW50aXR5SWQpIHtcbiAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0gPSAwO1xuICAgICAgICBcbiAgICAgICAgaWYgKGVudGl0eUlkIDwgdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSBlbnRpdHlJZDsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVudGl0aWVzW2ldICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgKmdldEVudGl0aWVzKGNvbXBvbmVudHMgPSAwLCB0eXBlID0gU2VsZWN0b3JUeXBlLkdldFdpdGgpIHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFNlbGVjdG9yVHlwZS5HZXRXaXRoOiB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZW50aXR5SWQgaW4gdGhpcy5lbnRpdGllcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5SWQgPiB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbZW50aXR5SWRdICE9PSAwICYmICh0aGlzLmVudGl0aWVzW2VudGl0eUlkXSAmIGNvbXBvbmVudHMpID09PSBjb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5aWVsZCBNYXRoLmZsb29yKGVudGl0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgU2VsZWN0b3JUeXBlLkdldFdpdGhPbmx5OiB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZW50aXR5SWQgaW4gdGhpcy5lbnRpdGllcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5SWQgPiB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbZW50aXR5SWRdICE9PSAwICYmIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdID09PSBjb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5aWVsZCBNYXRoLmZsb29yKGVudGl0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgU2VsZWN0b3JUeXBlLkdldFdpdGhvdXQ6IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBlbnRpdHlJZCBpbiB0aGlzLmVudGl0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbnRpdHlJZCA+IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tlbnRpdHlJZF0gIT09IDAgJiYgKHRoaXMuZW50aXRpZXNbZW50aXR5SWRdICYgY29tcG9uZW50cykgIT09IGNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHlpZWxkIE1hdGguZmxvb3IoZW50aXR5SWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBTZWxlY3RvclR5cGUuR2V0OiB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZW50aXR5SWQgaW4gdGhpcy5lbnRpdGllcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW50aXR5SWQgPiB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgeWllbGQgTWF0aC5mbG9vcihlbnRpdHlJZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29tcG9uZW50IE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICAgICAgbGV0IGNvbXBvbmVudElkID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzW2NvbXBvbmVudElkXSA9IFtdO1xuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhcGFjaXR5OyArK2kpIHtcbiAgICAgICAgICAgIHRoaXNbY29tcG9uZW50SWRdLnB1c2godGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnRJZCkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaW5pdGlhbGl6ZXI7XG5cbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6IGluaXRpYWxpemVyID0gY29tcG9uZW50OyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6IHtcbiAgICAgICAgICAgICAgICBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoY29tcG9uZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1trZXldID0gY29tcG9uZW50W2tleV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gY29tcG9uZW50OyB9OyBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb21wb25lbnRJZDtcbiAgICB9XG4gICAgXG4gICAgYWRkQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnRJZCkge1xuICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXSB8PSBjb21wb25lbnRJZDtcbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnRJZCkge1xuICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXSAmPSB+Y29tcG9uZW50SWQ7XG4gICAgfVxuICAgIFxuICAgIC8vIFN5c3RlbSBNYW5hZ2VyXG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgc2VsZWN0b3IsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0odHlwZSwgc2VsZWN0b3IsIGNvbXBvbmVudHMsIGNhbGxiYWNrKTtcbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlU3lzdGVtKHN5c3RlbUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVtb3ZlU3lzdGVtKHN5c3RlbUlkKTtcbiAgICB9XG4gICAgXG4gICAgb25Mb2dpYyhkZWx0YSkge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmxvZ2ljU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cywgc3lzdGVtLnNlbGVjdG9yKSwgZGVsdGEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIG9uUmVuZGVyKGRlbHRhKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIucmVuZGVyU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cywgc3lzdGVtLnNlbGVjdG9yKSwgZGVsdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRW50aXR5IEZhY3RvcnlcbiAgICBcbiAgICByZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpO1xuICAgIH1cbiAgICBcbiAgICBidWlsZCgpIHtcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LmJ1aWxkKCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgd2l0aENvbXBvbmVudChjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGVDb25maWd1cmF0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZUNvbmZpZ3VyYXRpb24oKTtcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGNvdW50LCBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlKHRoaXMsIGNvdW50LCBjb25maWd1cmF0aW9uKTtcbiAgICB9XG4gICAgXG4gICAgLy8gRXZlbnQgSGFuZGxlclxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLmxpc3RlbihldmVudCwgY2FsbGJhY2spO1xuICAgIH1cbiAgICBcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnN0b3BMaXN0ZW4oZXZlbnRJZCk7XG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKTtcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyRGVsYXllZC5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cyk7XG4gICAgfVxufVxuXG5jbGFzcyBFbnRpdHlGYWN0b3J5IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplcnMgID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgdHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzLnNldChjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpO1xuICAgIH1cbiAgICBcbiAgICBidWlsZCgpIHtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIHdpdGhDb21wb25lbnQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBpbml0aWFsaXplciA9IHRoaXMuaW5pdGlhbGl6ZXJzLmdldChjb21wb25lbnRJZCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5zZXQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGVDb25maWd1cmF0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9uO1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoZW50aXR5TWFuYWdlciwgY291bnQgPSAxLCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGNvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uIHx8IHRoaXMuY29uZmlndXJhdGlvbjtcblxuICAgICAgICBsZXQgY29tcG9uZW50cyA9IDA7XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgY29uZmlndXJhdGlvbi5rZXlzKCkpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMgfD0gY29tcG9uZW50O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgZW50aXRpZXMgPSBbXTtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICAgICAgICAgICAgbGV0IGVudGl0eUlkID0gZW50aXR5TWFuYWdlci5uZXdFbnRpdHkoY29tcG9uZW50cyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChlbnRpdHlJZCA+PSBlbnRpdHlNYW5hZ2VyLmNhcGFjaXR5KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAobGV0IFtjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXJdIG9mIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gaW5pdGlhbGl6ZXIuY2FsbChlbnRpdHlNYW5hZ2VyW2NvbXBvbmVudElkXVtlbnRpdHlJZF0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZW50aXR5TWFuYWdlcltjb21wb25lbnRJZF1bZW50aXR5SWRdICE9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBlbnRpdHlNYW5hZ2VyW2NvbXBvbmVudElkXVtlbnRpdHlJZF0gIT09ICdvYmplY3QnICYmIHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eU1hbmFnZXJbY29tcG9uZW50SWRdW2VudGl0eUlkXSA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVudGl0aWVzLnB1c2goZW50aXR5SWQpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZW50aXRpZXMubGVuZ3RoID09PSAxID8gZW50aXRpZXNbMF0gOiBlbnRpdGllcztcbiAgICB9XG59XG5cbmV4cG9ydHMuRW50aXR5TWFuYWdlciA9IEVudGl0eU1hbmFnZXI7XG5leHBvcnRzLlNlbGVjdG9yVHlwZSA9IFNlbGVjdG9yVHlwZTtcblxuIl19
