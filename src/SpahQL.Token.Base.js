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