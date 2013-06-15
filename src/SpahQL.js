/**
 * class SpahQL
 *
 * General instance wrapper for SpahQL data objects.
 **/

/**
 * SpahQL_classRegister(name, klass) -> void
 * - name (String): The name for the new Spah class, e.g. "SpahQL.Foo.Bar"
 * - klass (Function): The class constructor being registered.
 *
 * Registers a created class with the Spah package using both CamelCase and commonJs-style naming schemes.
 * The Spah package is already registered with the window or the commonJS exports object automatically.
 **/
SpahQL_classRegister = function(name, klass) {
  // Register on the Spah constant
  var nameNS = name.split(".");
  var w = (typeof(window)=='undefined')? {} : window;
  var e = (typeof(exports)=='undefined')? {} : exports;
  var targetBrowser = (typeof(SpahQL)=='undefined')? w : SpahQL;
  var targetCommonJS = (typeof(SpahQL)=='undefined')? e : SpahQL;
  for(var n=1; n<nameNS.length; n++) {
    var browserName = nameNS[n];
    var commonJSName = browserName.toLowerCase();
    if(n < nameNS.length-1) {
      // intermediary key
      targetBrowser[browserName] = targetBrowser[browserName] || {};
      targetBrowser = targetBrowser[browserName];
      targetCommonJS[commonJSName] = targetCommonJS[commonJSName] || {};
      targetCommonJS = targetCommonJS[commonJSName]
    }
    else {
      // final key
      targetBrowser[browserName] = klass;
      targetCommonJS[commonJSName] = klass;
    }
  }
}

/**
 * SpahQL_classExtend(name, superKlass[, constructor][, klassProps][, instanceProps]) -> Function
 * - name (String): The name for the new Spah class without the "Spah" namespace. E.g. to create SpahQL.Foo.Bar, use classCreate("Foo.Bar")
 * - superKlass (Function): The class to be extended non-destructively.
 * - constructor (Function): The constructor function for this class. If not provided, will search the prototype chain for "init"
 * - klassProps (Object): A hash of class-level properties and functions
 * - instanceProps (Object): A hash of instance-level properties and functions to be applied to the class' prototype.
 *
 * Creates a new class that extends another class. Follows the same rules as SpahQL_classCreate. The superclass does not 
 * need to be a part of the Spah package.
 **/
SpahQL_classExtend = function(name, superKlass, constructor, klassProps, instanceProps) {
  // Massage args
  var con, kP, iP;

  if(typeof(constructor) == "function") {
    // Taking custom constructor arg pattern
    kP = klassProps || {};
    iP = instanceProps || {};
    con = constructor;
  }
  else {
    // Taking optional constructor arg pattern
    // Transpose module arguments
    kP = constructor || {};
    iP = klassProps || {};
    con = iP.init;
  }

  var klass;  
  // Treat instance properties - create proto
  var proto = Object.create(superKlass.prototype);
  for(var i in iP) {
    Object.defineProperty(proto, i, {
      value: iP[i],
      enumerable: false
    });
    //proto[i] = iP[i];
  }

  // Find constructor
  if(con) {
    // Found local constructor on instance props
    klass = con;
  }
  else if(proto.init) {
    // Found constructor up the proto chain
    // Wrap function - TODO make this faster
    klass = function() {
      if(this.init) this.init.apply(this, arguments);
    }
  }
  else {
    // No constructor found, give a blank one. This is probably a singleton class.
    klass = function() {};
  }
  klass.prototype = proto;

  // Treat superclass class properties
  for(var s in superKlass) { 
    klass[s] = superKlass[s];
  }
  // Treat class properties
  for(var k in kP) {
    klass[k] = kP[k];
  }

  SpahQL_classRegister(name, klass);
  return klass;
}

