(function() {
  "use strict";

  /*
     * Make child inherit from parent.
     * Be sure to call the parent's constructor from the child's constructor 
     * if you intend for this inheritance to work.
     * Also be sure to call Object.inherits before adding to the child prototype.
     * e.g.,
     *   function Child() {
     *      Parent.super_.call(this);
     *   }
     *   Object.inherits(Child, Parent);
     *   Child.prototype.method = function() {};
     *
     * @param child {function} the child class constructor
     * @param parent {function} the parent class constructor
     */
  Object.inherits = function(child, parent) {
    child.super_ = parent;
    child.prototype = Object.create(parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };

  /*
     * Make a read-only property on the class.
     * The property can't be written directly, but it is configurable, so this can be called multiple times.
     * @param obj {object} the object to write to
     * @param name {string} the name of the method
     * @param value {any} the value to assign
     */
  Object.defineReadOnlyProperty = function(obj, name, value) {
    Object.defineProperty(obj, name, {
      value: value,
      writable: false,
      enumerable: true,
      configurable: true
    });
  };
})();
