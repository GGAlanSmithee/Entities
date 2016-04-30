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

            this.entityConfigurations = new Map();
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
        }, {
            key: 'registerConfiguration',
            value: function registerConfiguration(key) {
                if (typeof key !== 'string' || key === '') {
                    throw TypeError('key must be a non empty string.');
                }

                this.entityConfigurations.set(key, this.entityFactory.createConfiguration());

                return key;
            }

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
            key: 'create',
            value: function create(count, key) {
                var configuration = undefined;

                if (typeof key === 'string') {
                    configuration = this.entityConfigurations.get(key);

                    if (configuration === undefined) {
                        throw TypeError('could not find entity configuration for the supplied key. if you wish to create an entity without a configuration, do not pass a key.');
                    }
                }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2VudGl0eS1mYWN0b3J5LmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9zeXN0ZW0tbWFuYWdlci5qcyIsIi4uL3NyYy9jb3JlL2V2ZW50LWhhbmRsZXIuanMiLCIuLi9zcmMvY29yZS9lbnRpdHktbWFuYWdlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRW50aXR5TWFuYWdlciBmcm9tICcuL2VudGl0eS1tYW5hZ2VyJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbnRpdHlGYWN0b3J5IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplcnMgID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IG5ldyBNYXAoKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckluaXRpYWxpemVyKGtleSwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnIHx8IGtleSA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigna2V5IG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaW5pdGlhbGl6ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzLnNldChrZXksIGluaXRpYWxpemVyKVxuICAgIH1cbiAgICBcbiAgICBidWlsZCgpIHtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICB3aXRoQ29tcG9uZW50KGtleSwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnIHx8IGtleSA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGluaXRpYWxpemVyID0gdGhpcy5pbml0aWFsaXplcnMuZ2V0KGtleSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uLnNldChrZXksIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlQ29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvblxuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoZW50aXR5TWFuYWdlciwgY291bnQgPSAxLCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgY29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb24gfHwgdGhpcy5jb25maWd1cmF0aW9uXG4gICAgICAgIFxuICAgICAgICBsZXQgY29tcG9uZW50cyA9IFtdXG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgY29uZmlndXJhdGlvbi5rZXlzKCkpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMucHVzaChjb21wb25lbnQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBlbnRpdGllcyA9IFtdXG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyArK2kpIHtcbiAgICAgICAgICAgIGxldCB7IGlkLCBlbnRpdHkgfSA9IGVudGl0eU1hbmFnZXIubmV3RW50aXR5KGNvbXBvbmVudHMpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChpZCA+PSBlbnRpdHlNYW5hZ2VyLmNhcGFjaXR5KSB7XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChsZXQgW2NvbXBvbmVudCwgaW5pdGlhbGl6ZXJdIG9mIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGluaXRpYWxpemVyLmNhbGwoZW50aXR5W2NvbXBvbmVudF0pXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlbnRpdHlbY29tcG9uZW50XSAhPT0gJ29iamVjdCcgJiYgcmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZW50aXR5W2NvbXBvbmVudF0gPSByZXN1bHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVudGl0aWVzLnB1c2goeyBpZCwgZW50aXR5IH0pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5sZW5ndGggPT09IDEgPyBlbnRpdGllc1swXSA6IGVudGl0aWVzXG4gICAgfVxufSIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBvbmVudE1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgbmV3Q29tcG9uZW50KGtleSkge1xuICAgICAgICBsZXQgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzLmdldChrZXkpXG4gICAgICAgIFxuICAgICAgICBpZiAoY29tcG9uZW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50KClcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCcgIDoge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKGNvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbXBvbmVudCkuZm9yRWFjaChrZXkgPT4gcmV0W2tleV0gPSBjb21wb25lbnRba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRcbiAgICAgICAgICAgICAgICB9KShjb21wb25lbnQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnRcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChrZXksIGNvbXBvbmVudCkge1xuICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycgfHwga2V5ID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdrZXkgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gbnVsbCB8fCBjb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnQgY2Fubm90IGJlIG51bGwgb3IgdW5kZWZpbmVkLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5zZXQoa2V5LCBjb21wb25lbnQpXG5cbiAgICAgICAgcmV0dXJuIGtleVxuICAgIH1cbiAgICBcbiAgICBnZXRDb21wb25lbnRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wb25lbnRzXG4gICAgfVxufSIsImV4cG9ydCBjb25zdCBTeXN0ZW1UeXBlID0ge1xuICAgIExvZ2ljICA6IDAsXG4gICAgUmVuZGVyIDogMSxcbiAgICBJbml0ICAgOiAyXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN5c3RlbU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxvZ2ljU3lzdGVtcyAgPSBuZXcgTWFwKClcbiAgICAgICAgdGhpcy5yZW5kZXJTeXN0ZW1zID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMuaW5pdFN5c3RlbXMgICA9IG5ldyBNYXAoKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlclN5c3RlbShrZXksIHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyB8fCBrZXkgPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2tleSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZSAhPT0gU3lzdGVtVHlwZS5Mb2dpYyAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLlJlbmRlciAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLkluaXQpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigndHlwZSBtdXN0IGJlIGEgdmFsaWQgU3lzdGVtVHlwZS4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBhcmd1bWVudCBtdXN0IGJlIGFuIGFycmF5IG9mIGNvbXBvbmVudHMuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHN5c3RlbSA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMsXG4gICAgICAgICAgICBjYWxsYmFja1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Mb2dpYyA6IHRoaXMubG9naWNTeXN0ZW1zLnNldChrZXksIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuUmVuZGVyIDogdGhpcy5yZW5kZXJTeXN0ZW1zLnNldChrZXksIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuSW5pdCA6IHRoaXMuaW5pdFN5c3RlbXMuc2V0KGtleSwgc3lzdGVtKTsgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtleVxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvZ2ljU3lzdGVtcy5kZWxldGUoa2V5KSB8fCB0aGlzLnJlbmRlclN5c3RlbXMuZGVsZXRlKGtleSkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoa2V5KVxuICAgIH1cbn0iLCJpbXBvcnQgRW50aXR5TWFuYWdlciBmcm9tICcuL2VudGl0eS1tYW5hZ2VyJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFdmVudEhhbmRsZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBNYXAoKVxuICAgIH1cbiAgICBcbiAgICBlbXB0eVByb21pc2UoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9KVxuICAgIH1cbiAgICBcbiAgICBwcm9taXNlKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSB7XG4gICAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHR5cGVvZiBjb250ZXh0ID09PSAgJ29iamVjdCcgPyBjYWxsYmFjay5jYWxsKGNvbnRleHQsIC4uLmFyZ3MpIDogY2FsbGJhY2suYXBwbHkoY29udGV4dCwgLi4uYXJncykpXG4gICAgICAgICAgICAgICAgfSwgdGltZW91dClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUodHlwZW9mIGNvbnRleHQgPT09ICdvYmplY3QnID8gY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSA6IGNhbGxiYWNrLmFwcGx5KGNvbnRleHQsIC4uLmFyZ3MpKVxuICAgICAgICB9KVxuICAgIH1cbiAgICBcbiAgICBsaXN0ZW4oZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5ldmVudHMuaGFzKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudHMuc2V0KGV2ZW50LCBuZXcgTWFwKCkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBldmVudElkID0gLTFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZXZlbnRzLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgICAgICAgZXZlbnRJZCA9IE1hdGgubWF4KGV2ZW50SWQsIC4uLmV2ZW50LmtleXMoKSlcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICArK2V2ZW50SWRcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZXZlbnRzLmdldChldmVudCkuc2V0KGV2ZW50SWQsIGNhbGxiYWNrKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGV2ZW50SWRcbiAgICB9XG4gICAgXG4gICAgc3RvcExpc3RlbihldmVudElkKSB7XG4gICAgICAgIGZvciAobGV0IGV2ZW50cyBvZiB0aGlzLmV2ZW50cy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaWQgb2YgZXZlbnRzLmtleXMoKSkge1xuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gZXZlbnRJZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnRzLmRlbGV0ZShldmVudElkKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXMgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyID8gdGhpcy5ldmVudEhhbmRsZXIgOiB0aGlzXG4gICAgICAgIFxuICAgICAgICBsZXQgYXJncyA9IEFycmF5LmZyb20oYXJndW1lbnRzKVxuICAgICAgICBcbiAgICAgICAgbGV0IFsgZXZlbnQgXSA9IGFyZ3Muc3BsaWNlKDAsIDEpXG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCAhc2VsZi5ldmVudHMuaGFzKGV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYuZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2goc2VsZi5wcm9taXNlKGNhbGxiYWNrLCB0aGlzLCBhcmdzLCAxKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyRGVsYXllZCgpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlciA/IHRoaXMuZXZlbnRIYW5kbGVyIDogdGhpc1xuICAgICAgICBcbiAgICAgICAgbGV0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cylcbiAgICAgICAgXG4gICAgICAgIGxldCBbIGV2ZW50LCB0aW1lb3V0IF0gPSBhcmdzLnNwbGljZSgwLCAyKVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgIU51bWJlci5pc0ludGVnZXIodGltZW91dCkgfHwgIXNlbGYuZXZlbnRzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxmLmVtcHR5UHJvbWlzZSgpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBwcm9taXNlcyA9IFtdXG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBzZWxmLmV2ZW50cy5nZXQoZXZlbnQpLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHNlbGYucHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgdGltZW91dCkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG59IiwiaW1wb3J0IEVudGl0eUZhY3RvcnkgICAgICAgICAgICAgICAgIGZyb20gJy4vZW50aXR5LWZhY3RvcnknXG5pbXBvcnQgQ29tcG9uZW50TWFuYWdlciAgICAgICAgICAgICAgZnJvbSAnLi9jb21wb25lbnQtbWFuYWdlcidcbmltcG9ydCBTeXN0ZW1NYW5hZ2VyLCB7IFN5c3RlbVR5cGUgfSBmcm9tICcuL3N5c3RlbS1tYW5hZ2VyJ1xuaW1wb3J0IEV2ZW50SGFuZGxlciAgICAgICAgICAgICAgICAgIGZyb20gJy4vZXZlbnQtaGFuZGxlcidcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRW50aXR5TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoY2FwYWNpdHkgPSAxMDAwKSB7XG4gICAgICAgIHRoaXMuY2FwYWNpdHkgICAgICAgICA9IGNhcGFjaXR5XG4gICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IC0xXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkgICAgPSBuZXcgRW50aXR5RmFjdG9yeSgpXG4gICAgICAgIHRoaXMuc3lzdGVtTWFuYWdlciAgICA9IG5ldyBTeXN0ZW1NYW5hZ2VyKClcbiAgICAgICAgdGhpcy5jb21wb25lbnRNYW5hZ2VyID0gbmV3IENvbXBvbmVudE1hbmFnZXIoKVxuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlciAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKClcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoIDogdGhpcy5jYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiBbIF0gfSkpXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIGluY3JlYXNlQ2FwYWNpdHkoKSB7XG4gICAgICAgIGxldCBvbGRDYXBhY2l0eSA9IHRoaXMuY2FwYWNpdHlcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2FwYWNpdHkgKj0gMlxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IFsuLi50aGlzLmVudGl0aWVzLCAuLi5BcnJheS5mcm9tKHsgbGVuZ3RoIDogb2xkQ2FwYWNpdHkgfSwgKCkgPT4gKHsgY29tcG9uZW50czogWyBdIH0pKV1cblxuICAgICAgICBmb3IgKGxldCBpID0gb2xkQ2FwYWNpdHk7IGkgPCB0aGlzLmNhcGFjaXR5OyArK2kpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudE1hbmFnZXIuZ2V0Q29tcG9uZW50cygpLmtleXMoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbaV1bY29tcG9uZW50XSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoY29tcG9uZW50KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIG5ld0VudGl0eShjb21wb25lbnRzKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnRzIGFyZ3VtZW50IG11c3QgYmUgYW4gYXJyYXkgb2YgY29tcG9uZW50cy4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaWQgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgKDsgaWQgPCB0aGlzLmNhcGFjaXR5OyArK2lkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPj0gdGhpcy5jYXBhY2l0eSkge1xuICAgICAgICAgICAgLy8gdG9kbzogYXV0byBpbmNyZWFzZSBjYXBhY2l0eT9cbiAgICAgICAgICAgIHJldHVybiB7IGlkIDogdGhpcy5jYXBhY2l0eSwgZW50aXR5IDogbnVsbCB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA+IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaWRcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9IGNvbXBvbmVudHNcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7IGlkLCBlbnRpdHkgOiB0aGlzLmVudGl0aWVzW2lkXSB9XG4gICAgfVxuICAgIFxuICAgIGRlbGV0ZUVudGl0eShpZCkge1xuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gW11cbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA8IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSBpZDsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVudGl0aWVzW2ldLmNvbXBvbmVudHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gMFxuICAgIH1cblxuICAgICpnZXRFbnRpdGllcyhjb21wb25lbnRzID0gbnVsbCkge1xuICAgICAgICBmb3IgKGxldCBpZCA9IDA7IGlkIDw9IHRoaXMuY3VycmVudE1heEVudGl0eTsgKytpZCkge1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudHMgPT09IG51bGwgfHwgY29tcG9uZW50cy5ldmVyeShjb21wb25lbnQgPT4gdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cy5pbmRleE9mKGNvbXBvbmVudCkgIT09IC0xKSkge1xuICAgICAgICAgICAgICAgIHlpZWxkIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbmZpZ3VyYXRpb24oa2V5KSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyB8fCBrZXkgPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2tleSBtdXN0IGJlIGEgbm9uIGVtcHR5IHN0cmluZy4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLnNldChrZXksIHRoaXMuZW50aXR5RmFjdG9yeS5jcmVhdGVDb25maWd1cmF0aW9uKCkpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2V5XG4gICAgfVxuICAgIFxuICAgIC8vIENvbXBvbmVudCBNYW5hZ2VyXG4gICAgXG4gICAgcmVnaXN0ZXJDb21wb25lbnQoa2V5LCBjb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyQ29tcG9uZW50KGtleSwgY29tcG9uZW50KVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgZW50aXR5IG9mIHRoaXMuZW50aXRpZXMpIHtcbiAgICAgICAgICAgIGVudGl0eVtrZXldID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChrZXkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBpbml0aWFsaXplclxuXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOiBpbml0aWFsaXplciA9IGNvbXBvbmVudDsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6IHtcbiAgICAgICAgICAgICAgICBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoY29tcG9uZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1trZXldID0gY29tcG9uZW50W2tleV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gY29tcG9uZW50IH07IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGtleSwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2V5XG4gICAgfVxuICAgIFxuICAgIGFkZENvbXBvbmVudChpZCwgY29tcG9uZW50S2V5KSB7XG4gICAgICAgIGlmICh0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50S2V5KSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzLnB1c2goY29tcG9uZW50S2V5KVxuICAgIH1cbiAgICBcbiAgICByZW1vdmVDb21wb25lbnQoaWQsIGNvbXBvbmVudCkge1xuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50KVxuICAgICAgICBcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMuc3BsaWNlKGluZGV4LCAxKVxuICAgIH1cbiAgICBcbiAgICAvLyBTeXN0ZW0gTWFuYWdlclxuICAgIFxuICAgIHJlZ2lzdGVyU3lzdGVtKGtleSwgdHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZWdpc3RlclN5c3RlbShrZXksIHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckxvZ2ljU3lzdGVtKGtleSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZWdpc3RlclN5c3RlbShrZXksIFN5c3RlbVR5cGUuTG9naWMsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlclJlbmRlclN5c3RlbShrZXksIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0oa2V5LCBTeXN0ZW1UeXBlLlJlbmRlciwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdFN5c3RlbShrZXksIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0oa2V5LCBTeXN0ZW1UeXBlLkluaXQsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVtb3ZlU3lzdGVtKGtleSlcbiAgICB9XG4gICAgXG4gICAgb25Mb2dpYyhvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIubG9naWNTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBvblJlbmRlcihvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIucmVuZGVyU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkluaXQob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmluaXRTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBFbnRpdHkgRmFjdG9yeVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcbiAgICB9XG4gICAgXG4gICAgYnVpbGQoKSB7XG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5idWlsZCgpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudChjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoY291bnQsIGtleSkge1xuICAgICAgICBsZXQgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZFxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5nZXQoa2V5KVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb3VsZCBub3QgZmluZCBlbnRpdHkgY29uZmlndXJhdGlvbiBmb3IgdGhlIHN1cHBsaWVkIGtleS4gaWYgeW91IHdpc2ggdG8gY3JlYXRlIGFuIGVudGl0eSB3aXRob3V0IGEgY29uZmlndXJhdGlvbiwgZG8gbm90IHBhc3MgYSBrZXkuJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuZW50aXR5RmFjdG9yeS5jcmVhdGUodGhpcywgY291bnQsIGNvbmZpZ3VyYXRpb24pXG4gICAgfVxuICAgIFxuICAgIC8vIEV2ZW50IEhhbmRsZXJcbiAgICBcbiAgICBsaXN0ZW4oZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci5saXN0ZW4oZXZlbnQsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnN0b3BMaXN0ZW4oZXZlbnRJZClcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXIuY2FsbCh0aGlzLCAuLi5hcmd1bWVudHMpXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXJEZWxheWVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIudHJpZ2dlckRlbGF5ZWQuY2FsbCh0aGlzLCAuLi5hcmd1bWVudHMpXG4gICAgfVxufSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFFcUI7QUFDakIsSUFBQSxhQURpQixhQUNqQixHQUFjOzhDQURHLGVBQ0g7O0FBQ1YsSUFBQSxhQUFLLFlBQUwsR0FBcUIsSUFBSSxHQUFKLEVBQXJCLENBRFU7QUFFVixJQUFBLGFBQUssYUFBTCxHQUFxQixJQUFJLEdBQUosRUFBckIsQ0FGVTtTQUFkOztpQ0FEaUI7O2dEQU1HLEtBQUssYUFBYTtBQUNsQyxJQUFBLGdCQUFJLE9BQU8sR0FBUCxLQUFlLFFBQWYsSUFBMkIsUUFBUSxFQUFSLEVBQVk7QUFDdkMsSUFBQSxzQkFBTSxVQUFVLGlDQUFWLENBQU4sQ0FEdUM7aUJBQTNDOztBQUlBLElBQUEsZ0JBQUksT0FBTyxXQUFQLEtBQXVCLFVBQXZCLEVBQW1DO0FBQ25DLElBQUEsc0JBQU0sVUFBVSxpQ0FBVixDQUFOLENBRG1DO2lCQUF2Qzs7QUFJQSxJQUFBLGlCQUFLLFlBQUwsQ0FBa0IsR0FBbEIsQ0FBc0IsR0FBdEIsRUFBMkIsV0FBM0IsRUFUa0M7Ozs7b0NBWTlCO0FBQ0osSUFBQSxpQkFBSyxhQUFMLEdBQXFCLElBQUksR0FBSixFQUFyQixDQURJOztBQUdKLElBQUEsbUJBQU8sSUFBUCxDQUhJOzs7OzBDQU1NLEtBQUssYUFBYTtBQUM1QixJQUFBLGdCQUFJLE9BQU8sR0FBUCxLQUFlLFFBQWYsSUFBMkIsUUFBUSxFQUFSLEVBQVk7QUFDdkMsSUFBQSx1QkFBTyxJQUFQLENBRHVDO2lCQUEzQzs7QUFJQSxJQUFBLGdCQUFJLE9BQU8sV0FBUCxLQUF1QixVQUF2QixFQUFtQztBQUNuQyxJQUFBLDhC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