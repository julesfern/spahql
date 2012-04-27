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