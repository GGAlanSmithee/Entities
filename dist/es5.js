'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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
            return v = 0;
        });

        this.components = new Map();
        this.components.set(NoneComponent, { type: null, object: null });
    }

    _createClass(World, [{
        key: 'getNextComponentId',
        value: function getNextComponentId() {
            if (this.components === null || this.components === undefined) {
                this.components = new Map();
            }

            var max = Math.max.apply(Math, _toConsumableArray(this.components.keys()));

            return max === undefined || max === null || max === -Infinity ? 0 : max === 0 ? 1 : max * 2;
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
                        if (!(this.entities[entity] !== NoneComponent && (this.entities[entity] & components) === components)) {
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
                        if (!(this.entities[entity] !== NoneComponent && this.entities[entity] === components)) {
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
                        if (!(this.entities[entity] !== NoneComponent && (this.entities[entity] & components) !== components)) {
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
