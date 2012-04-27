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
