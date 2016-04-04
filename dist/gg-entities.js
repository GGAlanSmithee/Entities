(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define('GGEntities', ['exports'], factory) :
    (factory((global.GGEntities = global.GGEntities || {})));
}(this, function (exports) { 'use strict';

    var babelHelpers = {};
    babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
    };

    babelHelpers.classCallCheck = function (instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    };

    babelHelpers.createClass = function () {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
      };
    }();

    babelHelpers.slicedToArray = function () {
      function sliceIterator(arr, i) {
        var _arr = [];
        var _n = true;
        var _d = false;
        var _e = undefined;

        try {
          for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);

            if (i && _arr.length === i) break;
          }
        } catch (err) {
          _d = true;
          _e = err;
        } finally {
          try {
            if (!_n && _i["return"]) _i["return"]();
          } finally {
            if (_d) throw _e;
          }
        }

        return _arr;
      }

      return function (arr, i) {
        if (Array.isArray(arr)) {
          return arr;
        } else if (Symbol.iterator in Object(arr)) {
          return sliceIterator(arr, i);
        } else {
          throw new TypeError("Invalid attempt to destructure non-iterable instance");
        }
      };
    }();

    babelHelpers.toConsumableArray = function (arr) {
      if (Array.isArray(arr)) {
        for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

        return arr2;
      } else {
        return Array.from(arr);
      }
    };

    babelHelpers;

    var ComponentManager = function () {
        function ComponentManager() {
            babelHelpers.classCallCheck(this, ComponentManager);

            this.components = new Map();
        }

        babelHelpers.createClass(ComponentManager, [{
            key: 'newComponent',
            value: function newComponent(componentId) {
                var component = this.components.get(componentId);

                if (component === null || component === undefined) {
                    return null;
                }

                switch (typeof component === 'undefined' ? 'undefined' : babelHelpers.typeof(component)) {
                    case 'function':
                        return new component();
                    case 'object':
                        {
                            return function (component) {
                                var ret = {};

                                Object.keys(component).forEach(function (key) {
                                    return ret[key] = component[key];
                                });

                                return ret;
                            }(component);
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

                var max = Math.max.apply(Math, babelHelpers.toConsumableArray(this.components.keys()));

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
    }();

    var SystemType = {
        Logic: 0,
        Render: 1
    };

    var SystemManager = function () {
        function SystemManager() {
            babelHelpers.classCallCheck(this, SystemManager);

            this.logicSystems = new Map();
            this.renderSystems = new Map();
        }

        babelHelpers.createClass(SystemManager, [{
            key: 'registerSystem',
            value: function registerSystem(type, selector, components, callback) {
                if (type !== SystemType.Logic && type !== SystemType.Render) {
                    throw TypeError('type must be a valid SystemType.');
                }

                if (selector !== exports.SelectorType.Get && selector !== exports.SelectorType.GetWith && selector !== exports.SelectorType.GetWithOnly && selector !== exports.SelectorType.GetWithout) {
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

                var systemId = Math.max.apply(Math, [0].concat(babelHelpers.toConsumableArray(this.logicSystems.keys()), babelHelpers.toConsumableArray(this.renderSystems.keys()))) + 1;

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
                return this.logicSystems.delete(systemId) || this.renderSystems.delete(systemId);
            }
        }]);
        return SystemManager;
    }();

    var EventHandler = function () {
        function EventHandler() {
            babelHelpers.classCallCheck(this, EventHandler);

            this.events = new Map();
        }

        babelHelpers.createClass(EventHandler, [{
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
                            resolve((typeof context === 'undefined' ? 'undefined' : babelHelpers.typeof(context)) === 'object' ? callback.call.apply(callback, [context].concat(babelHelpers.toConsumableArray(args))) : callback.apply.apply(callback, [context].concat(babelHelpers.toConsumableArray(args))));
                        }, timeout);
                    });
                }

                return new Promise(function (resolve) {
                    resolve((typeof context === 'undefined' ? 'undefined' : babelHelpers.typeof(context)) === 'object' ? callback.call.apply(callback, [context].concat(babelHelpers.toConsumableArray(args))) : callback.apply.apply(callback, [context].concat(babelHelpers.toConsumableArray(args))));
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
                    eventId = Math.max.apply(Math, [eventId].concat(babelHelpers.toConsumableArray(event.keys())));
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
                                    return events.delete(eventId);
                                }
                            }
                        } catch (err) {
                            _didIteratorError2 = true;
                            _iteratorError2 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                    _iterator2.return();
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
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
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

                var _args$splice2 = babelHelpers.slicedToArray(_args$splice, 1);

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
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
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

                var _args$splice4 = babelHelpers.slicedToArray(_args$splice3, 2);

                var event = _args$splice4[0];
                var timeout = _args$splice4[1];


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
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
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
    }();

    exports.SelectorType = {
        Get: 0,
        GetWith: 1,
        GetWithOnly: 2,
        GetWithout: 3
    };

    var EntityManager = function () {
        function EntityManager() {
            var capacity = arguments.length <= 0 || arguments[0] === undefined ? 1000 : arguments[0];
            babelHelpers.classCallCheck(this, EntityManager);

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

        babelHelpers.createClass(EntityManager, [{
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

                        for (var _i = oldCapacity; _i < this.capacity; ++_i) {
                            this[componentId].push(this.componentManager.newComponent(componentId));
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
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
            value: regeneratorRuntime.mark(function getEntities(components, type) {
                var entityId, _entityId, _entityId2, _entityId3;

                return regeneratorRuntime.wrap(function getEntities$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                // todo: use these as default args when babel sorted their generator -> default args bug
                                components = components || 0;

                                if (type === undefined || type === null) {
                                    type = exports.SelectorType.GetWith;
                                }

                                _context.t0 = type;
                                _context.next = _context.t0 === exports.SelectorType.GetWith ? 5 : _context.t0 === exports.SelectorType.GetWithOnly ? 16 : _context.t0 === exports.SelectorType.GetWithout ? 27 : _context.t0 === exports.SelectorType.Get ? 38 : 48;
                                break;

                            case 5:
                                _context.t1 = regeneratorRuntime.keys(this.entities);

                            case 6:
                                if ((_context.t2 = _context.t1()).done) {
                                    _context.next = 15;
                                    break;
                                }

                                entityId = _context.t2.value;

                                if (!(entityId > this.currentMaxEntity)) {
                                    _context.next = 10;
                                    break;
                                }

                                return _context.abrupt('return');

                            case 10:
                                if (!(this.entities[entityId] !== 0 && (this.entities[entityId] & components) === components)) {
                                    _context.next = 13;
                                    break;
                                }

                                _context.next = 13;
                                return Math.floor(entityId);

                            case 13:
                                _context.next = 6;
                                break;

                            case 15:
                                return _context.abrupt('break', 48);

                            case 16:
                                _context.t3 = regeneratorRuntime.keys(this.entities);

                            case 17:
                                if ((_context.t4 = _context.t3()).done) {
                                    _context.next = 26;
                                    break;
                                }

                                _entityId = _context.t4.value;

                                if (!(_entityId > this.currentMaxEntity)) {
                                    _context.next = 21;
                                    break;
                                }

                                return _context.abrupt('return');

                            case 21:
                                if (!(this.entities[_entityId] !== 0 && this.entities[_entityId] === components)) {
                                    _context.next = 24;
                                    break;
                                }

                                _context.next = 24;
                                return Math.floor(_entityId);

                            case 24:
                                _context.next = 17;
                                break;

                            case 26:
                                return _context.abrupt('break', 48);

                            case 27:
                                _context.t5 = regeneratorRuntime.keys(this.entities);

                            case 28:
                                if ((_context.t6 = _context.t5()).done) {
                                    _context.next = 37;
                                    break;
                                }

                                _entityId2 = _context.t6.value;

                                if (!(_entityId2 > this.currentMaxEntity)) {
                                    _context.next = 32;
                                    break;
                                }

                                return _context.abrupt('return');

                            case 32:
                                if (!(this.entities[_entityId2] !== 0 && (this.entities[_entityId2] & components) !== components)) {
                                    _context.next = 35;
                                    break;
                                }

                                _context.next = 35;
                                return Math.floor(_entityId2);

                            case 35:
                                _context.next = 28;
                                break;

                            case 37:
                                return _context.abrupt('break', 48);

                            case 38:
                                _context.t7 = regeneratorRuntime.keys(this.entities);

                            case 39:
                                if ((_context.t8 = _context.t7()).done) {
                                    _context.next = 47;
                                    break;
                                }

                                _entityId3 = _context.t8.value;

                                if (!(_entityId3 > this.currentMaxEntity)) {
                                    _context.next = 43;
                                    break;
                                }

                                return _context.abrupt('return');

                            case 43:
                                _context.next = 45;
                                return Math.floor(_entityId3);

                            case 45:
                                _context.next = 39;
                                break;

                            case 47:
                                return _context.abrupt('break', 48);

                            case 48:
                            case 'end':
                                return _context.stop();
                        }
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

                var initializer = void 0;

                switch (typeof component === 'undefined' ? 'undefined' : babelHelpers.typeof(component)) {
                    case 'function':
                        initializer = component;break;
                    case 'object':
                        {
                            initializer = function initializer() {
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
                                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                            _iterator2.return();
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
                        initializer = function initializer() {
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
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
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
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
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

                return (_eventHandler$trigger = this.eventHandler.trigger).call.apply(_eventHandler$trigger, [this].concat(Array.prototype.slice.call(arguments)));
            }
        }, {
            key: 'triggerDelayed',
            value: function triggerDelayed() {
                var _eventHandler$trigger2;

                return (_eventHandler$trigger2 = this.eventHandler.triggerDelayed).call.apply(_eventHandler$trigger2, [this].concat(Array.prototype.slice.call(arguments)));
            }
        }]);
        return EntityManager;
    }();

    var EntityFactory = function () {
        function EntityFactory() {
            babelHelpers.classCallCheck(this, EntityFactory);

            this.initializers = new Map();
            this.configuration = new Map();
        }

        babelHelpers.createClass(EntityFactory, [{
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
                        if (!_iteratorNormalCompletion5 && _iterator5.return) {
                            _iterator5.return();
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
                            var _step6$value = babelHelpers.slicedToArray(_step6.value, 2);

                            var componentId = _step6$value[0];
                            var initializer = _step6$value[1];

                            if (typeof initializer !== 'function') {
                                continue;
                            }

                            var result = initializer.call(entityManager[componentId][entityId]);

                            if (typeof entityManager[componentId][entityId] !== 'function' && babelHelpers.typeof(entityManager[componentId][entityId]) !== 'object' && result !== undefined) {
                                entityManager[componentId][entityId] = result;
                            }
                        }
                    } catch (err) {
                        _didIteratorError6 = true;
                        _iteratorError6 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                _iterator6.return();
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
    }();

    var ggEntities = { EntityManager: EntityManager, SelectorType: exports.SelectorType, SystemManager: SystemManager, SystemType: SystemType, ComponentManager: ComponentManager, EventHandler: EventHandler };

    exports['default'] = ggEntities;
    exports.EntityManager = EntityManager;
    exports.SystemManager = SystemManager;
    exports.SystemType = SystemType;
    exports.ComponentManager = ComponentManager;
    exports.EventHandler = EventHandler;

}));