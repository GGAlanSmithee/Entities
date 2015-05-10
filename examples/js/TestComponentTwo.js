function TestTwo() {
    this.Name = { x : 0, y : 0, w : 0, h : 0 };
    
    return this;
}

TestTwo.prototype = {
    constructor: TestTwo
};

Object.defineProperty(TestTwo.prototype, 'Name', {
    get : function() {
        return this._name;
    },
    set : function (name) {
        this._name = name;
    }
});

function TestTwoInitializer(testTwo) {
    testTwo.Name = "";
}