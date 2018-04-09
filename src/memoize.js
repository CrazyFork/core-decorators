import { decorate, internalDeprecation } from './private/utils';

function toObject(cache, value) {
  if (value === Object(value)) { // :?
    return value;  
  }
  return cache[value] || (cache[value] = {});
}

function applyAndCache(context, fn, args, cache, signature) {
  const ret = fn.apply(context, args);
  cache[signature] = ret;
  return ret;
}

function metaForDescriptor(descriptor) {
  let fn, wrapKey;

  // This is ugly code, but way faster than other
  // ways I tried that *looked* pretty
  
  if (descriptor.value) {
    fn = descriptor.value;
    wrapKey = 'value';
  } else if (descriptor.get) {
    fn = descriptor.get;
    wrapKey = 'get';
  } else if (descriptor.set) {
    fn = descriptor.set;
    wrapKey = 'set';
  }

  return { fn, wrapKey };
}

function handleDescriptor(target, key, descriptor) {
  const { fn, wrapKey } = metaForDescriptor(descriptor);
  const argumentCache = new WeakMap();
  const signatureCache = Object.create(null);
  const primativeRefCache = Object.create(null);
  let argumentIdCounter = 0;
  
  return {
    ...descriptor,
    [wrapKey]: function memoizeWrapper(...args) {
      let signature = '0';
      
      for (let i = 0, l = args.length; i < l; i++) {
        let arg = args[i];
        let argRef = toObject(primativeRefCache, arg);
        // :bm, WeakMap 的key不能是primitive type, 所以之前的那一步调用了 toObject, 将 primitive type 转换成了object type
        let argKey = argumentCache.get(argRef); 
        
        if (argKey === undefined) {
          argKey = ++argumentIdCounter;
          argumentCache.set(argRef, argKey);
        }
        // 这个 signature 的 key 就是以参数数目为key生成的, 比如有2个参数, 这个 signature 最终的结果就是 012,
        // 所以在某些情况下这个 memoize 会出现问题
        signature += argKey;
      }
      
      return signatureCache[signature]
        || applyAndCache(this, fn, arguments, signatureCache, signature);
    }
  };
}

export default function memoize(...args) {
  internalDeprecation('@memoize is deprecated and will be removed shortly. Use @memoize from lodash-decorators.\n\n  https://www.npmjs.com/package/lodash-decorators');
  return decorate(handleDescriptor, args);
}
