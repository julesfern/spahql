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