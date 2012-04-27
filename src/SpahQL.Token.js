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