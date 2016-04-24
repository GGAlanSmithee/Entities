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

    var EntityFactory = function () {
        function EntityFactory() {
            babelHelpers.classCallCheck(this, EntityFactory);

            this.initializers = new Map();
            this.configuration = new Map();
        }

        babelHelpers.createClass(EntityFactory, [{
            key: 'registerInitializer',
            value: function registerInitializer(key, initializer) {
                if (typeof key !== 'string' || key === '') {
                    throw TypeError('key must be a non-empty string.');
                }

                if (typeof initializer !== 'function') {
                    throw TypeError('initializer must be a function.');
                }

                this.initializers.set(key, initializer);
            }
        }, {
            key: 'build',
            value: function build() {
                this.configuration = new Map();

                return this;
            }
        }, {
            key: 'withComponent',
            value: function withComponent(key, initializer) {
                if (typeof key !== 'string' || key === '') {
                    return this;
                }

                if (typeof initializer !== 'function') {
                    initializer = this.initializers.get(key);
                }

                this.configuration.set(key, initializer);

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

                var components = [];

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = configuration.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var component = _step.value;

                        components.push(component);
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

                var entities = [];

                for (var i = 0; i < count; ++i) {
                    var _entityManager$newEnt = entityManager.newEntity(components);

                    var id = _entityManager$newEnt.id;
                    var entity = _entityManager$newEnt.entity;


                    if (id >= entityManager.capacity) {
                        break;
                    }

                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = configuration[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var _step2$value = babelHelpers.slicedToArray(_step2.value, 2);

                            var component = _step2$value[0];
                            var initializer = _step2$value[1];

                            if (typeof initializer !== 'function') {
                                continue;
                            }

                            var result = initializer.call(entity[component]);

                            if (babelHelpers.typeof(entity[component]) !== 'object' && result !== undefined) {
                                entity[component] = result;
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

                    entities.push({ id: id, entity: entity });
                }

                return entities.length === 1 ? entities[0] : entities;
            }
        }]);
        return EntityFactory;
    }();

    var ComponentManager = function () {
        function ComponentManager() {
            babelHelpers.classCallCheck(this, ComponentManager);

            this.components = new Map();
        }

        babelHelpers.createClass(ComponentManager, [{
            key: 'newComponent',
            value: function newComponent(key) {
                var component = this.components.get(key);

                if (component == null) {
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
                    default:
                        return component;
                }
            }
        }, {
            key: 'registerComponent',
            value: function registerComponent(key, component) {
                if (typeof key !== 'string' || key === '') {
                    throw TypeError('key must be a non-empty string.');
                }

                if (component === null || component === undefined) {
                    throw TypeError('component cannot be null or undefined.');
                }

                this.components.set(key, component);

                return key;
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
        Render: 1,
        Init: 2
    };

    var SystemManager = function () {
        function SystemManager() {
            babelHelpers.classCallCheck(this, SystemManager);

            this.logicSystems = new Map();
            this.renderSystems = new Map();
            this.initSystems = new Map();
        }

        babelHelpers.createClass(SystemManager, [{
            key: 'registerSystem',
            value: function registerSystem(key, type, components, callback) {
                if (typeof key !== 'string' || key === '') {
                    throw TypeError('key must be a non-empty string.');
                }

                if (type !== SystemType.Logic && type !== SystemType.Render && type !== SystemType.Init) {
                    throw TypeError('type must be a valid SystemType.');
                }

                if (!Array.isArray(components)) {
                    throw TypeError('components argument must be an array of components.');
                }

                if (typeof callback !== 'function') {
                    throw TypeError('callback must be a function.');
                }

                var system = {
                    components: components,
                    callback: callback
                };

                switch (type) {
                    case SystemType.Logic:
                        this.logicSystems.set(key, system);break;
                    case SystemType.Render:
                        this.renderSystems.set(key, system);break;
                    case SystemType.Init:
                        this.initSystems.set(key, system);break;
                }

                return key;
            }
        }, {
            key: 'removeSystem',
            value: function removeSystem(key) {
                return this.logicSystems.delete(key) || this.renderSystems.delete(key) || this.initSystems.delete(key);
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
                return { components: [] };
            });
        }

        babelHelpers.createClass(EntityManager, [{
            key: 'increaseCapacity',
            value: function increaseCapacity() {
                var oldCapacity = this.capacity;

                this.capacity *= 2;

                this.entities = [].concat(babelHelpers.toConsumableArray(this.entities), babelHelpers.toConsumableArray(Array.from({ length: oldCapacity }, function () {
                    return { components: [] };
                })));

                for (var i = oldCapacity; i < this.capacity; ++i) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = this.componentManager.getComponents().keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var component = _step.value;

                            this.entities[i][component] = this.componentManager.newComponent(component);
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
            }
        }, {
            key: 'newEntity',
            value: function newEntity(components) {
                if (!Array.isArray(components)) {
                    throw TypeError('components argument must be an array of components.');
                }

                var id = 0;

                for (; id < this.capacity; ++id) {
                    if (this.entities[id].components.length === 0) {
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

                return { id: id, entity: this.entities[id] };
            }
        }, {
            key: 'deleteEntity',
            value: function deleteEntity(id) {
                this.entities[id].components = [];

                if (id < this.currentMaxEntity) {
                    return;
                }

                for (var i = id; i >= 0; --i) {
                    if (this.entities[i].components.length !== 0) {
                        this.currentMaxEntity = i;

                        return;
                    }
                }

                this.currentMaxEntity = 0;
            }
        }, {
            key: 'getEntities',
            value: regeneratorRuntime.mark(function getEntities() {
                var _this = this;

                var components = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

                var _loop, id;

                return regeneratorRuntime.wrap(function getEntities$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _loop = regeneratorRuntime.mark(function _loop(id) {
                                    return regeneratorRuntime.wrap(function _loop$(_context) {
                                        while (1) {
                                            switch (_context.prev = _context.next) {
                                                case 0:
                                                    if (!(components === null || components.every(function (component) {
                                                        return _this.entities[id].components.indexOf(component) !== -1;
                                                    }))) {
                                                        _context.next = 3;
                                                        break;
                                                    }

                                                    _context.next = 3;
                                                    return { id: id, entity: _this.entities[id] };

                                                case 3:
                                                case 'end':
                                                    return _context.stop();
                                            }
                                        }
                                    }, _loop, _this);
                                });
                                id = 0;

                            case 2:
                                if (!(id <= this.currentMaxEntity)) {
                                    _context2.next = 7;
                                    break;
                                }

                                return _context2.delegateYield(_loop(id), 't0', 4);

                            case 4:
                                ++id;
                                _context2.next = 2;
                                break;

                            case 7:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, getEntities, this);
            })

            // Component Manager

        }, {
            key: 'registerComponent',
            value: function registerComponent(key, component) {
                this.componentManager.registerComponent(key, component);

                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = this.entities[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var entity = _step2.value;

                        entity[key] = this.componentManager.newComponent(key);
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

                var initializer = void 0;

                switch (typeof component === 'undefined' ? 'undefined' : babelHelpers.typeof(component)) {
                    case 'function':
                        initializer = component;break;
                    case 'object':
                        {
                            initializer = function initializer() {
                                var _iteratorNormalCompletion3 = true;
                                var _didIteratorError3 = false;
                                var _iteratorError3 = undefined;

                                try {
                                    for (var _iterator3 = Object.keys(component)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                        var _key = _step3.value;

                                        this[_key] = component[_key];
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
                            };

                            break;
                        }
                    default:
                        initializer = function initializer() {
                            return component;
                        };break;
                }

                this.entityFactory.registerInitializer(key, initializer);

                return key;
            }
        }, {
            key: 'addComponent',
            value: function addComponent(id, componentKey) {
                if (this.entities[id].components.indexOf(componentKey) !== -1) {
                    return;
                }

                this.entities[id].components.push(componentKey);
            }
        }, {
            key: 'removeComponent',
            value: function removeComponent(id, component) {
                var index = this.entities[id].components.indexOf(component);

                if (index === -1) {
                    return;
                }

                this.entities[id].components.splice(index, 1);
            }

            // System Manager

        }, {
            key: 'registerSystem',
            value: function registerSystem(key, type, components, callback) {
                return this.systemManager.registerSystem(key, type, components, callback);
            }
        }, {
            key: 'registerLogicSystem',
            value: function registerLogicSystem(key, components, callback) {
                return this.systemManager.registerSystem(key, SystemType.Logic, components, callback);
            }
        }, {
            key: 'registerRenderSystem',
            value: function registerRenderSystem(key, components, callback) {
                return this.systemManager.registerSystem(key, SystemType.Render, components, callback);
            }
        }, {
            key: 'registerInitSystem',
            value: function registerInitSystem(key, components, callback) {
                return this.systemManager.registerSystem(key, SystemType.Init, components, callback);
            }
        }, {
            key: 'removeSystem',
            value: function removeSystem(key) {
                return this.systemManager.removeSystem(key);
            }
        }, {
            key: 'onLogic',
            value: function onLogic(opts) {
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = this.systemManager.logicSystems.values()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var system = _step4.value;

                        system.callback.call(this, this.getEntities(system.components), opts);
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
        }, {
            key: 'onRender',
            value: function onRender(opts) {
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = this.systemManager.renderSystems.values()[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var system = _step5.value;

                        system.callback.call(this, this.getEntities(system.components), opts);
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
            }
        }, {
            key: 'onInit',
            value: function onInit(opts) {
                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = this.systemManager.initSystems.values()[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var system = _step6.value;

                        system.callback.call(this, this.getEntities(system.components), opts);
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

    exports['default'] = EntityManager;
    exports.EntityManager = EntityManager;
    exports.EntityFactory = EntityFactory;
    exports.SystemManager = SystemManager;
    exports.SystemType = SystemType;
    exports.ComponentManager = ComponentManager;
    exports.EventHandler = EventHandler;

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2VudGl0eS1mYWN0b3J5LmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9zeXN0ZW0tbWFuYWdlci5qcyIsIi4uL3NyYy9jb3JlL2V2ZW50LWhhbmRsZXIuanMiLCIuLi9zcmMvY29yZS9lbnRpdHktbWFuYWdlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRW50aXR5TWFuYWdlciBmcm9tICcuL2VudGl0eS1tYW5hZ2VyJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRW50aXR5RmFjdG9yeSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzICA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckluaXRpYWxpemVyKGtleSwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnIHx8IGtleSA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigna2V5IG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2luaXRpYWxpemVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5pbml0aWFsaXplcnMuc2V0KGtleSwgaW5pdGlhbGl6ZXIpO1xuICAgIH1cbiAgICBcbiAgICBidWlsZCgpIHtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIHdpdGhDb21wb25lbnQoa2V5LCBpbml0aWFsaXplcikge1xuICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycgfHwga2V5ID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGluaXRpYWxpemVyID0gdGhpcy5pbml0aWFsaXplcnMuZ2V0KGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5zZXQoa2V5LCBpbml0aWFsaXplcik7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlQ29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvbjtcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGVudGl0eU1hbmFnZXIsIGNvdW50ID0gMSwgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoIShlbnRpdHlNYW5hZ2VyIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlcikpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICBjb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbiB8fCB0aGlzLmNvbmZpZ3VyYXRpb247XG4gICAgICAgIFxuICAgICAgICBsZXQgY29tcG9uZW50cyA9IFtdO1xuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIGNvbmZpZ3VyYXRpb24ua2V5cygpKSB7XG4gICAgICAgICAgICBjb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGVudGl0aWVzID0gW107XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyArK2kpIHtcbiAgICAgICAgICAgIGxldCB7IGlkLCBlbnRpdHkgfSA9IGVudGl0eU1hbmFnZXIubmV3RW50aXR5KGNvbXBvbmVudHMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGxldCBbY29tcG9uZW50LCBpbml0aWFsaXplcl0gb2YgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGluaXRpYWxpemVyLmNhbGwoZW50aXR5W2NvbXBvbmVudF0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZW50aXR5W2NvbXBvbmVudF0gIT09ICdvYmplY3QnICYmIHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZW50aXRpZXMucHVzaCh7IGlkLCBlbnRpdHkgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5sZW5ndGggPT09IDEgPyBlbnRpdGllc1swXSA6IGVudGl0aWVzO1xuICAgIH1cbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBcbiAgICBuZXdDb21wb25lbnQoa2V5KSB7XG4gICAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHMuZ2V0KGtleSk7XG4gICAgICAgIFxuICAgICAgICBpZiAoY29tcG9uZW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGNvbXBvbmVudCgpO1xuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JyAgOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgoY29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbXBvbmVudCkuZm9yRWFjaChrZXkgPT4gcmV0W2tleV0gPSBjb21wb25lbnRba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgICAgIH0pKGNvbXBvbmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJDb21wb25lbnQoa2V5LCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnIHx8IGtleSA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigna2V5IG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoY29tcG9uZW50ID09PSBudWxsIHx8IGNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2NvbXBvbmVudCBjYW5ub3QgYmUgbnVsbCBvciB1bmRlZmluZWQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5zZXQoa2V5LCBjb21wb25lbnQpO1xuXG4gICAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICAgIFxuICAgIGdldENvbXBvbmVudHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudHM7XG4gICAgfVxufSIsImV4cG9ydCBjb25zdCBTeXN0ZW1UeXBlID0ge1xuICAgIExvZ2ljICA6IDAsXG4gICAgUmVuZGVyIDogMSxcbiAgICBJbml0ICAgOiAyXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTeXN0ZW1NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5sb2dpY1N5c3RlbXMgID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnJlbmRlclN5c3RlbXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaW5pdFN5c3RlbXMgICA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0oa2V5LCB0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycgfHwga2V5ID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdrZXkgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlICE9PSBTeXN0ZW1UeXBlLkxvZ2ljICYmIHR5cGUgIT09IFN5c3RlbVR5cGUuUmVuZGVyICYmIHR5cGUgIT09IFN5c3RlbVR5cGUuSW5pdCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCd0eXBlIG11c3QgYmUgYSB2YWxpZCBTeXN0ZW1UeXBlLicpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBhcmd1bWVudCBtdXN0IGJlIGFuIGFycmF5IG9mIGNvbXBvbmVudHMuJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgc3lzdGVtID0ge1xuICAgICAgICAgICAgY29tcG9uZW50cyxcbiAgICAgICAgICAgIGNhbGxiYWNrXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Mb2dpYyA6IHRoaXMubG9naWNTeXN0ZW1zLnNldChrZXksIHN5c3RlbSk7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTeXN0ZW1UeXBlLlJlbmRlciA6IHRoaXMucmVuZGVyU3lzdGVtcy5zZXQoa2V5LCBzeXN0ZW0pOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Jbml0IDogdGhpcy5pbml0U3lzdGVtcy5zZXQoa2V5LCBzeXN0ZW0pOyBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlU3lzdGVtKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2dpY1N5c3RlbXMuZGVsZXRlKGtleSkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShrZXkpIHx8IHRoaXMuaW5pdFN5c3RlbXMuZGVsZXRlKGtleSk7XG4gICAgfVxufSIsImltcG9ydCBFbnRpdHlNYW5hZ2VyIGZyb20gJy4vZW50aXR5LW1hbmFnZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFdmVudEhhbmRsZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgXG4gICAgZW1wdHlQcm9taXNlKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBwcm9taXNlKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSB7XG4gICAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHR5cGVvZiBjb250ZXh0ID09PSAgJ29iamVjdCcgPyBjYWxsYmFjay5jYWxsKGNvbnRleHQsIC4uLmFyZ3MpIDogY2FsbGJhY2suYXBwbHkoY29udGV4dCwgLi4uYXJncykpO1xuICAgICAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUodHlwZW9mIGNvbnRleHQgPT09ICdvYmplY3QnID8gY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSA6IGNhbGxiYWNrLmFwcGx5KGNvbnRleHQsIC4uLmFyZ3MpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5ldmVudHMuaGFzKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudHMuc2V0KGV2ZW50LCBuZXcgTWFwKCkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgZXZlbnRJZCA9IC0xO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgICAgICBldmVudElkID0gTWF0aC5tYXgoZXZlbnRJZCwgLi4uZXZlbnQua2V5cygpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICArK2V2ZW50SWQ7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmV2ZW50cy5nZXQoZXZlbnQpLnNldChldmVudElkLCBjYWxsYmFjayk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZXZlbnRJZDtcbiAgICB9XG4gICAgXG4gICAgc3RvcExpc3RlbihldmVudElkKSB7XG4gICAgICAgIGZvciAobGV0IGV2ZW50cyBvZiB0aGlzLmV2ZW50cy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaWQgb2YgZXZlbnRzLmtleXMoKSkge1xuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gZXZlbnRJZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnRzLmRlbGV0ZShldmVudElkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXM7XG4gICAgICAgIFxuICAgICAgICBsZXQgYXJncyA9IEFycmF5LmZyb20oYXJndW1lbnRzKTtcbiAgICAgICAgXG4gICAgICAgIGxldCBbIGV2ZW50IF0gPSBhcmdzLnNwbGljZSgwLCAxKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5lbXB0eVByb21pc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW107XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBzZWxmLmV2ZW50cy5nZXQoZXZlbnQpLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHNlbGYucHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgMSkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyRGVsYXllZCgpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlciA/IHRoaXMuZXZlbnRIYW5kbGVyIDogdGhpcztcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpO1xuICAgICAgICBcbiAgICAgICAgbGV0IFsgZXZlbnQsIHRpbWVvdXQgXSA9IGFyZ3Muc3BsaWNlKDAsIDIpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgIU51bWJlci5pc0ludGVnZXIodGltZW91dCkgfHwgIXNlbGYuZXZlbnRzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxmLmVtcHR5UHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgcHJvbWlzZXMgPSBbXTtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2goc2VsZi5wcm9taXNlKGNhbGxiYWNrLCB0aGlzLCBhcmdzLCB0aW1lb3V0KSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gICAgfVxufSIsImltcG9ydCBFbnRpdHlGYWN0b3J5ICAgICAgICAgICAgICAgICBmcm9tICcuL2VudGl0eS1mYWN0b3J5JztcbmltcG9ydCBDb21wb25lbnRNYW5hZ2VyICAgICAgICAgICAgICBmcm9tICcuL2NvbXBvbmVudC1tYW5hZ2VyJztcbmltcG9ydCBTeXN0ZW1NYW5hZ2VyLCB7IFN5c3RlbVR5cGUgfSBmcm9tICcuL3N5c3RlbS1tYW5hZ2VyJztcbmltcG9ydCBFdmVudEhhbmRsZXIgICAgICAgICAgICAgICAgICBmcm9tICcuL2V2ZW50LWhhbmRsZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbnRpdHlNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihjYXBhY2l0eSA9IDEwMDApIHtcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAgICAgICAgID0gY2FwYWNpdHk7XG4gICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IC0xO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5ICAgID0gbmV3IEVudGl0eUZhY3RvcnkoKTtcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKTtcbiAgICAgICAgdGhpcy5jb21wb25lbnRNYW5hZ2VyID0gbmV3IENvbXBvbmVudE1hbmFnZXIoKTtcbiAgICAgICAgdGhpcy5ldmVudEhhbmRsZXIgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IEFycmF5LmZyb20oeyBsZW5ndGggOiB0aGlzLmNhcGFjaXR5IH0sICgpID0+ICh7IGNvbXBvbmVudHM6IFsgXSB9KSk7XG4gICAgfVxuICAgIFxuICAgIGluY3JlYXNlQ2FwYWNpdHkoKSB7XG4gICAgICAgIGxldCBvbGRDYXBhY2l0eSA9IHRoaXMuY2FwYWNpdHk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNhcGFjaXR5ICo9IDI7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gWy4uLnRoaXMuZW50aXRpZXMsIC4uLkFycmF5LmZyb20oeyBsZW5ndGggOiBvbGRDYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiBbIF0gfSkpXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gb2xkQ2FwYWNpdHk7IGkgPCB0aGlzLmNhcGFjaXR5OyArK2kpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudE1hbmFnZXIuZ2V0Q29tcG9uZW50cygpLmtleXMoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbaV1bY29tcG9uZW50XSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBuZXdFbnRpdHkoY29tcG9uZW50cykge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBhcmd1bWVudCBtdXN0IGJlIGFuIGFycmF5IG9mIGNvbXBvbmVudHMuJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBpZCA9IDA7XG4gICAgICAgIFxuICAgICAgICBmb3IgKDsgaWQgPCB0aGlzLmNhcGFjaXR5OyArK2lkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkID49IHRoaXMuY2FwYWNpdHkpIHtcbiAgICAgICAgICAgIC8vIHRvZG86IGF1dG8gaW5jcmVhc2UgY2FwYWNpdHk/XG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkID4gdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpZDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9IGNvbXBvbmVudHM7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBpZCwgZW50aXR5IDogdGhpcy5lbnRpdGllc1tpZF0gfTtcbiAgICB9XG4gICAgXG4gICAgZGVsZXRlRW50aXR5KGlkKSB7XG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA8IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gaWQ7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpXS5jb21wb25lbnRzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IGk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gMDtcbiAgICB9XG5cbiAgICAqZ2V0RW50aXRpZXMoY29tcG9uZW50cyA9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaWQgPSAwOyBpZCA8PSB0aGlzLmN1cnJlbnRNYXhFbnRpdHk7ICsraWQpIHtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRzID09PSBudWxsIHx8IGNvbXBvbmVudHMuZXZlcnkoY29tcG9uZW50ID0+IHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMuaW5kZXhPZihjb21wb25lbnQpICE9PSAtMSkpIHtcbiAgICAgICAgICAgICAgICB5aWVsZCB7IGlkLCBlbnRpdHkgOiB0aGlzLmVudGl0aWVzW2lkXSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIENvbXBvbmVudCBNYW5hZ2VyXG4gICAgXG4gICAgcmVnaXN0ZXJDb21wb25lbnQoa2V5LCBjb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyQ29tcG9uZW50KGtleSwgY29tcG9uZW50KTtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGVudGl0eSBvZiB0aGlzLmVudGl0aWVzKSB7XG4gICAgICAgICAgICBlbnRpdHlba2V5XSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGluaXRpYWxpemVyO1xuXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOiBpbml0aWFsaXplciA9IGNvbXBvbmVudDsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiB7XG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKGNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IGNvbXBvbmVudFtrZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDogaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGNvbXBvbmVudDsgfTsgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGtleSwgaW5pdGlhbGl6ZXIpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG4gICAgXG4gICAgYWRkQ29tcG9uZW50KGlkLCBjb21wb25lbnRLZXkpIHtcbiAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMuaW5kZXhPZihjb21wb25lbnRLZXkpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzLnB1c2goY29tcG9uZW50S2V5KTtcbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cy5pbmRleE9mKGNvbXBvbmVudCk7XG4gICAgICAgIFxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgXG4gICAgLy8gU3lzdGVtIE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlclN5c3RlbShrZXksIHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0oa2V5LCB0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjayk7XG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyTG9naWNTeXN0ZW0oa2V5LCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKGtleSwgU3lzdGVtVHlwZS5Mb2dpYywgY29tcG9uZW50cywgY2FsbGJhY2spO1xuICAgIH1cbiAgICBcbiAgICByZWdpc3RlclJlbmRlclN5c3RlbShrZXksIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0oa2V5LCBTeXN0ZW1UeXBlLlJlbmRlciwgY29tcG9uZW50cywgY2FsbGJhY2spO1xuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckluaXRTeXN0ZW0oa2V5LCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKGtleSwgU3lzdGVtVHlwZS5Jbml0LCBjb21wb25lbnRzLCBjYWxsYmFjayk7XG4gICAgfVxuICAgIFxuICAgIHJlbW92ZVN5c3RlbShrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZW1vdmVTeXN0ZW0oa2V5KTtcbiAgICB9XG4gICAgXG4gICAgb25Mb2dpYyhvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIubG9naWNTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgb25SZW5kZXIob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbmRlclN5c3RlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uSW5pdChvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIuaW5pdFN5c3RlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBFbnRpdHkgRmFjdG9yeVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudElkLCBpbml0aWFsaXplcik7XG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkuYnVpbGQoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudChjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUNvbmZpZ3VyYXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlQ29uZmlndXJhdGlvbigpO1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoY291bnQsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW50aXR5RmFjdG9yeS5jcmVhdGUodGhpcywgY291bnQsIGNvbmZpZ3VyYXRpb24pO1xuICAgIH1cbiAgICBcbiAgICAvLyBFdmVudCBIYW5kbGVyXG4gICAgXG4gICAgbGlzdGVuKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIubGlzdGVuKGV2ZW50LCBjYWxsYmFjayk7XG4gICAgfVxuICAgIFxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIuc3RvcExpc3RlbihldmVudElkKTtcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXIuY2FsbCh0aGlzLCAuLi5hcmd1bWVudHMpO1xuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyRGVsYXllZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXJEZWxheWVkLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKTtcbiAgICB9XG59Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQUVxQjtBQUNqQixJQUFBLGFBRGlCLGFBQ2pCLEdBQWM7OENBREcsZUFDSDs7QUFDVixJQUFBLGFBQUssWUFBTCxHQUFxQixJQUFJLEdBQUosRUFBckIsQ0FEVTtBQUVWLElBQUEsYUFBSyxhQUFMLEdBQXFCLElBQUksR0FBSixFQUFyQixDQUZVO1NBQWQ7O2lDQURpQjs7Z0RBTUcsS0FBSyxhQUFhO0FBQ2xDLElBQUEsZ0JBQUksT0FBTyxHQUFQLEtBQWUsUUFBZixJQUEyQixRQUFRLEVBQVIsRUFBWTtBQUN2QyxJQUFBLHNCQUFNLFVBQVUsaUNBQVYsQ0FBTixDQUR1QztpQkFBM0M7O0FBSUEsSUFBQSxnQkFBSSxPQUFPLFdBQVAsS0FBdUIs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