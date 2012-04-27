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