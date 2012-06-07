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
              this.throwParseErrorAt(i, query, "Unexpected token, expected EOL or TOKEN_COMPARISON_OPERATOR");
            }
          }
          else {
            parsedQuery.primaryToken = token;
          }
          
        }
        
        i = windAhead;
      }
      
      // Vet parsed query
      if(!parsedQuery.primaryToken) {
        this.throwParseErrorAt(0, query, "Failed to parse query, expected TOKEN_SET_LITERAL or TOKEN_SELECTION_QUERY");
      }
      else if(parsedQuery.comparisonOperator && !parsedQuery.secondaryToken) {
        this.throwParseErrorAt(query.length-1, query, "Query contains comparison operator but has no secondary term - expected TOKEN_SET_LITERAL or TOKEN_SELECTION_QUERY");
      }
      else {
      // Stash and return
        this.queryCache[query] = parsedQuery;
        SpahQL.log("Generated and cached query '"+str+"' ->", parsedQuery);
        return parsedQuery;
      }

     
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