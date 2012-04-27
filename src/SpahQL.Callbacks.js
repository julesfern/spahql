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