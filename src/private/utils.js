import lazyInitialize from '../lazy-initialize';

const { defineProperty, getOwnPropertyDescriptor,
        getOwnPropertyNames, getOwnPropertySymbols } = Object;

export function isDescriptor(desc) {
  if (!desc || !desc.hasOwnProperty) {
    return false;
  }

  const keys = ['value', 'initializer', 'get', 'set'];

  for (let i = 0, l = keys.length; i < l; i++) {
    if (desc.hasOwnProperty(keys[i])) {
      return true;
    }
  }

  return false;
}
// 这个函数的作用就是, 如果最后一个参数是 descriptor, 则直接执行原始的descriptor, 
// 否则返回一个正常的 decorator 的包装 wrap 了 handleDescriptor.
export function decorate(handleDescriptor, entryArgs) {
  if (isDescriptor(entryArgs[entryArgs.length - 1])) { // if last arg is a descriptor value
    // call handleDescriptor with `target, key, descriptor` follow with empty array as args
    return handleDescriptor(...entryArgs, []); 
  } else {
    return function () { 
      // else return a function, that combine `target, key, descriptor` with decorator args as array.
      // entryArgs is array with decorator arguments
      // eg. `@debounce(500)` will be `handleDescriptor(target, key, descriptor, 500)`
      return handleDescriptor(...Array.prototype.slice.call(arguments), entryArgs);
    };
  }
}

class Meta {
  @lazyInitialize
  debounceTimeoutIds = {};

  @lazyInitialize
  throttleTimeoutIds = {};

  @lazyInitialize
  throttlePreviousTimestamps = {};

  @lazyInitialize
  throttleTrailingArgs = null;

  @lazyInitialize
  profileLastRan = null;
}

const META_KEY = (typeof Symbol === 'function')
  ? Symbol('__core_decorators__')
  : '__core_decorators__';

export function metaFor(obj) {
  if (obj.hasOwnProperty(META_KEY) === false) {
    defineProperty(obj, META_KEY, {
      // Defaults: NOT enumerable, configurable, or writable
      value: new Meta()
    });
  }

  return obj[META_KEY];
}

export const getOwnKeys = getOwnPropertySymbols
    ? function (object) {
        return getOwnPropertyNames(object)
          .concat(getOwnPropertySymbols(object));
      }
    : getOwnPropertyNames;


export function getOwnPropertyDescriptors(obj) {
  const descs = {};

  getOwnKeys(obj).forEach(
    key => (descs[key] = getOwnPropertyDescriptor(obj, key))
  );

  return descs;
}

export function createDefaultSetter(key) {
  return function set(newValue) {
    Object.defineProperty(this, key, {
      configurable: true,
      writable: true,
      // IS enumerable when reassigned by the outside word
      enumerable: true,
      value: newValue
    });

    return newValue;
  };
}

export function bind(fn, context) {
  if (fn.bind) {
    return fn.bind(context);
  } else {
    return function __autobind__() {
      return fn.apply(context, arguments);
    };
  }
}

export const warn = (() => {
  if (typeof console !== 'object' || !console || typeof console.warn !== 'function') {
    return () => {};
  } else {
    return bind(console.warn, console);
  }
})();

const seenDeprecations = {};
export function internalDeprecation(msg) {
  if (seenDeprecations[msg] !== true) {
    seenDeprecations[msg] = true;
    warn('DEPRECATION: ' + msg);
  }
}
