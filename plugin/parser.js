// XXX Remove this file when PR jade#1392 is merged and released
// https://github.com/visionmedia/jade/pull/1392
//
// The goal of the PR is to add a `lexer` option to the parser so that the user
// could provide his own customized Lexer object.

Parser = function Parser(str, filename, options){
  //Strip any UTF-8 BOM off of the start of `str`, if it exists.
  this.input = str.replace(/^\uFEFF/, '');
  this.filename = filename;
  this.blocks = {};
  this.mixins = {};
  this.options = options || {};
  // <mquandalle>
  var Constructor = this.options.lexer || Lexer;
  this.lexer = new Constructor(this.input, filename);
  // </mquandalle>
  this.contexts = [this];
  this.inMixin = false;
};

Parser.prototype = Npm.require('jade').Parser.prototype;
