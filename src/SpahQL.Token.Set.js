/**
 * class SpahQL.Token.Set < SpahQL.Token.Base
 *
 * A wrappping class for any set literal, containing one or more values.
 * May qualify as a range if the range operator is used during parsing.
 **/
 
SpahQL_classExtend("SpahQL.Token.Set", SpahQL.Token.Base, {

  // Singleton
  // -------------------
  
  // Atom configuration: sets
  ATOM_SET_START: "{",
  ATOM_SET_END: "}",
  ATOM_SET_ARRAY_DELIMITER: ",",
  ATOM_SET_RANGE_DELIMITER: "..",
  
  /**
   * SpahQL.Token.Set.parseAt(index, queryString) -> Array result or null
   *
   * Reads the given queryString starting at the given index and attempts to identify and parse
   * a set literal token. If found, the token will be returned in a tuple \[resumeIndex, foundToken\]. 
   * Returns null if nothing is found.
   **/
  "parseAt": function(i, query) {
    if(query.charAt(i) == this.ATOM_SET_START) {
      var j=i+1;
      var tokens=[];
      var usedArrayDelimiter = false
      var usedRangeDelimiter = false;
      var readResult;

      if(query.charAt(j) == this.ATOM_SET_END) {
        return [j+1, new this()]; // Empty set
      }

      while(readResult = SpahQL.Token.parseAt(j, query)) {
        var token = readResult[1];
        var allowedTokens = [SpahQL.Token.Numeric, SpahQL.Token.String, SpahQL.Token.Boolean, SpahQL.Token.SelectionQuery];
        var tokenIsAllowed = false;
        for(var i in allowedTokens) {
          var klass = allowedTokens[i];
          if(token instanceof klass) {
            tokenIsAllowed = true;
            break;
          }
        }
        
        if(tokenIsAllowed) {
          // wind ahead
          j = readResult[0];
          // push token into set
          tokens.push(token);
          // find delimiter
          if(query.charAt(j) == this.ATOM_SET_ARRAY_DELIMITER) {
            if(usedRangeDelimiter) {
              this.throwParseErrorAt(j, query, "Found unexpected ATOM_SET_ARRAY_DELIMITER in set literal that already used the range delimiter.");
            }
            usedArrayDelimiter = true; j++;
          }
          else if(query.substr(j, this.ATOM_SET_RANGE_DELIMITER.length) == this.ATOM_SET_RANGE_DELIMITER) {
            if(usedArrayDelimiter) {
              this.throwParseErrorAt(j, query, "Found unexpected ATOM_SET_RANGE_DELIMITER in set literal that already used the array delimiter.");
            }
            usedRangeDelimiter = true; j+=this.ATOM_SET_RANGE_DELIMITER.length;
          }
          else if(query.charAt(j) == this.ATOM_SET_END) {
            j++; break;
          }
          else {
            this.throwParseErrorAt(j, query, "Found unexpected character '"+query.charAt(j)+"' in set literal, expecting one of ATOM_SET_ARRAY_DELIMITER, ATOM_SET_RANGE_DELIMITER, ATOM_SET_END.");
          }
        }
        else {
          this.throwParseErrorAt(j, query,  "Found unexpected token in set literal. Set literals may only contain string, numeric, boolean and selection query values.");
        }
      }
      return [j, new this(tokens, usedRangeDelimiter)];
    }
    return null;
  }
  
}, {
  
  // Instance 
  // -------------------
  
  /**
   * SpahQL.Token.Set#tokens -> Array Token
   *
   * Contains all tokens included in this set, in the order in which they were encountered.
   **/
  
  /**
   * SpahQL.Token.Set#isRange -> Boolean
   *
   * A flag indicating whether or not this token is to be evaluated as a range.
   **/
  
  /**
   * new SpahQL.Token.Set(value)
   *
   * Instantiate a new set token with the given list of tokens.
   **/
  "init": function(tokens, isRange) {
    this.tokens = tokens || [];
    this.isRange = isRange || false;
  },
  
  /**
   * SpahQL.Token.Set#evaluate(rootData[, scopeData][, scopePath]) -> Array
   * - rootData (Object): A root data context for any selection queries that appear in the literal
   * - scopeData (Object): A scoped data context for the scope at which selection queries in the set will be evaluated.
   * - scopePath (String): The string path at which the scopeData is located in the overall rootData construct.
   *
   * Evaluates a set literal, for use when a set is used in a selection query and must be returned as a set of results.
   * If the set is a range, it will be flattened into a set of values.
   **/
  evaluate: function(rootData, scopeData, scopePath) {
    var results = [];
    if(this.isRange) {
      
      // Break if tokens look suspicious
      if(this.tokens.length != 2) {
        this.throwRuntimeError(this, "Tried to evaluate range with "+this.tokens.length+" tokens, expected 2 tokens. Tokens: "+this.tokens.join(", "));
      }
      
      var startResults = this.tokens[0].evaluate(rootData, scopeData, scopePath);
      var endResults = this.tokens[1].evaluate(rootData, scopeData, scopePath);
    
      // Break if evaluation of either token returns no results
      if(startResults.length == 0 || endResults.length == 0) return results;
      
      var start = startResults[0].value;
      var end = endResults[0].value;
      var sType = SpahQL.DataHelper.objectType(start);
      var eType = SpahQL.DataHelper.objectType(end);
      if(sType == eType) {
        if(sType == "number") results = results.concat(this.evalNumericRange(start, end));
        else if(sType == "string") results = results.concat(this.evalStringRange(start, end));
        else new SpahQL.Errors.SpahQLRunTimeError("Unsupported type used in range. Ranges support only strings and numbers.");
      }
      else {
        throw new SpahQL.Errors.SpahQLRunTimeError("Illegal range with start type '"+sType+"' and end type '"+eType+"'. Ranges must use the same type at each end.");
      }
    }
    else {
      // Loop - evaluate queries
      for(var i in this.tokens) {
        var token = this.tokens[i];
        results = results.concat(token.evaluate(rootData, scopeData, scopePath));
      }
    }
    return results;
  },

  /**
   * SpahQL.Token.Set#evalNumericRange(start, end) -> Array
   * - start (Number): The number at the start of the range (10 is the start value for {10..8})
   * - end (Number): The number at the start of the range (8 is the end value for {10..8})
   *
   * Works with a ruby-style evaluation. Reverse ranges evaluate as empty. Symmetrical ranges e.g. 10..10 evaluate with 
   * one result.
   *
   * Evaluates a numeric range literal, generating an array containing all values in the range.
   **/
  evalNumericRange: function(start, end) {
    var results = [];
    // Return empty set for reverse ranges
    if(end < start) {
      
      for(var r=start; r>=end; r--) results.push(SpahQL.result(null, r));
    }
    else {
      for(var i=start; i<=end; i++) results.push(SpahQL.result(null, i));
    }
    
    return results;
  },

  /**
   * SpahQL.Token.Set#evalStringRange(start, end) -> Array of QueryResults
   * - start (String): The character at the start of the range ("a" is the start value for {'a'..'c'})
   * - end (String): The character at the end of the range ("c" is the end value for {'a'..'c'})
   *
   * Evaluates a string range literal, generating an array of QueryResults containing all values in the range.
   * String range literals are evaluated as numeric ranges using a radix of 35, and transposing the generated numeric values 
   * back into strings before returning them.
   *
   * Evaluates with a ruby-style behaviour, for instance:
   * "a".."c" -> a, b, c
   * "ab".."ad" -> ab, ac, ad
   * "a1".."b2" -> a1, a2...... a8, a9, b1, b2
   * "1b".."2b" -> 1b, 1c, 1d...... 1x, 1y, 1z, 2a, 2b
   *
   * So: Each digit is cycled based on a its type, and at the culmination of each digit's cycle the next highest-order
   * digit is iterated. The types of digit are number, lowercase char and uppercase char.
   *
   * If the digits cannot be cycled to a match, as in the example "1a".."b1" where the digits are of differing types, the
   * initial value is iterated to its peak and will terminate at that point. The generated range is equivalent in this case
   * to "1a".."9z".
   *
   * If the values appear to be reversed (e.g. "z".."a", "9a".."3a", "D1".."A1") then in ruby style the range will evaluate
   * as empty.
   *
   * We do this by defining three character code ranges for certain character types - integers(48-57), lower case characters (97-122)
   * and uppercase characters (65-90). If any two characters belong to the same range then they are mutually iterable.
   *
   * There is a special case for single-character ranges where if the initial value sits outside of these ranges, it is iterated
   * towards the destination value until it reaches the destination value or until it reaches the end of one of the predefined
   * ranges above. For instance, "}".."~" will iterate successfully, but "x".."}" despite being an increasing range in raw
   * character code terms will only evaluate to "x","y","z". In the case of a range like ")".."a" (character code 41 to 97) the iterator
   * will enter the numeric character range (48-57) and in doing so will terminate at char code 57, character "9".
   *
   * In ranges with multiple digits, characters outside the three defined ranges are locked and do not iterate.
   **/
  evalStringRange: function(start, end) {
    var results = [];
    
    // Figure out if this is a reversed or symmetrical range. 
    // Another easy comparison: Symmetrical ranges have one entry
    if(start == end) return [SpahQL.result(null, start)];
    // Easy comparison: One string is shorter than the other or the range is reversed
    if((start > end)||(start.length!=end.length)) return results; 
    
    // Columnar charcode indexes:
    // integer: 48..57 == "0".."9"
    // ucase: 65..90 == "A".."Z"
    // lcase: 97..122 == "a".."z"
    
    // We're going to treat this like a slot machine. 
    // Create an array of "locks" which are locked columns in the range.
    var locks = [];
    var allLocked = true;
    for(var c=0; c<start.length; c++) {
      var code = start.charCodeAt(c);
      // If outside of range, lock
      locks[c] = ((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122))? false : true;
      allLocked = (locks[c]==true && allLocked==true);
      // If all others are locked and this is last column, unlock
      if(allLocked && c == start.length-1) locks[c] = false;
    }
          
    var nextWorkingCol = function(wC) {
      for(var w=wC-1; w>-2; w--) {
        if(locks[w] == false) return w;
      }
    }
    
    var gen = start+""; // clone start
    iterating: while(true) {
      // ^^^^
      // When the workingCol hits -1 we know we popped a carry on the highest-order digit and maxed the string
      // If nextString == end then we hit the range target and should break.
      // Push the last-iterated result
      results.push(SpahQL.result(null, gen));
      if(gen == end) break iterating;
      
      // Iterate until carrying stops, giving us our new stop value for the next increment
      var workingCol = nextWorkingCol(start.length),
          carry = true,
          next = "";        
      
      carrying: while(true) {
        // Iterate start string and push new results. Break on maxing all unlocked columns or on reaching end token.
        // Iteration works on the lowest-order unlocked column and may generate a carry operation, which resets the current working
        // column to its lowest value and increments the next highest-order unlocked column. This in turn may generate a carry operation.
        // If the overall highest-order unlocked column generates a carry when incremented, then the string is maxed and the range
        // terminates.
        next = (function(str) {
            // Iterates a character and generates a new string and potentially a carry.
            var carry = false;
            var cCode = str.charCodeAt(0);
            var nCode;
            if(cCode == 57) {
              carry = true;
              nCode = 48;
            }
            else if(cCode == 90) {
              carry = true;
              nCode = 65;
            }
            else if(cCode == 122) {
              carry = true;
              nCode = 97;
            }
            else if(cCode == 127) {
              carry = true;
              nCode = cCode;
            } 
            else {
              nCode = cCode+1;
            }
            return [String.fromCharCode(nCode), carry];
        })(gen.charAt(workingCol));
        
        gen = gen.split(""); gen.splice(workingCol,1,next[0]); gen = gen.join("");
        if(next[1]==true) {
          // Next next highest-order unlocked col
          workingCol = nextWorkingCol(workingCol);
          if(workingCol < 0) break iterating;
        }
        else {
          break carrying;
        }
      }
    }
    
    return results;
  }
  
});