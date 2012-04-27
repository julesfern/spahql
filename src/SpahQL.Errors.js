/**
 * class SpahQL.Errors
 *
 * A containing namespace for all exceptions generated within the SpahQL library.
 **/
SpahQL.Errors = {};

/**
 * class SpahQL.Errors.SpahQLError
 *
 * Defines an abstract exception class for all errors generated within the SpahQL library.
 **/
SpahQL.Errors.SpahQLError = function(message) { this.name = "SpahQLError"; this.message = (message || ""); };
SpahQL.Errors.SpahQLError.prototype = Error.prototype;

/**
 * class SpahQL.Errors.SpahQLRunTimeError < SpahQL.Errors.SpahQLError
 *
 * An error class used for runtime query evaluation errors, usually generated in the QueryRunner class.
 **/
SpahQL.Errors.SpahQLRunTimeError = function(message) { this.name = "SpahQLRunTimeError"; this.message = (message || ""); };
SpahQL.Errors.SpahQLRunTimeError.prototype = SpahQL.Errors.SpahQLError.prototype;