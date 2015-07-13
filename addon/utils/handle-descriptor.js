import Ember from 'ember';
import extractValue from './extract-value';

const { computed, get } = Ember;

export default function handleDescriptor(target, key, desc, params = []) {
  return {
    enumerable: desc.enumerable,
    configurable: desc.configurable,
    writeable: desc.writeable,
    initializer: function() {
      let computedDescriptor;

      if (desc.writable) {
        var val = extractValue(desc);
        if (typeof val === 'object') {
          let value = { };
          if (val.get) { value.get = callUserSuppliedGet(params, val.get); }
          if (val.set) { value.set = callUserSuppliedSet(params, val.set); }
          computedDescriptor = value;
        } else {
          computedDescriptor = callUserSuppliedGet(params, val);
        }
      } else {
        throw new Error('ember-computed-decorators does not support using getters and setters');
      }

      return computed.apply(null, params.concat(computedDescriptor));
    }
  };
}

function getAttr(obj, name) {
  const parts = name.split('.');
  let i;

  for (i = 0; i < parts.length; i++) {
    if (parts[i] === '@each' || parts[i] === '[]') { break; }
  }

  return get(obj, parts.slice(0, i).join('.'));
}

function callUserSuppliedGet(params, func) {
  return function() {
    let paramValues = params.map(p => getAttr(this, p));

    return func.apply(this, paramValues);
  };
}


function callUserSuppliedSet(params, func) {
  return function(key, value) {
    let paramValues = params.map(p => getAttr(this, p));
    paramValues.unshift(value);

    return func.apply(this, paramValues);
  };
}

