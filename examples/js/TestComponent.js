'use strict';

function Test() {
    this.Rect = { x : 0, y : 0, w : 0, h : 0 };
    
    return this;
}

Test.prototype = {
    constructor: Test
};

Object.defineProperty(Test.prototype, 'Rect', {
    get : function() {
        return this._rect;
    },
    set : function (rect) {
        this._rect = rect;
    }
});