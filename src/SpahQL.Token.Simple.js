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