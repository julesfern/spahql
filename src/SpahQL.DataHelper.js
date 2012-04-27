/**
 * class SpahQL.DataHelper
 *
 * This is a singleton helper dedicated to deep-merging complex JSON structures and returning both
 * the merged data and a digest of modified paths within the structure.
 **/

// Dependencies
SpahQL_classCreate("SpahQL.DataHelper", {
  
  /**
   * SpahQL.DataHelper.compare(original, delta[, atPath]) -> Object
   *
   * Compares two objects at the given path (defaulting to "/") and returns a hash of differences between the two, 
   * keyed by path. The hash has array values, each including a SpahQL modification symbol, the original data value
   * and the delta data value.
   **/
  "compare": function(original, delta, atPath) {
    var pathStack = (atPath=="/")? "" : atPath;
    var modifications = {};
    
    var oType = this.objectType(original);
    var dType = this.objectType(delta);
    var oIsSimple = (oType != "object" && oType != "array");
    var dIsSimple = (dType != "object" && dType != "array");
    
    // Escale
    if(this.eq(original, delta)) {
      // Items are equivalent
      return modifications;
    } 
    else if(oIsSimple && dIsSimple) {
      // Compare simple -> simple
      var m = this.modificationSymbol(delta, original);
      if(m) modifications[atPath] = [m, original, delta];
    }
    
    
    if(!dIsSimple) {
      // New value is complex - we'll run all subkeys against the keys on the original, if they exist
      for(var dK in delta) {
        // For each key, get modifications for this tree level and merge.
        var dMods = this.compare(((oIsSimple)? undefined : original[dK]), delta[dK], pathStack+"/"+dK);
        for(mK in dMods) {
          modifications[mK] = dMods[mK];
        }
      }
    }
    
    if(!oIsSimple) {
      // Original value is complex - we'll run all subkeys against keys on the delta, if they exist
      // All keys in complex are nullified recursively
      for(var oK in original) {
        var oMods = this.compare(original[oK], ((dIsSimple)? undefined : delta[oK]), pathStack+"/"+oK);
        for(var mK in oMods) {
          modifications[mK] = oMods[mK];
        }
      }
    }
    
    // Register working path as modified if we got this far and didn't register anything for the mod path.
    if(!modifications[atPath]) {
      var mSym = this.modificationSymbol(delta, original);
      if(mSym) modifications[atPath] = [mSym, original, delta];
    }

    return modifications;
  },
  
  /**
   * SpahQL.DataHelper.modificationSymbol(delta, target) -> String symbol
   * 
   * Determines whether the change between two objects, assuming content inequality, is a "+" (addition), "-" (nullification) or "~" (alteration).
   **/
  "modificationSymbol": function(delta, target) {
    if(this.objectType(target) == "null") return "+";
    else if(this.objectType(delta) == "null") return "-";
    else if(delta != target) return "~";
  },
  
  /**
   * SpahQL.DataHelper.objectType(obj) -> String type
   * 
   * Extends the core typeof(obj) function by adding types "array" and "null".
   **/
  "objectType": function(obj) {
    if(obj == null || obj == undefined) return "null";
    if(typeof(obj) == "object") {
      return (Object.prototype.toString.call(obj) == "[object Array]") ? "array" : "object";
    } else {
      return typeof(obj);
    }
  },
  
  /**
   * SpahQL.DataHelper.eq(obj1, obj2[, objN]) -> Boolean equality result
   *
   * Determines content equality of two or more objects. Booleans, null values, numbers and strings are compared using 
   * the <code>SpahQL.DataHelper.objectType</code> method and the built-in <code>==</code> operator, but arrays 
   * and hashes are traversed recursively and have their values compared.
   **/
  "eq": function() {
    var aP, aI, aT;
    
    aP = arguments[0];
    for(aI=1; aI<arguments.length; aI++) {
      var a=arguments[aI];

      // Determine a and aP equal
      var t = this.objectType(aP);
      if(t != this.objectType(a)) return false;

      if(t == "array") {
        if(a.length != aP.length) return false;
        for(var i=0; i<a.length; i++) {
          if(!this.eq(a[i], aP[i])) return false;
        }
      }
      else if(t == "object") {
        if(Object.keys(a).length != Object.keys(aP).length) return false;
        for(var k in a) {
          if(!this.eq(a[k], aP[k])) return false;
        }
      }
      else if(a != aP) {
        return false;
      }
      
      aP = a;
    }
    return true;
  },
  
  /**
   * SpahQL.DataHelper.hashKeys(hash) -> Array of keys
   * - hash (Object): The hash being exploded
   *
   * Retrieves all keys found in an associative array and returns them as an array
   * without the corresponding values.
   **/
  "hashKeys": function(hash) {
    var keys = Object.keys(hash)
    return keys.sort();
  },
  
  /**
   * SpahQL.DataHelper.hashValues(hash) -> Array of values
   * - hash (Object): The hash being exploded
   *
   * Retrieves all values found in an associative array and returns them as an array
   * without keys. Uniqueness is not enforced.
   **/
  "hashValues": function(hash) {
    var a = [];
    for(var k in hash) a.push(hash[k]);
    return a;
  },
  
  /**
   * SpahQL.DataHelper.mathGte(left, right) -> Boolean result
   * - left (Object, Array, Boolean, String, Number, null): The value at the left-hand side of the comparator
   * - right (Object, Array, Boolean, String, Number, null): The value at the right-hand side of the comparator
   *
   * Compares two objects of any type under the rules of Spah comparisons, returning true if the left value is
   * greater than or equal to to the right value.
   **/
  "mathGte": function(left, right) {
    return this.mathCompare(left, right, function(a,b) { return a >= b; });
  },
  
  /**
   * SpahQL.DataHelper.mathGt(left, right) -> Boolean result
   * - left (Object, Array, Boolean, String, Number, null): The value at the left-hand side of the comparator
   * - right (Object, Array, Boolean, String, Number, null): The value at the right-hand side of the comparator
   *
   * Compares two objects of any type under the rules of Spah comparisons, returning true if the left value is
   * greater than to the right value.
   **/
  "mathGt": function(left, right) {
    return this.mathCompare(left, right, function(a,b) { return a > b; });
  },
  
  /**
   * SpahQL.DataHelper.mathLte(left, right) -> Boolean result
   * - left (Object, Array, Boolean, String, Number, null): The value at the left-hand side of the comparator
   * - right (Object, Array, Boolean, String, Number, null): The value at the right-hand side of the comparator
   *
   * Compares two objects of any type under the rules of Spah comparisons, returning true if the left value is
   * less than or equal to the right value.
   **/
  "mathLte": function(left, right) {
    return this.mathCompare(left, right, function(a,b) { return a <= b; });
  },
  
  /**
   * SpahQL.DataHelper.mathLt(left, right) -> Boolean result
   * - left (Object, Array, Boolean, String, Number, null): The value at the left-hand side of the comparator
   * - right (Object, Array, Boolean, String, Number, null): The value at the right-hand side of the comparator
   *
   * Compares two objects of any type under the rules of Spah comparisons, returning true if the left value is
   * less than the right value.
   **/
  "mathLt": function(left, right) {
    return this.mathCompare(left, right, function(a,b) { return a < b; });
  },
  
  /**
   * SpahQL.DataHelper.mathCompare(left, right, callback) -> Boolean result
   * - left (Object, Array, Boolean, String, Number, null): The value at the left-hand side of the comparator
   * - right (Object, Array, Boolean, String, Number, null): The value at the right-hand side of the comparator
   * - callback (Function): A callback function which will be evaluating the mathematical comparison.
   *
   * Compares two objects of any type under the rules of Spah comparisons - both objects must be the same type,
   * and no type coercion will take place. The given callback function should accept two values as an argument and return the comparison result.
   *
   * Mostly used as a refactoring tool to wrap the global math comparison rules.
   **/
  "mathCompare": function(left, right, callback) {
    var leftType = this.objectType(left);
    var rightType = this.objectType(right);
    if(leftType == rightType && (leftType == "number" || leftType == "string")) {
      return callback.apply(this, [left, right]);
    }
    return false;
  },
  
  /**
   * SpahQL.DataHelper.eqRough(left, right) -> Boolean result
   * - left (Object, Array, Boolean, String, Number, null): The value at the left-hand side of the comparator
   * - right (Object, Array, Boolean, String, Number, null): The value at the right-hand side of the comparator
   *
   * Compares two objects under the rules of rough equality. See readme for details.
   **/
  "eqRough": function(left, right) {
    var leftType = this.objectType(left);
    var rightType = this.objectType(right);
    if(leftType != rightType) {
      return false;
    }
    else {
      switch(leftType) {
        case "string":
          return this.eqStringRough(left, right);
          break;
        case "number":
          return this.eqNumberRough(left, right);
          break;
        case "array":
          return this.eqArrayRough(left, right);
          break;
        case "object":
          return this.eqHashRough(left, right);
          break;
        case "boolean":
          return this.eqBooleanRough(left, right);
          break;
        default:
          return false;
      }
    }
  },
  
  /**
   * SpahQL.DataHelper.eqStringRough(left, right) -> Boolean result
   * - left (String): The value at the left-hand side of the comparator
   * - right (String): The value at the right-hand side of the comparator
   *
   * Compares two strings under the rules of rough equality. The right-hand value is parsed as a RegExp
   * and a result of true is returned if the left value matches it.
   **/
  "eqStringRough": function(left, right) {
    return (left.match(new RegExp(right, "g")));
  },
  
  /**
   * SpahQL.DataHelper.eqNumberRough(left, right) -> Boolean result
   * - left (Number): The value at the left-hand side of the comparator
   * - right (Number): The value at the right-hand side of the comparator
   *
   * Compares two numbers for equality using integer accuracy only.
   **/
  "eqNumberRough": function(left, right) {
    return (Math.floor(left) == Math.floor(right));
  },
  
  /**
   * SpahQL.DataHelper.eqArrayRough(left, right) -> Boolean result
   * - left (Array): The value at the left-hand side of the comparator
   * - right (Array): The value at the right-hand side of the comparator
   *
   * Compares two arrays under the rules of rough equality. A result of true
   * is returned if the arrays are joint sets, containing any two equal values.
   **/
  "eqArrayRough": function(left, right) {
    return this.jointSet(left, right);
  },
  
  /**
   * SpahQL.DataHelper.eqHashRough(left, right) -> Boolean result
   * - left (Object): The value at the left-hand side of the comparator
   * - right (Object): The value at the right-hand side of the comparator
   *
   * Compares two objects under the rules of rough equality. A result of true
   * is returned if the hashes are joint sets, containing any two equal values at the same key.
   **/
  "eqHashRough": function(left, right) {
    for(var k in left) {
      if(right[k] && this.eq(left[k], right[k])) return true;
    }
    return false;
  },
  
  /**
   * SpahQL.DataHelper.eqBooleanRough(left, right) -> Boolean result
   * - left (Boolean, null): The value at the left-hand side of the comparator
   * - right (Boolean, null): The value at the right-hand side of the comparator
   *
   * Compares two boolean-type objects under the rules of rough equality. A result of true
   * is returned if both values are truthy or if both values evaluate to false.
   **/
  "eqBooleanRough": function(left, right) {
    return ((left && right) || (!left && !right));
  },
  
  /**
   * SpahQL.DataHelper.eqSetStrict(set1, set2) -> Boolean result
   * - set1 (Array): The value at the left-hand side of the comparator
   * - set2 (Array): The value at the right-hand side of the comparator
   *
   * Compares two sets under the rules of strict equality. A result of true
   * is returned if both sets have a 1:1 relationship of values. The values
   * do not have to appear in the same order.
   **/
  "eqSetStrict": function(set1, set2) {
    if(set1.length != set2.length) return false;
    var foundIndexMap = [];
    for(var i=0; i < set1.length; i++) {
      var val = set1[i];
      for(var j=0; j < set2.length; j++) {
        // Search for equality values in the second set
        var candidate = set2[j];
        if(this.eq(val, candidate) && (foundIndexMap.indexOf(j) < 0)) {
          foundIndexMap.push(j);
        }
      }
    }
    return (foundIndexMap.length == set1.length);
  },

  /**
   * SpahQL.DataHelper.eqSetRough(set1, set2) -> Boolean result
   * - set1 (Array): The value at the left-hand side of the comparator
   * - set2 (Array): The value at the right-hand side of the comparator
   *
   * Compares two sets under the rules of rough equality. A result of true
   * is returned if any value in the left-hand set is roughly equal to any
   * value in the right-hand set.
   **/
  "eqSetRough": function(set1, set2) {
    return this.jointSetWithCallback(set1, set2, function(a,b) { return this.eqRough(a,b); });
  },
  
  /**
   * SpahQL.DataHelper.jointSet(set1, set2) -> Boolean result
   * - set1 (Array): The value at the left-hand side of the comparator
   * - set2 (Array): The value at the right-hand side of the comparator
   *
   * Compares two sets and returns a result of true if any value in the left-hand
   * set is strictly equal to any value from the right-hand set.
   **/
  "jointSet": function(set1, set2) {
    return this.jointSetWithCallback(set1, set2, function(a,b) { return this.eq(a,b); });
  },
  
  /**
   * SpahQL.DataHelper.gteSet(set1, set2) -> Boolean result
   * - set1 (Array): The value at the left-hand side of the comparator
   * - set2 (Array): The value at the right-hand side of the comparator
   *
   * Compares two sets and returns a result of true if any value in the left-hand
   * set is greater than or equal to any value from the right-hand set.
   **/
  "gteSet": function(set1, set2) {
    return this.jointSetWithCallback(set1, set2, function(a,b) { return this.mathGte(a,b) });
  },
  
  /**
   * SpahQL.DataHelper.lteSet(set1, set2) -> Boolean result
   * - set1 (Array): The value at the left-hand side of the comparator
   * - set2 (Array): The value at the right-hand side of the comparator
   *
   * Compares two sets and returns a result of true if any value in the left-hand
   * set is less than or equal to any value from the right-hand set.
   **/
  "lteSet": function(set1, set2) {
    return this.jointSetWithCallback(set1, set2, function(a,b) { return this.mathLte(a,b) });
  },
  
  /**
   * SpahQL.DataHelper.gtSet(set1, set2) -> Boolean result
   * - set1 (Array): The value at the left-hand side of the comparator
   * - set2 (Array): The value at the right-hand side of the comparator
   *
   * Compares two sets and returns a result of true if any value in the left-hand
   * set is greater than any value from the right-hand set.
   **/
  "gtSet": function(set1, set2) {
    return this.jointSetWithCallback(set1, set2, function(a,b) { return this.mathGt(a,b) });
  },
  
  /**
   * SpahQL.DataHelper.ltSet(set1, set2) -> Boolean result
   * - set1 (Array): The value at the left-hand side of the comparator
   * - set2 (Array): The value at the right-hand side of the comparator
   *
   * Compares two sets and returns a result of true if any value in the left-hand
   * set is less than any value from the right-hand set.
   **/
  "ltSet": function(set1, set2) {
    return this.jointSetWithCallback(set1, set2, function(a,b) { return this.mathLt(a,b) });
  },
  
  /**
   * SpahQL.DataHelper.jointSetWithCallback(set1, set2, callback) -> Boolean result
   * - set1 (Array): The value at the left-hand side of the comparator
   * - set2 (Array): The value at the right-hand side of the comparator
   * - callback (Function): A function to be used for comparing the values. Should accept two values as arguments.
   *
   * Iterates over both sets such that every combination of values from the two is passed to the callback function
   * for comparison. If the callback function at any point returns true, the method exits and returns true. Once
   * all combinations have been exhausted and no matches are found, false will be returned.
   *
   * Mostly used to refactor the various joint set methods (jointSet, eqSetRough, gteSet, gtSet, ltSet, lteSet to name a few).
   **/
  "jointSetWithCallback": function(set1, set2, callback) {
    for(var i=0; i < set2.length; i++) {
      for(var j=0; j < set1.length; j++) {
        if(callback.apply(this, [set1[j], set2[i]])) return true;
      }
    }
    return false;
  },
  
  /**
   * SpahQL.DataHelper.superSet(superset, subset) -> Boolean result
   * - superset (Array): The value being asserted as a superset of the 'subset' argument.
   * - subset (Array): The value being asserted as a subset of the 'superset' argument.
   *
   * Compares two sets and returns a result of true if every value in the given subset
   * has a corresponding equal in the superset. Order of values within the sets is not enforced.
   **/
  "superSet": function(superset, subset) {
    var foundIndexMap = [];
    isubset: for(var i=0; i < subset.length; i++) {
      var subVal = subset[i];
      isuperset: for(var j=0; j < superset.length; j++) {
        var superVal = superset[j];
        if((foundIndexMap.indexOf(j) == -1) && this.eq(subVal, superVal)) {
          foundIndexMap.push(j);
          break isuperset;
        }
      }
    }
    return (subset.length == foundIndexMap.length);
  },
  
  /**
   * SpahQL.DataHelper.truthySet(set) -> Boolean result
   * - set (Array): The value being asserted as a "truthy" set.
   *
   * Asserts that a set may be considered "truthy", i.e. containing one or more
   * values that evaluate to true under javascript language rules.
   **/
  "truthySet": function(set) {
    for(var i=0; i < set.length; i++) {
      if(set[i]) return true;
    }
    return false;
  },
  
  /**
   * SpahQL.DataHelper.coerceKeyForObject(key, obj) -> String, Integer, null
   * - key (Integer, String): The key to be coerced.
   * - obj (Object): The value being inspected
   *
   * When you want to set a key on an anonymous object, you'll want to coerce the
   * key to the correct type - numbers for arrays, strings for objects. This function does that.
   * Returns null if the key can't be coerced for the given object.
   **/
  "coerceKeyForObject": function(key, obj) {
    var t = this.objectType(obj);
    if(t == "array") {
      var k = parseInt(key);
      return isNaN(k)? null : k;
    }
    else if(t == "object") {
      var k = key.toString();
      return (k.match(/^\s*$/))? null : k;
    }
    return null;
  },

  /**
   * SpahQL.DataHelper.deepClone(obj) -> Object
   * obj (Array, Object): The object to be cloned
   *
   * Creates a deep clone of an object or array. All nested objects and arrays
   * are also deep-cloned. Strings, booleans and numbers are returned as-is, because
   * all in-place modifications to strings and numbers produce new object assignments
   * anyway.
   **/
  "deepClone": function(obj) {
    var objType = this.objectType(obj);
    if(objType == "array" || objType == "object") {
      var clone = (objType == "array")? [] : {};
      for(var key in obj) {
        var val = obj[key];
        clone[key] = this.deepClone(val);
      }
      return clone;
    }
    else {
      return obj;
    }
  }
  
  
});