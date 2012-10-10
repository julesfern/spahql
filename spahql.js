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
var SpahQL_classRegister = function(name, klass) {
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
var SpahQL_classExtend = function(name, superKlass, constructor, klassProps, instanceProps) {
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
var SpahQL_classCreate = function(name, constructor, klassProps, instanceProps) {
  // Make the class constructor
  return SpahQL_classExtend(name, Object, constructor, klassProps, instanceProps)
};

var SpahQL = SpahQL_classExtend("SpahQL", Array, {

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
      results = (results.value && typeof(results.value)!="function")? [results] : results;
      for(var i in results) this.push(results[i]);
    }
  },

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
        results.push(this[0]);
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
      target = this[0];
    }

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
    for(var i=0; i<this.length; i++) this.destroy(this[i], key);
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


/**
 * class SpahQL.Callbacks
 *
 * Stores and manages the dispatch of modification callbacks on any data source that can be queried with SpahQL.
 **/

SpahQL_classCreate("SpahQL.Callbacks", {

  // Singleton
  // --------------------

  /**
   * SpahQL.Callbacks.callbacks -> Object
   *
   * A dictionary of all registered SpahQL callbacks, keyed by path. The value
   * is an array containing many arrays, each with a pointer to the object to which the callback refers, and the
   * callback function itself.
   **/
  "callbacks": {},

  "reset": function() {
    this.callbacks = {};
  },

  /**
   * SpahQL.Callbacks.callbacksForPathInObject(path, object) -> Array
   * - path (String): The path for which you are pulling all registered callbacks.
   * - object (Object): The object (which should have previously been queried with SpahQL) in which the path exists.
   *
   **/
  "callbacksForPathInObject": function(path, object) {
    var pathCallbacks = this.callbacks[path];
    var matchingCallbacks = [];
    if(pathCallbacks) {
      for(var i in pathCallbacks) {
        if(pathCallbacks[0] == object) matchingCallbacks.push(path);
      }
    }
    return matchingCallbacks;
  },

  /**
   * SpahQL.Callbacks.pathModifiedOnObject(path, data, oldvalue, newvalue) -> void
   * - path (String): The absolute path for the modified object
   * - data (Object): The root data context that was modified
   * - oldvalue (Object): The value previously found at the modified path
   * - newvalue (Object): The new, up-to-date value for the modified path. If null, the path is considered deleted.
   *
   * Receives a signal from any modified query result that the data at a specific path has been replaced,
   * and triggers event dispatchers registered against the same path and higher that were registered using the same
   * on the same root data construct (using pointer equality.)
   **/
  "pathModifiedOnObject": function(path, data, oldvalue, newvalue) {
    if(!path) return;

    // Create the dispatch strategy based on the modified paths, to avoid duplicate dispatch.
    // IMPORTANT: Deepest paths dispatch first.
    var dispatchQueue = [];
    // Use comparison function to get a full accounting for what has changed inside that scope
    var scopeModifications = SpahQL.DataHelper.compare(oldvalue, newvalue, path);
    for(var modifiedPath in scopeModifications) {
      // Get the oldvalue, newvalue etc.
      var modificationData = scopeModifications[modifiedPath];

      // Push path and all uptree paths onto queue, ensuring uniqueness
      var currentPath = modifiedPath;
      while(currentPath.lastIndexOf("/") >= 0) {
        if(dispatchQueue.indexOf(currentPath) < 0) dispatchQueue.push(currentPath);
        currentPath = (currentPath.lastIndexOf("/") == 0 && currentPath.length>1)? "/" : currentPath.substring(0, currentPath.lastIndexOf("/"));
      }
    }

    // Sort dispatch queue based on depth
    dispatchQueue.sort(function(a, b) {
      // Count slashes
      if(a == "/") return 1;
      if(b == "/") return -1;
      return (a.split("/").length > b.split("/").length)? -1: 1;
    })
    SpahQL.log("Path modified on data store, formulated the following dispatch strategy: ["+dispatchQueue.join(" -> ")+"]. Data store: ", data);

    // Now run the dispatch queue
    // For each path with modifications in the dispatch queue, locate all modified
    // subpaths in the modification list.

    for(var i=0; i<dispatchQueue.length; i++) {
      var dispatchPath = dispatchQueue[i];
      var pathCallbacks = this.callbacks[dispatchPath];

      SpahQL.log("Triggering registered path callbacks for "+dispatchPath+": "+((!pathCallbacks)? "No callbacks to trigger" : pathCallbacks.length+" callbacks to trigger"));

      if(pathCallbacks) {
        for(var j=0; j<pathCallbacks.length; j++) {
          if(pathCallbacks[j][0] == data) {
            // Find subpaths
            var modifiedSubPaths = [];
            for(var k=0; k<dispatchQueue.length; k++) {
              if(dispatchQueue[k] != dispatchPath && (dispatchQueue[k]).indexOf(dispatchPath) == 0) {
                modifiedSubPaths.push(
                  dispatchQueue[k].substring(dispatchPath.length)
                );
              }
            }
            // Trigger callback
            (pathCallbacks[j][1])(SpahQL.select(dispatchPath, data), dispatchPath, modifiedSubPaths);
          }
        }
      }
    }
  },

  "addCallbackForPathModifiedOnObject": function(path, object, callback) {
    this.callbacks[path] = this.callbacks[path] || [];
    this.callbacks[path].push([object, callback]);
  },

  "removeCallbackForPathModifiedOnObject": function(path, object, callback) {
    var pathCallbacks = this.callbacks[path];
    if(pathCallbacks) {
      for(var i=pathCallbacks.length-1; i>=0; i--) {
        if(pathCallbacks[i][0] == object && pathCallbacks[i][1] == callback) {
          pathCallbacks.splice(i,1);
          break;
        }
      }
    }
  }

});

/**
 * class SpahQL.Errors
 *
 * A containing namespace for all exceptions generated within the SpahQL library.
 **/
SpahQL.Errors = {};

/**
 * class SpahQL.Errors.SpahQLError
 *
 * Defines an abstract exception class for all errors generated within the SpahQL library.
 **/
SpahQL.Errors.SpahQLError = function(message) { this.name = "SpahQLError"; this.message = (message || ""); };
SpahQL.Errors.SpahQLError.prototype = Error.prototype;

/**
 * class SpahQL.Errors.SpahQLRunTimeError < SpahQL.Errors.SpahQLError
 *
 * An error class used for runtime query evaluation errors, usually generated in the QueryRunner class.
 **/
SpahQL.Errors.SpahQLRunTimeError = function(message) { this.name = "SpahQLRunTimeError"; this.message = (message || ""); };
SpahQL.Errors.SpahQLRunTimeError.prototype = SpahQL.Errors.SpahQLError.prototype;

/**
 * class SpahQL.Query
 *
 * A <code>Query</code> instance is the result of running a string state query such as "/foo/bar/baz == 1" through the <code>SpahQL.QueryParser</code>.
 * Queries are parsed only once, upon registration. The QueryParser maintains a cache of pre-existing parsed queries keyed by the original query string.
 **/

SpahQL_classCreate("SpahQL.Query", {
  // Singletons
  // ---------------------
},{

  // Instance
  // ----------------------

   /**
    * SpahQL.Query#rawString -> String original representation
    *
    * The string from which this query was originally parsed.
    **/

   /**
    * SpahQL.Query#primaryToken -> Primary token (set literal or selection query)
    *
    * The first (non-optional) token in the query.
    **/

   /**
     * SpahQL.Query#comparisonOperator -> String comparison operator
     *
     * The optional comparison operator. If this is set, the query is an assertion query and there must
     * be a secondary token defined.
     **/

   /**
     * SpahQL.Query#secondaryToken -> Secondary token (set literal or selection query)
     *
     * The second (optional) token in the query. Cannot be defined without a comparison operator.
     **/

   /**
    * SpahQL.Query#assertion -> Boolean assertion flag
    *
    * Set to <code>true</code> if the query is an assertion query.
    **/

   "init": function(primaryToken, comparisonOperator, secondaryToken, assertion, rawString) {
      this.primaryToken = primaryToken || null;
      this.comparisonOperator = comparisonOperator || null;
      this.secondaryToken = secondaryToken || null;
      this.assertion = assertion || false,
      this.rawString = rawString || null;
   }

 });

/**
 * class SpahQL.QueryParser
 *
 * Parses string queries from data-\*-if attributes and client-side responders and produces parsed <code>SpahQL.Query</code> instances.
 * Maintains a cache of previously-parsed queries for speed.
 **/

SpahQL_classCreate("SpahQL.QueryParser", {

   // Singletons
   // ---------------------------------

   /**
    * SpahQL.QueryParser.queryCache -> Object cached queries
    * Holds a cache of previously-parsed queries indexed by string representation.
    **/
   "queryCache": {},

   /**
    * SpahQL.QueryParser.parseQuery(str) -> SpahQL.Query instance
    * - str (String): The string query e.g. "/foo/bar == 3"
    *
    * Parses a string query and returns a parsed <code>SpahQL.Query</code> instance.
    *
    * Uses control characters such as set openers, comparison operators and path delimiters to throw the
    * tokenizer into a variety of states. The actual parsing of each token is handed by a set of functions
    * with naming convention readAhead, e.g. <code>readAheadStringLiteral</code>. These methods are
    * responsible for identifying the token, reading ahead to parse it, and returning the found object
    * to the tokenizer along with an updated index at which the tokenizer may resume parsing.
    **/
   "parseQuery": function(str) {
      // Return cached query if found
      var query = this.cleanQuery(str);
      if(this.queryCache[query]) return this.queryCache[query];
      // Create query instance
      var parsedQuery = new SpahQL.Query();
          parsedQuery.rawString = str;

      // Pull tokens from the query. Expecting (TOKEN_SELECTOR_QUERY|TOKEN_SET_LITERAL)[,TOKEN_COMPARISON_OPERATOR,(TOKEN_SELECTOR_QUERY|TOKEN_SET_LITERAL)]
      var readAheadResult;
      var i = 0;
      while(readAheadResult = SpahQL.Token.parseAt(i, query)) {
        var windAhead = readAheadResult[0];
        var token = readAheadResult[1];

        if(token instanceof SpahQL.Token.ComparisonOperator) {
          if(parsedQuery.comparisonOperator) {
            this.throwParseAt(i, query, "Found unexpected TOKEN_COMPARISON_OPERATOR, expected EOL");
          }
          else if(!parsedQuery.primaryToken || (parsedQuery.primaryToken && parsedQuery.secondaryToken)) {
            this.throwParseAt(i, query, "Found unexpected TOKEN_COMPARISON_OPERATOR, expected evaluatable token type");
          }
          else {
            parsedQuery.comparisonOperator = token;
            parsedQuery.assertion = true;
          }
        }
        else {
          // Cast to set
          if(typeof(token.toSet) == "function") {
            token = token.toSet();
          }

          if(parsedQuery.primaryToken) {
            if(parsedQuery.comparisonOperator) {
              if(parsedQuery.secondaryToken) {
                this.throwParseErrorAt(i, query, "Unexpected token, expected EOL");
              }
              else {
                parsedQuery.secondaryToken = token;
              }
            }
            else {
              console.log("!!!", parsedQuery);
              this.throwParseErrorAt(i, query, "Unexpected token, expected EOL or TOKEN_COMPARISON_OPERATOR");
            }
          }
          else {
            parsedQuery.primaryToken = token;
          }

        }

        i = windAhead;
      }

     // Stash and return
     this.queryCache[query] = parsedQuery;
     SpahQL.log("Generated and cached query '"+str+"' ->", parsedQuery);
     return parsedQuery;
   },

   /**
    * SpahQL.QueryParser.cleanQuery(str) -> String
    *
    * Cleans spaces from a query, except spaces within string literals. Returns the cleaned query.
    **/
   "cleanQuery": function(str) {
      var quoteStack = [];
      var output = "";

      for(var i=0; i<str.length; i++) {
        var c = str.charAt(i);

        // Quote?
        if((c == '"' || c== "'") && (i==0 || str.charAt(i-1) != '\\')) {
          // Found non-escaped quote, either deepen stack or pop stack
          if(quoteStack[quoteStack.length-1] == c) quoteStack.pop();
          else quoteStack.push(c);
          // Also push character
          output += c;
        }
        else if(c == " ") {
          // Found space, append to output only if quote stack populated
          if(quoteStack.length > 0) output += c;
        }
        else {
          // Found other char, append
          output += c;
        }
      }

     return output; // Strip spaces from query
   },

   /**
    * SpahQL.QueryParser.throwParseErrorAt(i, query, message) -> void
    *
    * Throws an exception at the given index in the given query string with the given error message.
    **/
   "throwParseErrorAt": function(i, query, message) {
     throw new Error("Parse error: '"+(message||"failure")+"' at index "+i+" in query '"+query+"'.");
   }


 });

/**
 * class SpahQL.QueryRunner
 *
 * Class responsible for executing parsed <code>SpahQL.Query</code> queries and returning sets
 * of <code>SpahQL</code> instances.
 *
 * Unless you're spelunking or fixing bugs, the only methods you care about are _select_ and _assert_.
 **/
SpahQL_classCreate("SpahQL.QueryRunner", {

  // Singletons
  // ------------------------

  /**
   * SpahQL.QueryRunner.select(query, rootData[,scopeData][, scopePath]) -> Array
   * - rootData (Object): The root data context against which to run the query
   * - scopeData (Object): An optional additional data context which will be the local scope for this query. If not set, will be set internally to <code>rootData</code>.
   * - scopePath (String): An optional path indicating the scope to which this query has been restricted.
   *
   * Executes a selection query against the given dataset. Returns an array of result instances.
   **/
  "select": function(query, rootData, scopeData, scopePath) {
    if(query.assertion) throw new SpahQL.Errors.SpahQLRunTimeError("Attempted to select from an assertion query.");
    // Now move on
    scopeData = scopeData || rootData;
    return query.primaryToken.evaluate(rootData, scopeData, scopePath);
  },

  /**
   * SpahQL.QueryRunner.assert(query, rootData[, scopeData][, scopePath]) -> Boolean result
   * - query (SpahQL.Query): A parsed query instance
   * - rootData (Object): The root data context against which to run the query
   * - scopeData (Object): An optional additional data context which will be the local scope for this query. If not set, will be set internally to <code>rootData</code>.
   * - scopePath (String): An optional path indicating the scope to which this query has been restricted.
   *
   * Executes and ssserts the truthiness of a selection or assertion query against the given dataset.
   * Returns a boolean indicating the overall result of the query - if the query is not an assertion
   * query, it will return true if the query returns one or more results.
   **/
  "assert": function(query, rootData, scopeData, scopePath) {
    scopeData = scopeData || rootData;
    return this.evalAssertion(query.primaryToken, query.secondaryToken, query.comparisonOperator, rootData, scopeData, scopePath);
  },

  /**
   * SpahQL.QueryRunner.evalAssertion(primaryToken, secondaryToken, comparisonOperator, rootData, scopeData, scopePath) -> Boolean result
   * - primaryToken (Object): A selection query or set literal token as delivered by the query parser.
   * - secondaryToken (Object): A selection query or set literal token as delivered by the query parser. May be null.
   * - comparisonOperator (String): The comparison operator that will be used to compare the primary and secondary result sets.
   * - rootData (Object): A root data context for any selection queries that appear in the literal
   * - scopeData (Object): A scoped data context for the scope at which selection queries in the set will be evaluated.
   * - scopePath (String): An optional path indicating the scope to which this query has been restricted.
   *
   * Executes an assertion query. If the secondary token is null, then the primary token will be evaluated and the assertion
   * will be successful (returning true) if the primary resultset contains one or more "truthy" values (i.e. if it is not simply
   * full of nulls and/or false values). If the secondary token is provided, then the two tokens will be evaluated and their
   * result sets compared using the provided operator.
   **/
  evalAssertion: function(primaryToken, secondaryToken, comparisonOperator, rootData, scopeData, scopePath) {
    // Evaluate the tokens
    var primarySet = primaryToken.evaluate(rootData, scopeData, scopePath);
    var primaryValues = [];
    for(var p in primarySet) {
      primaryValues.push(primarySet[p].value);
    }

    var secondarySet, secondaryValues;
    if(secondaryToken) {
      secondarySet = secondaryToken.evaluate(rootData, scopeData, scopePath);
      secondaryValues = [];
      for(var s in secondarySet) {
        secondaryValues.push(secondarySet[s].value);
      }
    }
    else {
      // No secondary token - just assert based on the primary set
      return SpahQL.DataHelper.truthySet(primaryValues);
    }

    var comparisonEval = comparisonOperator.evaluate(rootData, scopeData);
    var comparisonType = comparisonEval[0].value;

    // Now run the comparisons
    switch(comparisonType) {
      case SpahQL.Token.ComparisonOperator.COMPARISON_STRICT_EQUALITY:
        return SpahQL.DataHelper.eqSetStrict(primaryValues, secondaryValues);
      case SpahQL.Token.ComparisonOperator.COMPARISON_INEQUALITY:
        return !(SpahQL.DataHelper.eqSetStrict(primaryValues, secondaryValues));
        break;
      case SpahQL.Token.ComparisonOperator.COMPARISON_ROUGH_EQUALITY:
        return SpahQL.DataHelper.eqSetRough(primaryValues, secondaryValues);
        break;
      case SpahQL.Token.ComparisonOperator.COMPARISON_LT:
        return SpahQL.DataHelper.ltSet(primaryValues, secondaryValues);
        break;
      case SpahQL.Token.ComparisonOperator.COMPARISON_GT:
        return SpahQL.DataHelper.gtSet(primaryValues, secondaryValues);
        break;
      case SpahQL.Token.ComparisonOperator.COMPARISON_LTE:
        return SpahQL.DataHelper.lteSet(primaryValues, secondaryValues);
        break;
      case SpahQL.Token.ComparisonOperator.COMPARISON_GTE:
        return SpahQL.DataHelper.gteSet(primaryValues, secondaryValues);
        break;
      case SpahQL.Token.ComparisonOperator.COMPARISON_JOINT_SET:
        return SpahQL.DataHelper.jointSet(primaryValues, secondaryValues);
        break;
      case SpahQL.Token.ComparisonOperator.COMPARISON_DISJOINT_SET:
        return !(SpahQL.DataHelper.jointSet(primaryValues, secondaryValues));
        break;
      case SpahQL.Token.ComparisonOperator.COMPARISON_SUPERSET:
        return SpahQL.DataHelper.superSet(primaryValues, secondaryValues);
        break;
      case SpahQL.Token.ComparisonOperator.COMPARISON_SUBSET:
        return SpahQL.DataHelper.superSet(secondaryValues, primaryValues);
        break;
    }
  }

});

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

/**
 * class SpahQL.Strategiser
 *
 * A generic handler class for managing SpahQL Strategies and applying them to SpahQL objects.
 *
 * The Strategiser allows the creation and registration of SpahQL Strategies, which are macros
 * which may be applied to SpahQL objects such as the Spah State.
 *
 * Strategies are categorised, allowing specific sets of strategies to be executed at any time.
 **/
 SpahQL_classCreate("SpahQL.Strategiser", {

 }, {

 		/**
 		 * new SpahQL.Strategiser
 		 *
 		 * Create a new, empty Strategiser instance, ready to receive a new set of strategies for
 		 * application to SpahQL objects.
  		 **/
 		"init": function() {
 			this.strategies = [];
 			this.categories = {};
 		},

    "count": function(category) {
      return this.getStrategies(category).length;
    },

 		/**
 		 * SpahQL#addStrategy(strategy[, category][, action]) -> Object
 		 * - strategy (Object): A hash describing the strategy
 		 * - category (String): An optional category for this strategy, allowing all similarly-categorised strategies to be run with a single call.
 		 * - action (Function): An optional function to be used as the strategy's action if you don't like specifying functions in hashes.
 		 *
 		 * Adds a strategy to this strategiser instance. Strategies are macros which may be categorised, and specific categories
 		 * of strategy run in sequence against any given _target_. The target is always a SpahQL instance, although it need not
 		 * be the root query result.
 		 *
 		 * Strategies are hashes containing the following keys:
 		 * * _path_ or _paths_: A path or array of paths used to select those parts of the target to which the strategy will be applied.
 		 *   specifying an array of N paths makes the strategy equivalent to N individual strategies which share all other strategy options.
 		 * * _if_ or _unless_: A SpahQL assertion which must be met by the target in order for the strategy to run.
 		 * * _action_: A function specifying the strategy's behaviour. Let's look at an example:
 		 *
 		 * 		strategiser.addStrategy({
 		 * 			"path": "/mentions",
 		 * 			"if": "/mentions/.length > 0",
 		 * 			"action": function(results, target, attachments, strategy) {
	   * 				// Do something to modify the results and then call...
	   * 				strategy.done();
 		 *			}
 		 * 		}, "myEvent");
 		 *
 		 * The _action_ receives the arguments _results_ (the SpahQL result set matching by the _path_), _target_ (the SpahQL set
 		 * to which the strategy is being applied), _attachments_ (An arbitrary object fed in by the caller executing the
 		 * strategy) and _strategy_, an object containing flow control functions used to signal a strategy's completion.
 		 *
 		 * This method returns the strategy object in a common format with the convenience syntax massaged down to something
 		 * the strategiser's internals can understand. Keep a reference to this handy if you wish to use #removeStrategy later.
 		 **/
 		"addStrategy": function(strategy, category, action) {
 			var strat = this.commoniseStrategy(strategy, category, action);
 			this.strategies.push(strat);
			this.categories[strat.category] = this.categories[strat.category] || [];
			this.categories[strat.category].push(strat);
 			return strat;
 		},

 		/**
 		 * SpahQL.Strategiser#removeStrategy(commonStrategy) -> Boolean
 		 * - commonStrategy (Object): A commonised strategy object as returned by #commoniseStrategy or #addStrategy
 		 *
 		 * Removes a strategy from this strategiser completely.
 		 **/
 		"removeStrategy": function(commonStrategy) {
 			var i = this.strategies.indexOf(commonStrategy);
 			if(i >= 0) {
 				this.strategies.splice(i, 1);

 				var cat = this.categories[commonStrategy.category];
 				if(cat) {
 					var cI = cat.indexOf(commonStrategy);
 					if(cI >= 0) cat.splice(cI, 1);
 				}
 				return true;
 			}
 			return false;
 		},


 		/**
 		 * SpahQL.Strategiser#commoniseStrategy(strategy) -> Object
 		 * strategy (Object): A strategy object, allowed to use convenience keys such as "if" or "unless"
 		 *
 		 * Accepts a strategy object with convenience keys and converts it to the standardised
 		 * schema expected by strategy objects internally.
 		 **/
 		"commoniseStrategy": function(strategy, category, callback) {
 			if(strategy._commonised) return strategy;

 			if(typeof(category) == "function") {
 				callback = category;
 				category = null;
 			}

      var paths = strategy.paths || strategy.path;
      if(typeof(paths) == "string") paths = [paths];

      var expectation = (strategy["if"])? true : false;
      var condition = (expectation ? strategy["if"] : strategy["unless"]) || null;
      var action = strategy.action || callback;
      var category = category || strategy.category || "*";

      var commonStrategy = {
        "paths": paths,
        "expectation": expectation,
        "condition": condition,
        "action": action,
        "category": category,
        "_commonised": true
      };

      return commonStrategy;
 		},

 		/**
 		 * SpahQL.Strategiser#getStrategies([categories]) -> Array
 		 * - categories (Array, String): A category or array of categories
 		 *
 		 * Retrieves an ordered set of strategies for the given categores. Uncategorised strategies are always included.
 		 * With no arguments, returns all strategies. With an argument "*", returns all uncategorised strategies.
 		 * With a named category argument, returns all strategies of the named category and all uncategorised strategies.
 		 **/
 		"getStrategies": function(categoryList) {
 			if(!categoryList) return this.strategies;
 			var categories = (typeof(categoryList)=="string")? [categoryList] : categoryList;
 			var strats = [];

 			for(var i in this.strategies) {
 				var strategy = this.strategies[i];
 				var category = strategy.category;
 				if(category == "*" || categories.indexOf(category) >= 0) strats.push(strategy);
 			}

 			return strats;
 		},

 		/**
 		 * SpahQL.Strategiser#run(target, categoryList, attachments, callback) -> void
 		 * - target (SpahQL): The SpahQL object upon which you want to execute a strategy set.
 		 * - categoryList (String, Array): One or more categories used to filter the strategies you wish to execute
 		 * - attachments (*): An object made available to strategy actions at runtime
 		 * - callback (Function): A function to call when the strategy loop has completed. Takes arguments (target, attachments).
 		 **/
 		"run": function(target, categoryList, attachments, callback) {
 				var strategies = this.getStrategies(categoryList);
 				this.locked = true;
 				this.runStrategyLoop(0, strategies, target, attachments, callback);
 		},

 		"runStrategyLoop": function(strategyIndex, strategies, target, attachments, exitCallback) {
 				// Check for exit condition
 				if(strategyIndex >= strategies.length) return this.completed(target, attachments, exitCallback);
 				var strategy = strategies[strategyIndex];

 				// Prepare the flow control
 				var scope = this;
 				function exitToStrategyLoop() {
 						return scope.runStrategyLoop(strategyIndex+1, strategies, target, attachments, exitCallback);
 				}

 				// Check the preconditions if any are present on this strategy
				if(strategy.condition && (target.assert(strategy.condition) != strategy.expectation)) return exitToStrategyLoop();

 				// Enter the game loop
 				this.runStrategyQueryLoop(0, strategy, target, attachments, exitToStrategyLoop);
 		},

 		"runStrategyQueryLoop": function(queryIndex, strategy, target, attachments, exitToStrategyLoop) {
 				var queries = strategy.paths;
 				// Check for exit condition
 				if(queryIndex >= queries.length) return exitToStrategyLoop();

 				// Prepare the flow control
 				var scope = this;
 				function exitToQueryLoop() {
 					return scope.runStrategyQueryLoop(queryIndex+1, strategy, target, attachments, exitToStrategyLoop);
 				}
 				var flowController = {
 					"done": exitToQueryLoop
 				};

 				var query = strategy.paths[queryIndex];
 				var results = target.select(query);
 				var action = strategy.action;
 				if(results.length > 0) {
 					// Execute action for this query
 					return action(results, target, attachments, flowController);
 				}
 				else {
 					// No results for this query, move to next
 					return exitToQueryLoop();
 				}
 		},

 		"completed": function(target, attachments, callback) {
 			callback(target, attachments);
 		}

 });

/**
 * class SpahQL.Token
 *
 * A containing module for all token types - queries, filters, comparison operators, sets, literals etc.
 * that are encountered during the parsing process.
 **/

// Define and export
SpahQL_classCreate("SpahQL.Token", {

  /**
   * SpahQL.Token.parseAt(i, query) -> Array result
   *
   * Attempts to locate a token of any valid top-level type at the given index in the given string query.
   **/
  "parseAt": function(i, query) {
    return  SpahQL.Token.ComparisonOperator.parseAt(i, query) ||
            SpahQL.Token.String.parseAt(i, query) ||
            SpahQL.Token.Numeric.parseAt(i, query) ||
            SpahQL.Token.Boolean.parseAt(i, query) ||
            SpahQL.Token.Set.parseAt(i, query) ||
            SpahQL.Token.SelectionQuery.parseAt(i, query) ||
            null;
  },

  /**
   * SpahQL.Token.throwParseErrorAt(i, query, message) -> void
   *
   * Throws an exception at the given index in the given query string with the given error message.
   **/
  "throwParseErrorAt": function(i, query, message) {
    throw new Error("Parse error: '"+(message||"failure")+"' at index "+i+" in query '"+query+"'.");
  }

});

/**
 * class SpahQL.Token.Base
 *
 * A simple superclass for all tokens - queries, filters, comparison operators, sets, literals etc.
 * that are encountered during the parsing process
 **/

SpahQL_classCreate("SpahQL.Token.Base", {

  // Singleton
  // ---------------------

  /**
   * SpahQL.Token.Base.parseAt(index, queryString) -> Array\[resumeIndex, foundToken\] or null
   * Should be overridden by the child class.
   **/
  "parseAt": function() {
    throw "I should have been overridden. Something is disastrously wrong.";
  }

}, {

  // Instances
  // ----------------------

  "init": function() {

  },

  "throwRuntimeError": function(token, message) {
    throw new Error("Parse error: '"+(message||"failure to execute")+"' in token "+token+".");
  }

});

/**
 * class SpahQL.Token.Simple < SpahQL.Token.Base
 *
 * A simple superclass for all simple tokens that carry a single value or subtoken.
 **/

SpahQL_classExtend("SpahQL.Token.Simple", SpahQL.Token.Base, {

  // Singleton
  // ----------------------

}, {

  // Instance
  // ----------------------

  /**
   * new SpahQL.Token.Simple(value)
   *
   * Instantiate a new simple token with the given primitive value.
   **/
  "init": function(value) {
    this.value = (typeof(value)!='undefined')? value : null;
  },

  /**
   * SpahQL.Token#toSet() -> SpahQL.Token.Set
   *
   * Wraps this token up in a set, allowing it to be used as a top-level evaluatable token.
   **/
  "toSet": function() {
    return new SpahQL.Token.Set([this]);
  },

  /**
   * SpahQL.Token.Simple#evaluate(queryToken, rootData[, scopeData]) -> Array of result objects
   * - rootData (Object): A root data context for any selection queries that appear in the literal
   * - scopeData (Object): A scoped data context for the scope at which selection queries in the set will be evaluated.
   *
   * Evaluates a set literal, for use when a set is used in a selection query and must be returned as a set of results.
   * If the set is a range, it will be flattened into a set of values.
   **/
  evaluate: function(rootData, scopeData, scopePath) {
    return [SpahQL.result(null, this.value)];
  }

});

/**
 * class SpahQL.Token.String < SpahQL.Token.Simple
 *
 * A simple token wrapping a string literal value.
 **/

SpahQL_classExtend("SpahQL.Token.String", SpahQL.Token.Simple, {

  // Singleton
  // -----------------------

  // Atom configuration: strings
  ATOM_QUOTE_SINGLE: "'",
  ATOM_QUOTE_DOUBLE: '"',
  ATOM_ESCAPE: '\\',

  /**
   * SpahQL.Token.String.parseAt(i, query) -> Array\[resumeIndex, foundToken\] or null
   *
   * Identifies a string literal at the given index in the given string query and returns null
   * if no token is identified, or a tuple of terminating index and the instantiated token if successful.
   **/
  "parseAt": function(i, query) {
    var ch = query.charAt(i);
    if(ch == this.ATOM_QUOTE_SINGLE || ch == this.ATOM_QUOTE_DOUBLE) {
      var j = 0;
      var quoteType = ch;
      var str = "";
      while(true) {
        j++;
        if(query.length < i+j) {
          this.throwParseErrorAt(i, query, "Encountered EOL when expecting "+((quoteType==this.ATOM_QUOTE_SINGLE)? "ATOM_QUOTE_SINGLE":"ATOM_QUOTE_DOUBLE"));
        }
        else if(query.charAt(i+j) == quoteType) {
          j++; break;
        }
        else if(query.charAt(i+j) == this.ATOM_ESCAPE) {
          // Found escape, append next char
          str+=query.charAt(i+j+1);
          j++;
        }
        else {
          str += query.charAt(i+j);
        }
      }
      return [i+j, new this(str)];
    }
    else {
      return null;
    }
  }

}, {

  // Instance
  // -----------------------

})


/**
 * class SpahQL.Token.Numeric < SpahQL.Token.Simple
 *
 * A simple token wrapping an integer or floating-point numeric literal value.
 **/

SpahQL_classExtend("SpahQL.Token.Numeric", SpahQL.Token.Simple, {

    // Singleton
    // -------------------------

    // Atom configuration: numerics
    ATOM_NUMERIC_POINT: ".",
    ATOM_NUMERIC_NEGATIVE: "-",

    /**
     * SpahQL.Token.Numeric.parseAt(i, query) -> Array\[resumeIndex, foundToken\] or null
     *
     * Identifies a numeric literal at the given index in the given string query and returns null
     * if no token is identified, or a tuple of terminating index and the instantiated token if successful.
     **/
    "parseAt": function(i, query) {
       var ch = query.charAt(i);
       var numReg = /\d/;
       if(ch.match(numReg) || (ch==this.ATOM_NUMERIC_NEGATIVE && query.charAt(i+1).match(numReg))) {
         var num = ch;
         var pointFound;
         var j = 0;
         while(true) {
            j++;
            if(query.length < i+j) {
              break; // EOL
            }
            else if(query.charAt(i+j) == this.ATOM_NUMERIC_POINT) {
              if(pointFound) {
                // rewind and surrender
                j--;
                break;
              }
              else {
                pointFound = true;
                num += query.charAt(i+j);
              }
            }
            else if(query.charAt(i+j).match(numReg)) {
              // Found another numeric char
              num += query.charAt(i+j);
            }
            else {
              break;
            }
         }
         return [i+j, new this(pointFound ? parseFloat(num) : parseInt(num, 10))];
       }
       else {
         return null;
       }
    }

});

/**
 * class SpahQL.Token.Boolean < SpahQL.Token.Simple
 *
 * A simple token wrapping a boolean true or false.
 **/

SpahQL_classExtend("SpahQL.Token.Boolean", SpahQL.Token.Simple, {

  // Atom configuration: bools
  ATOM_BOOLEAN_TRUE: "true",
  ATOM_BOOLEAN_FALSE: "false",

  /**
   * SpahQL.Token.Boolean.parseAt(i, query) -> Array\[resumeIndex, foundToken\] or null
   *
   * Identifies a boolean true or false at the given index in the given string query and returns null
   * if no token is identified, or a tuple of terminating index and the instantiated token if successful.
   **/
  "parseAt": function(i, query) {
    if(query.substr(i,this.ATOM_BOOLEAN_TRUE.length) == this.ATOM_BOOLEAN_TRUE) return [i+this.ATOM_BOOLEAN_TRUE.length, new this(true)];
    else if(query.substr(i,this.ATOM_BOOLEAN_FALSE.length) == this.ATOM_BOOLEAN_FALSE) return [i+this.ATOM_BOOLEAN_FALSE.length, new this(false)];
    else return null;
  }

})


/**
 * class SpahQL.Token.Set < SpahQL.Token.Base
 *
 * A wrappping class for any set literal, containing one or more values.
 * May qualify as a range if the range operator is used during parsing.
 **/

SpahQL_classExtend("SpahQL.Token.Set", SpahQL.Token.Base, {

  // Singleton
  // -------------------

  // Atom configuration: sets
  ATOM_SET_START: "{",
  ATOM_SET_END: "}",
  ATOM_SET_ARRAY_DELIMITER: ",",
  ATOM_SET_RANGE_DELIMITER: "..",

  /**
   * SpahQL.Token.Set.parseAt(index, queryString) -> Array result or null
   *
   * Reads the given queryString starting at the given index and attempts to identify and parse
   * a set literal token. If found, the token will be returned in a tuple \[resumeIndex, foundToken\].
   * Returns null if nothing is found.
   **/
  "parseAt": function(i, query) {
    if(query.charAt(i) == this.ATOM_SET_START) {
      var j=i+1;
      var tokens=[];
      var usedArrayDelimiter = false
      var usedRangeDelimiter = false;
      var readResult;

      if(query.charAt(j) == this.ATOM_SET_END) {
        return [j+1, new this()]; // Empty set
      }

      while(readResult = SpahQL.Token.parseAt(j, query)) {
        var token = readResult[1];
        var allowedTokens = [SpahQL.Token.Numeric, SpahQL.Token.String, SpahQL.Token.Boolean, SpahQL.Token.SelectionQuery];
        var tokenIsAllowed = false;
        for(var i in allowedTokens) {
          var klass = allowedTokens[i];
          if(token instanceof klass) {
            tokenIsAllowed = true;
            break;
          }
        }

        if(tokenIsAllowed) {
          // wind ahead
          j = readResult[0];
          // push token into set
          tokens.push(token);
          // find delimiter
          if(query.charAt(j) == this.ATOM_SET_ARRAY_DELIMITER) {
            if(usedRangeDelimiter) {
              this.throwParseErrorAt(j, query, "Found unexpected ATOM_SET_ARRAY_DELIMITER in set literal that already used the range delimiter.");
            }
            usedArrayDelimiter = true; j++;
          }
          else if(query.substr(j, this.ATOM_SET_RANGE_DELIMITER.length) == this.ATOM_SET_RANGE_DELIMITER) {
            if(usedArrayDelimiter) {
              this.throwParseErrorAt(j, query, "Found unexpected ATOM_SET_RANGE_DELIMITER in set literal that already used the array delimiter.");
            }
            usedRangeDelimiter = true; j+=this.ATOM_SET_RANGE_DELIMITER.length;
          }
          else if(query.charAt(j) == this.ATOM_SET_END) {
            j++; break;
          }
          else {
            this.throwParseErrorAt(j, query, "Found unexpected character '"+query.charAt(j)+"' in set literal, expecting one of ATOM_SET_ARRAY_DELIMITER, ATOM_SET_RANGE_DELIMITER, ATOM_SET_END.");
          }
        }
        else {
          this.throwParseErrorAt(j, query,  "Found unexpected token in set literal. Set literals may only contain string, numeric, boolean and selection query values.");
        }
      }
      return [j, new this(tokens, usedRangeDelimiter)];
    }
    return null;
  }

}, {

  // Instance
  // -------------------

  /**
   * SpahQL.Token.Set#tokens -> Array Token
   *
   * Contains all tokens included in this set, in the order in which they were encountered.
   **/

  /**
   * SpahQL.Token.Set#isRange -> Boolean
   *
   * A flag indicating whether or not this token is to be evaluated as a range.
   **/

  /**
   * new SpahQL.Token.Set(value)
   *
   * Instantiate a new set token with the given list of tokens.
   **/
  "init": function(tokens, isRange) {
    this.tokens = tokens || [];
    this.isRange = isRange || false;
  },

  /**
   * SpahQL.Token.Set#evaluate(rootData[, scopeData][, scopePath]) -> Array
   * - rootData (Object): A root data context for any selection queries that appear in the literal
   * - scopeData (Object): A scoped data context for the scope at which selection queries in the set will be evaluated.
   * - scopePath (String): The string path at which the scopeData is located in the overall rootData construct.
   *
   * Evaluates a set literal, for use when a set is used in a selection query and must be returned as a set of results.
   * If the set is a range, it will be flattened into a set of values.
   **/
  evaluate: function(rootData, scopeData, scopePath) {
    var results = [];
    if(this.isRange) {

      // Break if tokens look suspicious
      if(this.tokens.length != 2) {
        this.throwRuntimeError(this, "Tried to evaluate range with "+this.tokens.length+" tokens, expected 2 tokens. Tokens: "+this.tokens.join(", "));
      }

      var startResults = this.tokens[0].evaluate(rootData, scopeData, scopePath);
      var endResults = this.tokens[1].evaluate(rootData, scopeData, scopePath);

      // Break if evaluation of either token returns no results
      if(startResults.length == 0 || endResults.length == 0) return results;

      var start = startResults[0].value;
      var end = endResults[0].value;
      var sType = SpahQL.DataHelper.objectType(start);
      var eType = SpahQL.DataHelper.objectType(end);
      if(sType == eType) {
        if(sType == "number") results = results.concat(this.evalNumericRange(start, end));
        else if(sType == "string") results = results.concat(this.evalStringRange(start, end));
        else new SpahQL.Errors.SpahQLRunTimeError("Unsupported type used in range. Ranges support only strings and numbers.");
      }
      else {
        throw new SpahQL.Errors.SpahQLRunTimeError("Illegal range with start type '"+sType+"' and end type '"+eType+"'. Ranges must use the same type at each end.");
      }
    }
    else {
      // Loop - evaluate queries
      for(var i in this.tokens) {
        var token = this.tokens[i];
        results = results.concat(token.evaluate(rootData, scopeData, scopePath));
      }
    }
    return results;
  },

  /**
   * SpahQL.Token.Set#evalNumericRange(start, end) -> Array
   * - start (Number): The number at the start of the range (10 is the start value for {10..8})
   * - end (Number): The number at the start of the range (8 is the end value for {10..8})
   *
   * Works with a ruby-style evaluation. Reverse ranges evaluate as empty. Symmetrical ranges e.g. 10..10 evaluate with
   * one result.
   *
   * Evaluates a numeric range literal, generating an array containing all values in the range.
   **/
  evalNumericRange: function(start, end) {
    var results = [];
    // Return empty set for reverse ranges
    if(end < start) {

      for(var r=start; r>=end; r--) results.push(SpahQL.result(null, r));
    }
    else {
      for(var i=start; i<=end; i++) results.push(SpahQL.result(null, i));
    }

    return results;
  },

  /**
   * SpahQL.Token.Set#evalStringRange(start, end) -> Array of QueryResults
   * - start (String): The character at the start of the range ("a" is the start value for {'a'..'c'})
   * - end (String): The character at the end of the range ("c" is the end value for {'a'..'c'})
   *
   * Evaluates a string range literal, generating an array of QueryResults containing all values in the range.
   * String range literals are evaluated as numeric ranges using a radix of 35, and transposing the generated numeric values
   * back into strings before returning them.
   *
   * Evaluates with a ruby-style behaviour, for instance:
   * "a".."c" -> a, b, c
   * "ab".."ad" -> ab, ac, ad
   * "a1".."b2" -> a1, a2...... a8, a9, b1, b2
   * "1b".."2b" -> 1b, 1c, 1d...... 1x, 1y, 1z, 2a, 2b
   *
   * So: Each digit is cycled based on a its type, and at the culmination of each digit's cycle the next highest-order
   * digit is iterated. The types of digit are number, lowercase char and uppercase char.
   *
   * If the digits cannot be cycled to a match, as in the example "1a".."b1" where the digits are of differing types, the
   * initial value is iterated to its peak and will terminate at that point. The generated range is equivalent in this case
   * to "1a".."9z".
   *
   * If the values appear to be reversed (e.g. "z".."a", "9a".."3a", "D1".."A1") then in ruby style the range will evaluate
   * as empty.
   *
   * We do this by defining three character code ranges for certain character types - integers(48-57), lower case characters (97-122)
   * and uppercase characters (65-90). If any two characters belong to the same range then they are mutually iterable.
   *
   * There is a special case for single-character ranges where if the initial value sits outside of these ranges, it is iterated
   * towards the destination value until it reaches the destination value or until it reaches the end of one of the predefined
   * ranges above. For instance, "}".."~" will iterate successfully, but "x".."}" despite being an increasing range in raw
   * character code terms will only evaluate to "x","y","z". In the case of a range like ")".."a" (character code 41 to 97) the iterator
   * will enter the numeric character range (48-57) and in doing so will terminate at char code 57, character "9".
   *
   * In ranges with multiple digits, characters outside the three defined ranges are locked and do not iterate.
   **/
  evalStringRange: function(start, end) {
    var results = [];

    // Figure out if this is a reversed or symmetrical range.
    // Another easy comparison: Symmetrical ranges have one entry
    if(start == end) return [SpahQL.result(null, start)];
    // Easy comparison: One string is shorter than the other or the range is reversed
    if((start > end)||(start.length!=end.length)) return results;

    // Columnar charcode indexes:
    // integer: 48..57 == "0".."9"
    // ucase: 65..90 == "A".."Z"
    // lcase: 97..122 == "a".."z"

    // We're going to treat this like a slot machine.
    // Create an array of "locks" which are locked columns in the range.
    var locks = [];
    var allLocked = true;
    for(var c=0; c<start.length; c++) {
      var code = start.charCodeAt(c);
      // If outside of range, lock
      locks[c] = ((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122))? false : true;
      allLocked = (locks[c]==true && allLocked==true);
      // If all others are locked and this is last column, unlock
      if(allLocked && c == start.length-1) locks[c] = false;
    }

    var nextWorkingCol = function(wC) {
      for(var w=wC-1; w>-2; w--) {
        if(locks[w] == false) return w;
      }
    }

    var gen = start+""; // clone start
    iterating: while(true) {
      // ^^^^
      // When the workingCol hits -1 we know we popped a carry on the highest-order digit and maxed the string
      // If nextString == end then we hit the range target and should break.
      // Push the last-iterated result
      results.push(SpahQL.result(null, gen));
      if(gen == end) break iterating;

      // Iterate until carrying stops, giving us our new stop value for the next increment
      var workingCol = nextWorkingCol(start.length),
          carry = true,
          next = "";

      carrying: while(true) {
        // Iterate start string and push new results. Break on maxing all unlocked columns or on reaching end token.
        // Iteration works on the lowest-order unlocked column and may generate a carry operation, which resets the current working
        // column to its lowest value and increments the next highest-order unlocked column. This in turn may generate a carry operation.
        // If the overall highest-order unlocked column generates a carry when incremented, then the string is maxed and the range
        // terminates.
        next = (function(str) {
            // Iterates a character and generates a new string and potentially a carry.
            var carry = false;
            var cCode = str.charCodeAt(0);
            var nCode;
            if(cCode == 57) {
              carry = true;
              nCode = 48;
            }
            else if(cCode == 90) {
              carry = true;
              nCode = 65;
            }
            else if(cCode == 122) {
              carry = true;
              nCode = 97;
            }
            else if(cCode == 127) {
              carry = true;
              nCode = cCode;
            }
            else {
              nCode = cCode+1;
            }
            return [String.fromCharCode(nCode), carry];
        })(gen.charAt(workingCol));

        gen = gen.split(""); gen.splice(workingCol,1,next[0]); gen = gen.join("");
        if(next[1]==true) {
          // Next next highest-order unlocked col
          workingCol = nextWorkingCol(workingCol);
          if(workingCol < 0) break iterating;
        }
        else {
          break carrying;
        }
      }
    }

    return results;
  }

});

/**
 * class SpahQL.Token.ComparisonOperator < SpahQL.Token.Simple
 *
 * A simple token wrapping a string literal value.
 **/

SpahQL_classExtend("SpahQL.Token.ComparisonOperator", SpahQL.Token.Simple, {

    COMPARISON_OPERATORS: ["==", "=~", ">", "<", ">=", "<=", "!=", "}~{", "}>{", "}<{", "}!{"],
    COMPARISON_STRICT_EQUALITY: "==",
    COMPARISON_ROUGH_EQUALITY: "=~",
    COMPARISON_INEQUALITY: "!=",
    COMPARISON_LT: "<",
    COMPARISON_GT: ">",
    COMPARISON_LTE: "<=",
    COMPARISON_GTE: ">=",
    COMPARISON_JOINT_SET: "}~{",
    COMPARISON_SUPERSET: "}>{",
    COMPARISON_SUBSET: "}<{",
    COMPARISON_DISJOINT_SET: "}!{",
    /**
     * SpahQL.Token.ComparisonOperator.parseAt(i, query) -> Array\[resumeIndex, foundToken\] or null
     *
     * Identifies a string literal at the given index in the given string query and returns null
     * if no token is identified, or a tuple of terminating index and the instantiated token if successful.
     **/
    "parseAt": function(i, query) {
      if(this.COMPARISON_OPERATORS.indexOf(query.substr(i,3)) >= 0)  return [i+3, new this(query.substr(i,3))];
      else if(this.COMPARISON_OPERATORS.indexOf(query.substr(i,2)) >= 0) return [i+2, new this(query.substr(i,2))];
      else if(this.COMPARISON_OPERATORS.indexOf(query.substr(i,1)) >= 0) return [i+1, new this(query.substr(i,1))];
      else return null;
    }

});

/**
 * class SpahQL.Token.FilterQuery < SpahQL.Token.Simple
 *
 * A token describing any path component within a selection query, comprised of one or two path delimiters
 * followed by a key or property name and an optional set of filter query tokens.
 **/

SpahQL_classExtend("SpahQL.Token.FilterQuery", SpahQL.Token.Simple, {

    // Singleton
    // -----------------------

    // Atom configuration: paths
    ATOM_FILTER_QUERY_START: "[",
    ATOM_FILTER_QUERY_END: "]",

    /**
     * SpahQL.Token.FilterQuery.parseAt(index, queryString) -> Array result or null
     *
     * Reads the given queryString starting at the given index and attempts to identify and parse
     * a filter query token. If found, the token will be returned in a tuple \[resumeIndex, foundToken\].
     * Returns null if nothing is found.
     **/
    "parseAt": function(i, query) {
      if(query.charAt(i) == this.ATOM_FILTER_QUERY_START) {
        var j=i+1;
        var scopeDepth=1;
        var queryToken="";
        var strReadAheadResult;
        while(scopeDepth>0) {
          var ch=query.charAt(j); var strReadResult;
          if(ch == this.ATOM_FILTER_QUERY_START) {
            scopeDepth++; queryToken += ch; j++;
          }
          else if(ch == this.ATOM_FILTER_QUERY_END) {
            scopeDepth--; j++;
            if(scopeDepth == 0) break;
            queryToken += ch;
          }
          else if(strReadAheadResult = SpahQL.Token.String.parseAt(j, query)) {
            queryToken += query.substring(j,strReadAheadResult[0]); j = strReadAheadResult[0];
          }
          else {
            queryToken += ch; j++;
          }
        }
        if(queryToken.length > 0) { // query token does not include final closing bracket
          return [j, new this(SpahQL.QueryParser.parseQuery(queryToken))];
        }
        else {
          this.throwParseErrorAt(j, query, "Found unexpected ATOM_FILTER_QUERY_END, expected TOKEN_SELECTION_QUERY or TOKEN_ASSERTION_QUERY. Looked like those brackets were empty - make sure they have a query in them.");
        }
      }
      return null;
    }

}, {

    // Instance

    /**
     * SpahQL.Token.FilterQuery#evaluate(rootData, scopeData, path) -> Boolean
     * - rootData (Object): The entire root-level data structure being queried
     * - scopeData (Object): The data for the scope at which this query is being executed.
     *
     * Evaluates this filter query as an assertion.
     **/
    "evaluate": function(rootData, scopeData) {
      return SpahQL.QueryRunner.assert(this.value, rootData, scopeData);
    }

});

/**
 * class SpahQL.Token.PathComponent < SpahQL.Token.Base
 *
 * A token describing any path component within a selection query, comprised of one or two path delimiters
 * followed by a key or property name and an optional set of filter query tokens.
 **/

SpahQL_classExtend("SpahQL.Token.PathComponent", SpahQL.Token.Base, {

    // Singleton
    // ---------------------------

    // Atom configuration: paths
    ATOM_PATH_DELIMITER: "/",
    ATOM_PROPERTY_IDENTIFIER: ".",
    ATOM_PATH_WILDCARD: "*",

    /**
     * SpahQL.Token.PathComponent.parseAt(index, queryString) -> Array result or null
     *
     * Reads the given queryString starting at the given index and attempts to identify and parse
     * a path component token. If found, the token will be returned in a tuple \[resumeIndex, foundToken\].
     * Returns null if nothing is found.
     **/
    "parseAt": function(i, query) {
      if(query.charAt(i) == this.ATOM_PATH_DELIMITER) {
        var j = i+1;
        var pc = new this();
        var usingProperty = false;

        // Grab second (recursive) slash
        if(query.charAt(j) == this.ATOM_PATH_DELIMITER) {
          pc.recursive = true;
          j++;
        }

        // Check for wildcard, which halts the key reader and moves on to filters
        if(query.charAt(j) == this.ATOM_PATH_WILDCARD) {
           // Expect filter or end
           pc.key = this.ATOM_PATH_WILDCARD;
           j++
        }
        else {
         // Get keyname / property name (until run out of alphanum/-/_)
         if(query.charAt(j) == this.ATOM_PROPERTY_IDENTIFIER) {
           usingProperty = true;
           j++
         }
         else if(query.charAt(j) == this.ATOM_PATH_DELIMITER) {
           this.throwParseErrorAt(j, query, "3 path delimiters found in a row. Maximum legal count is 2.");
         }

         // Read ahead for keyname, if not found then move on.
         var kReadResult = SpahQL.Token.KeyName.parseAt(j, query);
         if(!kReadResult && usingProperty) {
           this.throwParseError(j, query, "Found unexpected character '"+query.charAt(j)+"' when expecting TOKEN_PROPERTY")
         }
         else if(kReadResult) {
           if(usingProperty) pc.property = kReadResult[1];
           else pc.key = kReadResult[1];
           j = kReadResult[0];
         }
        }
        // End keyname/propertyname segment
        // Start filters
        var fReadResult;
        while(fReadResult = SpahQL.Token.FilterQuery.parseAt(j, query)) {
          pc.filterQueries.push(fReadResult[1]);
          j = fReadResult[0];
        }

        // When out of filters, exit
        return [j, pc]
      }

      return null;
    }

},{

    // Instance
    // ----------------------------------------

    // Constants for known symbols
    PROPERTY_TYPE: "type",
    PROPERTY_SIZE: "size",
    PROPERTY_EXPLODE: "explode",

    /**
     * SpahQL.Token.PathComponent#key -> String
     *
     * The key specified in this path component, if a keyname was used.
     **/

    /**
     * SpahQL.Token.PathComponent#property -> String
     *
     * The property specified in this path component, if a property name was used.
     **/

    /**
     * SpahQL.Token.PathComponent#recursive -> Boolean
     *
     * A flag indicating whether or not this path component should recurse through its
     * scope data during evaluation.
     **/

    /**
     * SpahQL.Token.PathComponent#filterQueries -> Array Token.FilterQuery
     *
     * Lists all filter queries associated with this path component, in the order in which they were
     * encountered during parsing.
     **/

    /**
     * new SpahQL.Token.PathComponent(key, property, recursive, filterQueries)
     *
     * Instantiate a path component token with blank-slate values
     **/
    "init": function(key, property, recursive, filterQueries) {
      this.key = key || null;
      this.property = property || null;
      this.recursive = recursive || false;
      this.filterQueries = filterQueries || [];
    },

    /**
     * SpahQL.Token.PathComponent#evaluate(rootData, scopeData, path) -> Array
     * - pathComponent (Object): A path component object as generated by the query parser
     * - rootData (Object): The entire root-level data structure being queried
     * - scopeData (Object): The data for the scope at which this query is being executed.
     * - path (String): The string path for the root of the scopeData argument.
     *
     * Evaluates this path pomponent and returns a set of query results.
     * Used primarily in Token.SelectionQuery#evaluate to map each path component to a set of results, allowing the query process to be
     * effectively forked or halted.
     **/
    "evaluate": function(rootData, scopeData, path) {
      var results;
      var scopePath = (!path || path == "/")? "" : path; // Root path is blanked for easy appending

      if(this.key == null && this.property == null) {
        // Root query,
        results = [SpahQL.result(path, scopeData, rootData)]; // Uses original path arg
      }
      else if(this.key != null) {
        // Key query - key might be wildcard.
        var keyName = this.key.value; // pull from token
        results = this.fetchResultsFromObjectByKey(keyName, rootData, scopeData, scopePath, this.recursive);
      }
      else if(this.property != null) {
        // Property query
        var propertyName = this.property.value;
        results = this.fetchResultsFromObjectByProperty(propertyName, rootData, scopeData, scopePath, this.recursive);
      }

      // Now filter results if there are filter queries
      if(results.length > 0 && this.filterQueries.length > 0) {
        var fI, rI;

        // Loop filter queries
        for(fI=0; fI<this.filterQueries.length; fI++) {
          var filterQueryToken = this.filterQueries[fI];
          var filteredResults = [];

          // Loop results and assert filters against the result's data
          for(rI = 0; rI < results.length; rI++) {
            var r = results[rI];
            var filterResult = filterQueryToken.evaluate(rootData, r.value);

            if(filterResult && filteredResults.indexOf(r) < 0) {
              filteredResults.push(r);
            }
          } // result loop
          // Set results to those allowed by this filter query
          results = filteredResults;
        } // filter query loop
      } // condition

      // Return remainder
      return results;
    },

    /**
     * SpahQL.Token.PathComponent#fetchResultsFromObjectByKey(key, object, path, recursive) -> Array
     * - key (String): The key to be retrieved from the object. Numeric keys in string formare acceptable when accessing arrays.]
     * - rootData (Object): The root data structure being queried.
     * - scopeData (Object): The data structure from which the key's associated value will be retrieved
     * - path (String): The path at which the item used as the 'object' argument is located
     * - recursive (Boolean): A flag indicating whether the key should also be pulled from any child objects of the given object. I N C E P T I O N.
     *
     * Retrieves the value(s) associated with a given key from the given object, if such a key exists.
     **/
    fetchResultsFromObjectByKey: function(key, rootData, scopeData, path, recursive) {
      var oType = SpahQL.DataHelper.objectType(scopeData);
      var results = [];

      if(oType == "array" || oType == "object") {
        // Loop and append
        for(var oKey in scopeData) {
          var oVal = scopeData[oKey];
          var oValType = SpahQL.DataHelper.objectType(oVal);
          var oPath = path+"/"+oKey;
          // Match at this level
          if(key == SpahQL.QueryParser.ATOM_PATH_WILDCARD || key.toString() == oKey.toString()) {
            results.push(SpahQL.result(oPath, oVal, rootData));
          }
          // Recurse! That is, if we should. Or not. It's cool.
          if(recursive && (oValType == "array" || oValType == "object")) {
            results = results.concat(this.fetchResultsFromObjectByKey(key, rootData, oVal, oPath, recursive));
          }
        }
      }

      return results;
    },

    /**
     * SpahQL.Token.PathComponent#fetchResultsFromObjectByProperty(key, object, path, recursive) -> Array
     * - key (String): The key to be retrieved from the object. Numeric keys in string formare acceptable when accessing arrays.
     * - rootData (Object): The root data structure being queried.
     * - scopeData (Object): The data structure from which the key's associated value will be retrieved
     * - path (String): The path at which the item used as the 'object' argument is located
     * - recursive (Boolean): A flag indicating whether the key should also be pulled from any child objects of the given object. I N C E P T I O N.
     *
     * Retrieves the specified Spah object property from the given object, if the object supports the specified property.
     **/
    fetchResultsFromObjectByProperty: function(property, rootData, scopeData, path, recursive) {
      var oType = SpahQL.DataHelper.objectType(scopeData);
      var pPath = path+"/."+property;
      var results = [];

      switch(property) {
        case this.PROPERTY_SIZE:
          switch(oType) {
            case "array": case "string":
              results.push(SpahQL.result(pPath, scopeData.length, rootData));
              break;
            case "object":
              results.push(SpahQL.result(pPath, SpahQL.DataHelper.hashKeys(scopeData).length, rootData));
              break;
          }
          break;
        case this.PROPERTY_TYPE:
          results.push(SpahQL.result(pPath, oType, rootData));
          break;
        case this.PROPERTY_EXPLODE:
          if(oType =="string") {
            for(var c=0; c<scopeData.length; c++) {
              results.push(SpahQL.result(path+"/"+c, scopeData.charAt(c), rootData));
            }
          }
          break;
        default:
          throw new SpahQL.Errors.SpahQLRunTimeError("Unrecognised property token '"+property+"'.");
          break;
      }

      // recurse if needed
      if(recursive && (oType == "array" || oType == "object")) {
        for(var k in scopeData) {
          var kPath = path+"/"+k;
          var kVal = scopeData[k];
          results = results.concat(this.fetchResultsFromObjectByProperty(property, rootData, kVal, kPath, recursive));
        }
      }

      return results;
    }

});

/**
 * class SpahQL.Token.SelectionQuery < SpahQL.Token.Base
 *
 * A token describing any selection query, comprised of an optional root flag followed by one or more
 * path components.
 **/

SpahQL_classExtend("SpahQL.Token.SelectionQuery", SpahQL.Token.Base, {

    // Singleton
    // --------------------------

    // Atom configuration: paths
    ATOM_PATH_ROOT: "$",

    /**
     * SpahQL.Token.SelectionQuery.parseAt(index, queryString) -> Array result or null
     *
     * Reads the given queryString starting at the given index and attempts to identify and parse
     * a selection query token. If found, the token will be returned in a tuple \[resumeIndex, foundToken\].
     * Returns null if nothing is found.
     **/
    "parseAt": function(i, query) {
      var ch = query.charAt(i);
      var firstComponent = SpahQL.Token.PathComponent.parseAt(i, query);
      if(ch == this.ATOM_PATH_ROOT || firstComponent) {
         // Query as a whole may have: root flag, set of path fragments
         var pq = new this();
         var j = i;

         if(ch == this.ATOM_PATH_ROOT) {
           firstComponent = SpahQL.Token.PathComponent.parseAt(j+1, query);
           if(!firstComponent) {
             this.throwParseErrorAt(j+1, query, "Found unexpected character '"+query.charAt(j+1)+"', expected TOKEN_PATH_COMPONENT");
           }
           // Valid root path, wind ahead and start chunking queries
           pq.useRoot = true;
         }
         j = firstComponent[0];
         pq.pathComponents.push(firstComponent[1]);

         // Start chunking into path segments
         var pathComponent;
         while(pathComponent = SpahQL.Token.PathComponent.parseAt(j, query)) {
           pq.pathComponents.push(pathComponent[1]);
           j = pathComponent[0];
         }
        return [j, pq];
      }
      return null;
    }

}, {

    // Instance
    // --------------------

    /**
     * SpahQL.Token.SelectionQuery#pathComponents -> Array Token.PathComponent
     *
     * Contains all path components that comprise this selection query, in the order in which they
     * were encountered during parsing.
     **/

    /**
     * SpahQL.Token.SelectionQuery#useRoot -> Boolean
     *
     * A flag indicating whether or not this query is locked to the root data context.
     **/

    /**
     * new SpahQL.Token.SelectionQuery(pathComponents, useRoot)
     *
     * Instantiate a new selection query token with blank-slate values.
     **/
    "init": function(pathComponents, useRoot) {
      this.pathComponents = pathComponents || [];
      this.useRoot = useRoot || false;
    },

    /**
     * SpahQL.Token.SelectionQuery#evaluate(rootData, scopeData, scopePath) -> Array
     * - rootData (Object): The entire root-level data structure being queried
     * - scopeData (Object): The data for the scope at which this query is being executed.
     * - scopePath (String): The string path for the root of the scopeData argument.
     *
     * Evaluates all the path components in the given query in turn.
     **/
    "evaluate": function(rootData, scopeData, scopePath) {
      // Start off with a simulated result using the data required by the query
      var results = [
        SpahQL.result(
          ((this.useRoot)? null : scopePath) || "/",
          ((this.useRoot)? rootData : scopeData)
        )
      ];

      // Loop path components and pass reduced data
      for(var i=0; i< this.pathComponents.length; i++) {
        var pc = this.pathComponents[i];
        var pcResults = []; // The results, flattened, for this path component

        for(var j=0; j < results.length; j++) {
          // Run each result from the previous iteration through the path component evaluator.
          // Resultset for initial run is defined at top of this method.
          pcResults = pcResults.concat(pc.evaluate(rootData, results[j].value, results[j].path));
        }
        results = pcResults;

        // only continue if there are results to work with
        if(results.length == 0) break;
      }
      return results;
    }

});

/**
 * class SpahQL.Token.KeyName < SpahQL.Token.Simple
 *
 * A simple token wrapping a valid variable or identifier value.
 **/

SpahQL_classExtend("SpahQL.Token.KeyName", SpahQL.Token.Simple, {

    /**
     * SpahQL.Token.KeyName.parseAt(i, query) -> Array\[resumeIndex, foundToken\] or null
     *
     * Identifies a keyname identifier at the given index in the given string query and returns null
     * if no token is identified, or a tuple of terminating index and the instantiated token if successful.
     **/
    "parseAt": function(i, query) {
      var valid = /[\w\d_-]/;
      var j=i; var token = "";
      var m;
      while(m = query.charAt(j).match(valid)) {
        token += m[0]; j++;
      }
      return (token.length > 0)? [j, new this(token)] : null;
    }

});
