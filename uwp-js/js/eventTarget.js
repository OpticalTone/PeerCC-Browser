(function(g) {
  "use strict";

  var Event = g.Event;

  var EventTarget = (g.EventTarget = function() {
    Object.defineProperty(this, "listeners", {
      value: {},
      writable: false,
      enumerable: false
    });
  });

  /*
   * Add an event listener.
   * @param name {string} the name of the event
   * @param handler {function} the function to call
   */
  EventTarget.prototype.addEventListener = function(name, handler) {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }
    if (
      typeof handler === "function" ||
      (typeof handler === "object" && typeof handler.handleEvent === "function")
    ) {
      this.listeners[name].push(handler);
    } else {
      throw new Error("handler is neither function nor EventListener");
    }
  };

  EventTarget.prototype.removeEventListener = function(name, func) {
    var idx;
    if (!this.listeners[name]) {
      return;
    }
    idx = this.listeners[name].indexOf(func);
    if (idx >= 0) {
      this.listeners[name].splice(idx, 1);
    }
  };

  EventTarget.prototype.dispatchEvent = function(evt) {
    var notify;
    if (!(evt instanceof Event)) {
      throw new Error("can't dispatch a non-Event");
    }
    Object.defineReadOnlyProperty(evt, "target", this);
    Object.defineReadOnlyProperty(evt, "currentTarget", this);
    Object.defineReadOnlyProperty(evt, "timeStamp", new Date());
    Object.defineReadOnlyProperty(evt, "eventPhase", Event.AT_TARGET);

    function call(f) {
      try {
        if (typeof f === "function") {
          f(evt);
        } else {
          f.handleEvent.call(f, evt);
        }
      } catch (e) {
        if (console && console.log) {
          console.log("error in event dispatch", e, e.stack);
        }
      }
    }

    if (this.listeners[evt.type]) {
      notify = this.listeners[evt.type].slice(); // clone to fix the current set of listeners
      g.setTimeout(function() {
        notify.forEach(call);
      }, 0);
    }
  };
})(typeof window === "object" ? window : global);
