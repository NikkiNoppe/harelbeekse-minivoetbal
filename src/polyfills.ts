// Comprehensive Polyfills for older browsers and environments - EXECUTE IMMEDIATELY

// Ensure Array is properly defined
if (typeof Array === 'undefined') {
  (globalThis as any).Array = function() {
    return Array.prototype.slice.call(arguments);
  };
  console.log('✅ Array constructor polyfill loaded');
}

// Array.isArray polyfill - execute immediately
if (typeof Array.isArray === 'undefined') {
  Array.isArray = function(arg: any): arg is any[] {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
  console.log('✅ Array.isArray polyfill loaded');
}

// Ensure Array.prototype.slice is available
if (typeof Array.prototype.slice === 'undefined') {
  Array.prototype.slice = function(begin: number, end?: number) {
    const len = this.length;
    const start = begin || 0;
    const stop = end || len;
    
    let actualStart = start;
    let actualStop = stop;
    
    if (start < 0) actualStart = len + start;
    if (stop < 0) actualStop = len + stop;
    
    const result = [];
    for (let i = actualStart; i < actualStop; i++) {
      result.push(this[i]);
    }
    return result;
  };
  console.log('✅ Array.prototype.slice polyfill loaded');
}

// Ensure Array.prototype.filter is available
if (typeof Array.prototype.filter === 'undefined') {
  Array.prototype.filter = function(callback: Function, thisArg?: any) {
    const result = [];
    for (let i = 0; i < this.length; i++) {
      if (callback.call(thisArg, this[i], i, this)) {
        result.push(this[i]);
      }
    }
    return result;
  };
  console.log('✅ Array.prototype.filter polyfill loaded');
}

// Ensure Array.prototype.map is available
if (typeof Array.prototype.map === 'undefined') {
  Array.prototype.map = function(callback: Function, thisArg?: any) {
    const result = [];
    for (let i = 0; i < this.length; i++) {
      result.push(callback.call(thisArg, this[i], i, this));
    }
    return result;
  };
  console.log('✅ Array.prototype.map polyfill loaded');
}

// Object.entries polyfill for older browsers - execute immediately
if (typeof Object.entries === 'undefined') {
  Object.entries = function(obj: any) {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resArray = new Array(i);
    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resArray;
  };
  console.log('✅ Object.entries polyfill loaded');
}

// Object.keys polyfill for older browsers - execute immediately
if (typeof Object.keys === 'undefined') {
  Object.keys = function(obj: any) {
    const keys = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  console.log('✅ Object.keys polyfill loaded');
}

// Force polyfills to be available globally
if (typeof window !== 'undefined') {
  if (typeof window.Array === 'undefined') {
    window.Array = Array;
  }
  if (typeof window.Object === 'undefined') {
    window.Object = Object;
  }
}

// Also ensure they're available on global scope
if (typeof global !== 'undefined') {
  if (typeof global.Array === 'undefined') {
    global.Array = Array;
  }
  if (typeof global.Object === 'undefined') {
    global.Object = Object;
  }
}

// Verify polyfills are working
console.log('✅ Comprehensive Polyfills loaded successfully');
console.log('Array.isArray available:', typeof Array.isArray === 'function');
console.log('Array.prototype.slice available:', typeof Array.prototype.slice === 'function');
console.log('Array.prototype.filter available:', typeof Array.prototype.filter === 'function');
console.log('Array.prototype.map available:', typeof Array.prototype.map === 'function');
console.log('Object.entries available:', typeof Object.entries === 'function');
console.log('Object.keys available:', typeof Object.keys === 'function');

// Export for module systems
export {}; 