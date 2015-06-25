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
        key: 'registerComponent',
        value: function registerComponent(object) {
            var _this = this;

            var type = arguments[1] === undefined ? ComponentType.Static : arguments[1];
            var returnDetails = arguments[2] === undefined ? true : arguments[2];

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
                return null;
            }

            var entity = this.getFirstUnusedEntity();

            if (entity >= this.capacity) {
                return returnDetails ? null : this.capacity;
            }

            if (entity > this.currentMaxEntity) {
                this.currentMaxEntity = entity;
            }

            for (var component in this.components) {
                if (component != NoneComponent && (components & component) === component) {
                    this.addComponent(entity, component);
                } else {
                    this.removeComponent(entity, component);
                }
            }

            return returnDetails ? this.entities[entity] : entity;
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
            var returnDetails = arguments[0] === undefined ? true : arguments[0];
            var entity;
            return regeneratorRuntime.wrap(function getEntities$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        context$2$0.t0 = regeneratorRuntime.keys(this.entities);

                    case 1:
                        if ((context$2$0.t1 = context$2$0.t0()).done) {
                            context$2$0.next = 9;
                            break;
                        }

                        entity = context$2$0.t1.value;

                        if (!(entity > this.currentMaxEntity)) {
                            context$2$0.next = 5;
                            break;
                        }

                        return context$2$0.abrupt('return');

                    case 5:
                        context$2$0.next = 7;
                        return returnDetails ? this.entities[entity] : Math.floor(entity);

                    case 7:
                        context$2$0.next = 1;
                        break;

                    case 9:
                    case 'end':
                        return context$2$0.stop();
                }
            }, getEntities, this);
        })
    }, {
        key: 'getEntitiesWith',
        value: regeneratorRuntime.mark(function getEntitiesWith(components) {
            var returnDetails = arguments[1] === undefined ? true : arguments[1];
            var entity;
            return regeneratorRuntime.wrap(function getEntitiesWith$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        if (components) {
                            context$2$0.next = 2;
                            break;
                        }

                        return context$2$0.delegateYield(this.getEntities(returnDetails), 't0', 2);

                    case 2:
                        context$2$0.t1 = regeneratorRuntime.keys(this.entities);

                    case 3:
                        if ((context$2$0.t2 = context$2$0.t1()).done) {
                            context$2$0.next = 12;
                            break;
                        }

                        entity = context$2$0.t2.value;

                        if (!(entity > this.currentMaxEntity)) {
                            context$2$0.next = 7;
                            break;
                        }

                        return context$2$0.abrupt('return');

                    case 7:
                        if (!(this.entities[entity].id !== NoneComponent && (this.entities[entity].id & components) === components)) {
                            context$2$0.next = 10;
                            break;
                        }

                        context$2$0.next = 10;
                        return returnDetails ? this.entities[entity] : Math.floor(entity);

                    case 10:
                        context$2$0.next = 3;
                        break;

                    case 12:
                    case 'end':
                        return context$2$0.stop();
                }
            }, getEntitiesWith, this);
        })
    }, {
        key: 'getEntitiesWithOnly',
        value: regeneratorRuntime.mark(function getEntitiesWithOnly(components) {
            var returnDetails = arguments[1] === undefined ? true : arguments[1];
            var entity;
            return regeneratorRuntime.wrap(function getEntitiesWithOnly$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        if (components) {
                            context$2$0.next = 2;
                            break;
                        }

                        return context$2$0.delegateYield(this.getEntities(returnDetails), 't0', 2);

                    case 2:
                        context$2$0.t1 = regeneratorRuntime.keys(this.entities);

                    case 3:
                        if ((context$2$0.t2 = context$2$0.t1()).done) {
                            context$2$0.next = 12;
                            break;
                        }

                        entity = context$2$0.t2.value;

                        if (!(entity > this.currentMaxEntity)) {
                            context$2$0.next = 7;
                            break;
                        }

                        return context$2$0.abrupt('return');

                    case 7:
                        if (!(this.entities[entity].id !== NoneComponent && this.entities[entity].id === components)) {
                            context$2$0.next = 10;
                            break;
                        }

                        context$2$0.next = 10;
                        return returnDetails ? this.entities[entity] : Math.floor(entity);

                    case 10:
                        context$2$0.next = 3;
                        break;

                    case 12:
                    case 'end':
                        return context$2$0.stop();
                }
            }, getEntitiesWithOnly, this);
        })
    }, {
        key: 'getEntitiesWithout',
        value: regeneratorRuntime.mark(function getEntitiesWithout(components) {
            var returnDetails = arguments[1] === undefined ? true : arguments[1];
            var entity;
            return regeneratorRuntime.wrap(function getEntitiesWithout$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        if (components) {
                            context$2$0.next = 2;
                            break;
                        }

                        return context$2$0.delegateYield(this.getEntities(returnDetails), 't0', 2);

                    case 2:
                        context$2$0.t1 = regeneratorRuntime.keys(this.entities);

                    case 3:
                        if ((context$2$0.t2 = context$2$0.t1()).done) {
                            context$2$0.next = 12;
                            break;
                        }

                        entity = context$2$0.t2.value;

                        if (!(entity > this.currentMaxEntity)) {
                            context$2$0.next = 7;
                            break;
                        }

                        return context$2$0.abrupt('return');

                    case 7:
                        if (!(this.entities[entity].id !== NoneComponent && (this.entities[entity].id & components) !== components)) {
                            context$2$0.next = 10;
                            break;
                        }

                        context$2$0.next = 10;
                        return returnDetails ? this.entities[entity] : Math.floor(entity);

                    case 10:
                        context$2$0.next = 3;
                        break;

                    case 12:
                    case 'end':
                        return context$2$0.stop();
                }
            }, getEntitiesWithout, this);
        })
    }]);

    return World;
})();

exports.World = World;