/**
 * SpahQL_classCreate(name[, constructor][, klassProps][, instanceProps]) -> Function
 * - name (String): The name for the new Spah class, e.g. "SpahQL.Foo.Bar"
 * - constructor (Function): The constructor function for this class. If not provided, will search the prototype chain for "init"
 * - klassProps (Object): A hash of class-level properties and functions
 * - instanceProps (Object): A hash of instance-level properties and functions to be applied to the class' prototype.
 *
 * Creates a class internal to the Spah library and namespace.
 **/
SpahQL_classCreate = function(name, constructor, klassProps, instanceProps) {
  // Make the class constructor
  return SpahQL_classExtend(name, Object, constructor, klassProps, instanceProps)
};

SpahQL = SpahQL_classExtend("SpahQL", Array, {
  
  /**
   * SpahQL.db(data) -> SpahQL
   *
   * Create a new root-level SpahQL database with the given data.
   **/
  "db": function(data) {
    return this.item("/", data, data);
  },

  /**
   * SpahQL.result(path, value, sourceData) -> Object
   * - path (String, null): The path for this result primitive
   * - value: The value at the given path
   * - sourceData: The source database on which events are dispatched
   *
   * Create and return a new result primitive to be wrapped in a SpahQL instance.
   **/
   "result": function(path, value, sourceData) {
      var r = {
        "path": path,
        "value": value,
        "sourceData": ((path)? sourceData : (sourceData || value))
      }
      return r;
   },

   "item": function(path, value, sourceData) {
      return new this(this.result(path, value, sourceData));
   },

  /** 
   * SpahQL.select(query, rootData[,scopeData][,path]) -> SpahQL
   * - query (String): A valid SpahQL query. This may not be an assertion query.
   * - rootData (Object, Array): The root data context being queried.
   * - scopeData (Object, Array): The actual data context being queried, which should be a sub-context of the rootData.
   * - scopePath (String): Optional: If the data being queried is a member item of a larger queryable data construct, providing the path 
   *    for the queryable object will ensure that results are generated with an accurate path attribute.
   *
   * Executes a query against the given data construct and retrieves all objects that match the supplied query.
   **/
  "select": function(query, rootData, scopeData, scopePath) {
    var pQuery = this.QueryParser.parseQuery(query);
    if(pQuery.assertion) throw new this.SpahQLRunTimeError("Cannot call SpahQL.select() with an assertion query.");
    return new this(this.QueryRunner.select(pQuery, rootData, scopeData, scopePath));
  },
  
  /**
   * SpahQL.assert(query, data) -> Boolean
   * - query (String): A valid SpahQL query. This may not be an assertion query.
   * - rootData (Object, Array): The root data context being queried.
   * - scopeData (Object, Array): The actual data context being queried, which should be a sub-context of the rootData.
   * - scopePath (String): Optional: If the data being queried is a member item of a larger queryable data construct, providing the path 
   *    for the queryable object will ensure that results are generated with an accurate path attribute.
   *
   * Executes an assertion query and returns the appropriate boolean result.
   **/
  "assert": function(query, rootData, scopeData, scopePath) {
    var pQuery = this.QueryParser.parseQuery(query);
    return this.QueryRunner.assert(pQuery, rootData, scopeData, scopePath);
  },

  /**
   * SpahQL.verbose -> Boolean
   * Set to <true>true</true> if you wish Spah to produce debug output in the browser's console.
   **/
  "verbose": false,

  /**
   * SpahQL.log(message, objects) -> String message
   * Logs debug output to Spah's internal logger. If SpahQL.verbose is set to true, the message will appear in the browser's console.
   **/
  "log": function(message) {
    if(this.verbose && typeof(console) != "undefined") {
      console.log.apply(console, arguments);
    }
    return message;
  },

  /**
   * SpahQL.inBrowser() -> Boolean
   *
   * Returns true if the runtime environment is identified as being in-browser.
   **/
  "inBrowser": function() {
    return (typeof(window) != "undefined" && typeof(window.location) == "object");
  },

  /**
   * SpahQL.isHeadless() -> Boolean
   *
   * Returns true if the runtime environment is identified as being headless e.g. a Node.js runtime.
   **/
  "isHeadless": function() {
    return !this.inBrowser();
  },
  "inCommonJS": function() {
    return (typeof(exports) == "object");
  }

}, {

  // INSTANCE
  // ------------------------------------------------------------------------

  /**
   * new SpahQL(results[, result1][, result2])
   * 
   * Instantiate a new SpahQL monad with the given set of results. Each result is an object with keys
   * "path" (indicating the absolute path of the item), "value" (indicating the value at this path) and 
   * "sourceData" (indicating the original data structure from which this data was culled).
   *
   * It's recommended that you leave this method to be used by Spah's internals, and instead use
   * SpahQL.db(data) to create new SpahQL resources.
   **/
  "init": function(results) {
    Object.defineProperty(this, "dh", {value: SpahQL.DataHelper, enumerable: false});
    if(!results) {
      return;
    }
    else {
      results = (arguments.length > 1)? Array.prototype.slice.call(arguments) : results;
      results = (results.hasOwnProperty('value') && typeof(results.value)!="function")? [results] : results;
      for(var i in results) this.push(results[i]);
    }
  },

  /**
   * SpahQL#length -> Number
   *
   * Returns the number of results in this set.
   **/

  /**
   * SpahQL#item(index) -> SpahQL
   * - index (Number): The index of the item you're after
   *
   * Retrieves a particular item from this set of results and returns a new SpahQL instance containing that item.
   **/
  "item": function(index) {
    return new SpahQL(this[index]);
  },

  /**
   * SpahQL#first() -> SpahQL
   *
   * Retrieves the first item from this set as a new SpahQL instance - which will be empty if this set is also empty. 
   **/
  "first": function() {
    return this.item(0);
  },

  /**
   * SpahQL#last() -> SpahQL
   *
   * Retrieves the last item from this set as a new SpahQL instance - which will be empty if this set is also empty. 
   **/
  "last": function() {
    return this.item(this.length-1);
  },

  /**
   * SpahQL#path() -> String, null
   *
   * Returns the absolute path for the first item in this set.
   **/
  "path": function() {
    return (this[0])? this[0].path : null;
  },

  /**
   * SpahQL#paths() -> Array
   *
   * Returns an array containing the absolute path for every item in this set.
   **/
  "paths": function() {
    return this.map(function() { return this.path() });
  },

  /**
   * SpahQL#value() -> String, null
   *
   * Returns the data value for the first item in this set.
   **/
  "value": function() {
    return (this[0])? this[0].value : null;
  },

  /**
   * SpahQL#values() -> Array
   *
   * Returns an array containing the data values for every item in this set.
   **/
  "values": function() {
    return this.map(function() { return this.value() });
  },

  /**
   * SpahQL#sourceData() -> Object
   *
   * The original, root-level object from which this SpahQL instance draws data.
   **/
  "sourceData": function() {
    return (this[0])? this[0].sourceData : null;
  },


  /**
   * SpahQL#each(callback) -> SpahQL
   * - callback (Function): A callback to execute against each result in the set. The callback will receive the arguments (index, total).
   *    within the function, the <code>this</code> keyword will refer to the QueryResult for this iteration.
   *
   * Executes the callback function with each item in this resultset. The 
   * loop is halted if the callback at any time returns false. This method will
   * return true if the loop completes, and false if it is halted midway. If the callback
   * function does not return anything, the loop will continue to completion.
   **/
  "each": function(callback) {
    for(var i=0; i<this.length; i++) {
      if(callback.apply(this.item(i), [i, this.length]) == false) break;
    }
    return this;
  },  

  /**
   * SpahQL#map(callback) -> Array
   * - callback (Function): A callback to execute against each result in the set. The callback is exactly as used with #each, but should return a value.
   *
   * Executes the callback function with each item in this set. The return value from
   * each iteration of the callback is appended to an array, which is returned at the end of the loop.
   **/
  "map": function(callback) {
    var a = [];
    for(var i=0; i<this.length; i++) {
      a.push(callback.apply(this.item(i), [i, this.length]));
    }
    return a;
  },

  /**
   * SpahQL#select(query) -> SpahQL
   *
   * Runs a selection query relative to all items in this set, and returns the results.
   * For instance:
   *
   *      select("/foo/foo").select("/foo") // identical to select("/foo/foo/foo")
   **/
  "select": function(query) {
    var results = [];
    this.each(function() {
      SpahQL.select(query, this.sourceData(), this.value(), this.path()).each(function() {
        results.push(this[0])
      });
    });
    return new SpahQL(results);
  },

  /**
   * SpahQL#assert(query) -> Boolean
   *
   * Runs an assertion query against every item in this set. Returns <code>false</code> if any one item fails to meet the assertion.
   *
   *      select("/foo/foo").first().assert("/foo") // Is exactly the same as just asserting /foo/foo/foo.
   **/
  "assert": function(query) {
    var result = true; 
    this.each(function() {
      if(!SpahQL.assert(query, this.sourceData(), this.value(), this.path())) {
        result = false;
        return false;
      }
    });
    return result;
  },

  /**
   * SpahQL#parentPath() -> String or null
   * 
   * Returns the parent path for the first item in this set, or null if this item is the root.
   * For instance, a result with path "/foo/bar/baz" has parent path "/foo/bar"
   **/
  "parentPath": function(path) {
    var p = path || this.path(); 
    var pp = (!p || p == "/")? null : p.substring(0, p.lastIndexOf("/"));
    return (pp=="")? "/" : pp;
  },

  /**
   * SpahQL#parentPaths() -> Array
   *
   * Returns an array of containing the parent path of each item in this set.
   **/
  "parentPaths": function() {
    var scope = this;
    return this.map(function() {
      return scope.parentPath(this.path());
    })
  },

  /**
   * SpahQL#parent() -> null, SpahQL
   *
   * Retrieves the parent object from the data construct that originally generated this
   * query result. Remember to always assume that the data may have been modified in the 
   * meantime.
   **/
  "parent": function(result) {
    var target = result || this[0];
    var path = this.parentPath(target.path);
    return (path && target)? SpahQL.select(path, target.sourceData) : null;
  },

  /**
   * SpahQL#parents() -> SpahQL
   *
   * Retrieves the parent object for the first item in this resultset.
   **/
  "parents": function() {
    var collection = [];
    var scope = this;
    this.each(function() {
      var p = scope.parent(this[0]);
      if(p && p[0]) collection.push(p[0]);
    });
    return new SpahQL(collection);
  },

  /**
   * SpahQL#keyName() -> String or null
   * 
   * Returns the name for the first item in this set, based on its path. If the item is the root
   * or if the result was not created from a path query then the method will return null.
   *
   *      select("/foo").keyName() //-> "foo"
   *      select("/foo/bar/.size").keyName() // -> ".size"
   **/
  "keyName": function(p) {
    p = p || this.path();
    return (!p || p == "/")? null : p.substring(p.lastIndexOf("/")+1);
  },

  /** 
   * SpahQL#keyNames() -> Array
   *
   * Returns an array of key names for all items in this set, based on the path of each item in the set.
   * Items which are not the result of path queries, such as set literals, will appear as null entries in the array.
   **/ 
  "keyNames": function() {
    var scope = this;
    return this.map(function() {
      return scope.keyName(this.path());
    })
  },

  /**
   * SpahQL#type() -> String
   *
   * Returns the type of data for the first item in this set as a string, e.g. array, object, number etc.
   **/
  "type": function(value) {
    var v = value || this.value();
    return this.dh.objectType(v);
  },

  /**
   * SpahQL#types() -> Array
   *
   * Returns a map of data types for all items in this set, e.g. ["array", "object", "number"]
   **/
  "types": function() {
    var scope = this;
    return this.map(function() {
      return scope.type(this.value());
    });
  },

  /**
   * SpahQL#containing(spahql) -> SpahQL
   * - spahql (SpahQL): A SpahQL object containing any number of results
   * SpahQL#containing(path) -> SpahQL
   * - path (String): An absolute path
   * SpahQL#containing(pathList) -> SpahQL
   * - pathList (Array): An array of absolute path strings
   *
   * Reduces this set of results to only those items containing one or more of the given absolute paths,
   * returning the reduced set as a new SpahQL instance.
   *
   * Note that the existence of the given paths is not checked for - this method only matches on the paths
   * themselves. If you need to assert the existence of a subpath, consider using #assert or #select.
   *
   * For instance:
   *
   *    var db = SpahQL.db(someData);
   *    var foo = db.select("//foo");
   *    foo.length //-> 2
   *    foo.paths() //-> ["/a/foo", "/b/foo"]
   *    foo.containing("/a/foo").paths() //-> ["/a/foo"], because the path was matched exactly
   *    foo.containing("/b/foo/bar/baz").paths() //-> ["/b/foo"], because '/b/foo' is a superpath for the given path
   *    
   **/
  "containing": function(obj, strict) {
    var paths, matchesRequired;

    // Do sugar
    if(typeof obj == "string") paths = [obj];
    else if((typeof obj.paths == "function")) paths = obj.paths();
    else paths = obj;

    matchesRequired = (strict)? paths.length : 1;

    // Filter
    var matches = [];
    results: for(var i=0; i<this.length; i++) {
      var res = this[i];

      if(res.path) {
        // Match subpaths
        var pathMatches = 0;

        subpaths: for(var j=0; j<paths.length; j++) {
          if(paths[j].indexOf(res.path) == 0 && (paths[j].charAt(res.path.length) == "" || paths[j].charAt(res.path.length) == "/")) {
            pathMatches++;
            if(pathMatches >= matchesRequired) {
              matches.push(res);
              continue results;
            }
          }
        }
      }

    }
    return new SpahQL(matches);
  },

  /**
   * SpahQL#containingAll(spahql) -> SpahQL
   * - spahql (SpahQL): A SpahQL object containing any number of results
   * SpahQL#containingAll(path) -> SpahQL
   * - path (String): An absolute path
   * SpahQL#containingAll(pathList) -> SpahQL
   * - pathList (Array<String>): An array of absolute paths
   *
   * Works just like #containing, but reduces this set to only those items which contain ALL of the argument paths.
   **/
  "containingAll": function(obj) {
    return this.containing(obj, true);
  },

  /**
   * SpahQL#filter(query) -> SpahQL
   * - query (String): A SpahQL assertion query.
   *
   * Runs the given assertion against each item in this set and returns a new SpahQL set containing
   * only those items meeting the given assertion.
   **/
  "filter": function(query) {
    var matches = [];
    this.each(function() {
      if(this.assert(query)) matches.push(this[0]);
    });
    return new SpahQL(matches);
  },

  /**
   * SpahQL#concat(otherSpahQL) -> SpahQL
   * - otherSpahQL (SpahQL): Any other SpahQL instance.
   *
   * Creates and returns a new SpahQL set containing all results from this instance followed
   * by all results from the given instance.
   **/
  "concat": function(otherSpahQL) {
    var conc = [];
    for(var i=0; i<this.length; i++) conc.push(this[i]);
    for(var j=0; j<otherSpahQL.length; j++) conc.push(otherSpahQL[j]);
    return new SpahQL(conc);
  },

  /**
   * SpahQL#detach() -> SpahQL
   *
   * Creates and returns the first item from this set as a new SpahQL database, using
   * a deep clone of the item's value.
   *
   * For instance:
   *
   *  var myDb = SpahQL.db({foo: {bar: "baz"}});
   *  var foo = myDb.select("/foo");
   *  foo.path() // -> "/foo"
   *  foo.value() //-> {bar: "baz"};
   *  var fooClone = foo.detach();
   *  fooClone.path() //-> "/"
   *  fooClone.value() //-> {bar: "baz"}
   *  fooClone.value() == foo.value() //-> false
   *  fooClone.set("bar", "baz-changed")
   *  fooClone.select("/bar").value() //-> "baz-changed"
   *  foo.select("/bar").value() //-> "baz"
   **/
  "detach": function() {
    var data = this.dh.deepClone((this[0])? this[0].value : null);
    return SpahQL.db(data);
  },


  /**
   * SpahQL#clone() -> SpahQL
   *
   * Produces a completely detached clone of this result set. This method does
   * the equivalent of deep-cloning the original data used to create the SpahQL database
   * (using SpahQL.db(data), for instance) and re-querying that clone for every result
   * path found in this set.
   *
   * The result is a complete clone which may have its own change listeners and which
   * may be freely modified without disrupting the original.
   *
   * If this set contains any literals (from a query such as "{1,2,3}") these results
   * are cloned as well.
   **/
  "clone": function() {
    var results = [],
        sourceDatas = [],
        sourceDataCloneDBs = [];

    for(var i=0; i<this.length; i++) {
      var sd = this[i].sourceData,
          path = this[i].path;

      if(path) {
        // Query result
        var sdi = sourceDatas.indexOf(sd);
        var sdc;
        
        // For each sourceData found, clone it
        if(sdi < 0) {
          sdc = SpahQL.db(this.dh.deepClone(sd));

          sourceDatas.push(sd);
          sourceDataCloneDBs.push(sdc);
          sdi = sourceDatas.length-1;
        }
        else {
          sdc = sourceDataCloneDBs[sdi];
        }
        
        // Now sourcedata is cloned, we can requery for the result
        var cloneResult = sdc.select(path);
        if(cloneResult[0]) results.push(cloneResult[0]);
      }
      else {
        // Primitive result, clone it right away
        results.push(this.dh.deepClone(this[i]));
      }
    }
    return new SpahQL(results);
  },

  /**
   * SpahQL#set(key, value) -> SpahQL
   * - key (String, Number): The key to set on this result
   * - value: The value to set for the given key
   * SpahQL#set(dictionary) -> SpahQL
   * - dictionary (Object): A key/value hash containing multiple keys to be set.
   *
   * Take the data for the first result item in this set, and set a key on it.
   * Has no effect if the data being modified is a basic type such as a string
   * or number.
   *
   *    var db = SpahQL.db({foo: {a: "b"}});
   *    var foo = db.select("/foo");
   *    foo.set("new-key", "moose"); //-> data is now {foo: {a: "b", "new-key": "moose"}}
   *
   * Returns self.
   **/
  "set": function(keyOrDict, value, result) {
    var values;
    var target = result || this[0];
    if(!target) return this;

    if(this.dh.objectType(keyOrDict) == "object") {
      values = keyOrDict;
    }
    else {
      values = {};
      values[keyOrDict] = value;
    }

    var dispatch = false;
    var originalValue = this.dh.deepClone(target.value);

    for(var hKey in values) {
      var v = values[hKey];
      var k = this.dh.coerceKeyForObject(hKey, target.value);

      if(k != null) {
        if(!this.dh.eq(v, target.value[k])) {
          target.value[k] = v;
          dispatch = true;
        }
      }
    }
    if(dispatch) this.resultModified(target, originalValue);
    return this;
  },

  /**
   * SpahQL#setAll(key, value) -> SpahQL
   * - key (String, Number): The key to set on this result
   * - value: The value to set for the given key
   * SpahQL#setAll(dictionary) -> SpahQL
   * - dictionary (Object): A key/value hash containing multiple keys to be set.
   *
   * Just like #set, only it attempts to set the given key(s) on all items in this set:
   *
   *    db.select("//foo").set("a", "a-value") // Attempt to set "a" on all "foo" objects
   *
   * Just like #set, returns self.
   **/
  "setAll": function(keyOrDict, value) {
    for(var i=0; i<this.length; i++) this.set(keyOrDict, value, this[i]);
    return this;
  },

  /**
   * SpahQL#replace(value) -> SpahQL
   * - value (Object): The value to replace this query result's value.
   *
   * Replaces the value of the first item in this set, modifying the queried data
   * in the process. If the first item in this set is the root, no action will be taken.
   *
   * Returns self.
   **/
  "replace": function(value, result) {
    var target = result || this[0];
    var k = this.keyName(target.path);

    if(k && target) {
        var prev = target.value;
        target.value = value;
        var p = this.parent(target);
        if(p) {
          p.set(k, value);
        }
        else {
          this.resultModified(target, prev);
        }
    }
    return this;
  },

  /**
   * SpahQL#replaceAll(value) -> SpahQL
   *
   * Works just like #replace, but takes action against every result in this set:
   *
   *    // Replace all hashes with a polite notice.
   *    db.select("//[/.type=='object']").replace("NO HASHES FOR YOU. ONE YEAR.")
   *
   **/
  "replaceAll": function(value) {
    for(var i=0; i<this.length; i++) this.replace(value, this[i]);
    return this;
  },

  /**
   * SpahQL#rename(key) -> SpahQL
   * - key (Object): The key to replace this query result's key.
   *
   * Renames the key of the first item in this set, modifying the queried data
   * in the process. If the first item in this set is the root, no action will be taken.
   *
   * Returns self.
   **/
  "rename": function(key, result) {
    var target = result || this[0];

    if (target) {
      var prev = target.value;
      var p = this.parent(target);
      if (p) {
        p.set(key, prev);
        p.destroy(target);
      } else {
        this.resultModified(target, prev);
      }
      }
    return this;
  },

  /**
   * SpahQL#renameAll(key) -> SpahQL
   *
   * Works just like #rename, but takes action against every result in this set.
   *
   **/
  "renameAll": function(key) {
    for (var i = 0; i < this.length; i++) {
      this.rename(key, this[i]);
    }
    return this;
  },

  /**
   * SpahQL#destroy([key]) -> SpahQL
   *
   * Deletes data from the first result in this set. If a key is supplied, the key will be deleted from value.
   * If no arguments are given, the entire result will be deleted from its parent.
   *
   * Deletion takes different effects depending on the data type of this query result.
   * Arrays are spliced, removing the specified index from the array without leaving an empty space. 
   * Objects/Hashes will have the specified key removed, if the key exists.
   *
   * The root data construct may not be deleted. This method always returns self.
   **/
  "destroy": function(target, key) {
    if(!target || typeof(target)!="object") {
      key = target;
      target = this[0]
;    }

    if(target && key) {
      // Key deletion
      var modified = false;
      var oldVal, newVal;
      var type = this.type(target.value);
      
      // Shallow-clone original value...
      // Original value is cloned so that new value can remain pointed to source data.
      var cKey = SpahQL.DataHelper.coerceKeyForObject(key, target.value);
      if(type == "array") {
        // Doing array splice
        oldVal = target.value.slice(0); // shallow array clone
        target.value.splice(cKey, 1);
      }
      else if(type == "object") {
        // Doing hash delete
        oldVal = {};
        // Shallow hash clone
        for(var v in target.value) oldVal[v] = target.value[v];
        delete target.value[cKey];
      }
      this.resultModified(target, oldVal);
    }
    else if(target) {
      // Self-deletion
      var k = this.keyName(target.path);
      var p = this.parent(target);
      if(p && k) {
        p.destroy(k);
      }
    }
    
    return this;
  },

  /**
   * SpahQL#destroyAll([key]) -> SpahQL
   *
   * Just like #delete, but called against every item in this set. Returns self.
   **/
  "destroyAll": function(key) {
      for(var i=this.length-1; i>-1; i--) this.destroy(this[i], key);
    return this;
  },

  /**
   * SpahQL#listen(path, callback) -> SpahQL
   * - path (String): A path relative to the items in this set, if you only want to listen for changes on a particular subkey.
   * - callback (Function): A function to be called when the data in this SpahQL set is modified.
   * SpahQL#listen(callback) -> SpahQL
   * - callback (Function): A function to be called when the data in this SpahQL set is modified.
   *
   * Registers a callback to be triggered when data within this set of results is modified.
   * Note that this method listens for changes on all items in this set:
   *
   *    var db = SpahQL.db(some_data);
   *    
   *    // Callback triggered whenever the first item in any array anywhere is modified
   *    db.select("//0").modified(function() {...}) 
   *    
   *    // Callback triggered only when a specific array is modified
   *    db.select("//0").item(0).modified(function() {....})
   *    
   *
   * Upon modification, the callback will be triggered with arguments:
   * - <code>result</code>: A SpahQL instance containing one result item, the item modified. This may be <code>undefined</code> if the data at that path was removed during the modification.
   * - <code>path</code>: The path being observed
   * - <code>subpaths</code>: An array of paths modified, relative to the path being observed. Empty if the observed path was itself replaced.
   *
   * Returns self.
   **/
  "listen": function(pathOrCallback, callback, remove) {
    // Get callback func
    var cbFunc = (callback)? callback : pathOrCallback;
    // Get path for event
    var pathArg = (callback)? pathOrCallback : null;

    for(var i=0; i<this.length; i++) {
      var res = this[i];
      var path = (res.path=="/")? (pathArg||res.path) : res.path + (pathArg||"");

      if(remove) SpahQL.Callbacks.removeCallbackForPathModifiedOnObject(path, res.sourceData, cbFunc);
      else SpahQL.Callbacks.addCallbackForPathModifiedOnObject(path, res.sourceData, cbFunc);
    }
    
    return this;
  },

  /**
   * SpahQL#unlisten(path, callback) -> SpahQL
   * - path (String): The subpath previously subscribed using #listen
   * - callback (Function): The function registered as a callback using #listen
   * SpahQL#unlisten(callback) -> SpahQL
   * - callback (Function): The function registered as a callback using #listen
   *
   * Removes a listener previously created with #listen, accepting the same objects as arguments in order to identify the listener being destroyed.
   *
   * Returns self.
   **/
  "unlisten": function(pathOrCallback, callback) {
    this.listen(pathOrCallback, callback, true);
  },

  /**
   * SpahQL#resultModified(result, oldValue) -> void
   * - result (Object): A primitive result object that was modified as a result of a modification made to this set
   * - oldValue: The prior value of the modified result
   *
   * Raises modification events for anything subscribing to changes to the modified path chain on the specified result object.
   **/
  "resultModified": function(result, oldValue) {
    SpahQL.Callbacks.pathModifiedOnObject(
      result.path, 
      result.sourceData, 
      oldValue, 
      result.value
    );
  },

  /**
   * SpahQL.valueOf() -> JSON Literal
   *
   * Returns a JSON literal of the query results. A shortcut for including the raw select result in
   * another operation, such as [].concat(db.select("//foo"), db.select("//bar"))
   **/
  "valueOf": function() {
    return JSON.parse(this.toString());
  },

  /**
   * SpahQL.toString() -> JSON Serialization
   *
   * Returns a JSON serialized string of the query results. Used by valueOf above.
   **/
  "toString": function() {
    return JSON.stringify(
      this.length > 1 ? this.map(function(item) { return item.value; }) :
      this.length > 0 ? this[0].value :
      null
    );
  }

});

if(typeof(module) != 'undefined' && typeof(module.exports) != 'undefined') module.exports = SpahQL;
if(typeof(window) != 'undefined') window.SpahQL = SpahQL;
