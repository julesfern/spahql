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