(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

(function (Hogan) {
  // Setup regex  assignments
  // remove whitespace according to Mustache spec
  var rIsWhitespace = /\S/,
      rQuot = /\"/g,
      rNewline =  /\n/g,
      rCr = /\r/g,
      rSlash = /\\/g,
      rLineSep = /\u2028/,
      rParagraphSep = /\u2029/;

  Hogan.tags = {
    '#': 1, '^': 2, '<': 3, '$': 4,
    '/': 5, '!': 6, '>': 7, '=': 8, '_v': 9,
    '{': 10, '&': 11, '_t': 12
  };

  Hogan.scan = function scan(text, delimiters) {
    var len = text.length,
        IN_TEXT = 0,
        IN_TAG_TYPE = 1,
        IN_TAG = 2,
        state = IN_TEXT,
        tagType = null,
        tag = null,
        buf = '',
        tokens = [],
        seenTag = false,
        i = 0,
        lineStart = 0,
        otag = '{{',
        ctag = '}}';

    function addBuf() {
      if (buf.length > 0) {
        tokens.push({tag: '_t', text: new String(buf)});
        buf = '';
      }
    }

    function lineIsWhitespace() {
      var isAllWhitespace = true;
      for (var j = lineStart; j < tokens.length; j++) {
        isAllWhitespace =
          (Hogan.tags[tokens[j].tag] < Hogan.tags['_v']) ||
          (tokens[j].tag == '_t' && tokens[j].text.match(rIsWhitespace) === null);
        if (!isAllWhitespace) {
          return false;
        }
      }

      return isAllWhitespace;
    }

    function filterLine(haveSeenTag, noNewLine) {
      addBuf();

      if (haveSeenTag && lineIsWhitespace()) {
        for (var j = lineStart, next; j < tokens.length; j++) {
          if (tokens[j].text) {
            if ((next = tokens[j+1]) && next.tag == '>') {
              // set indent to token value
              next.indent = tokens[j].text.toString()
            }
            tokens.splice(j, 1);
          }
        }
      } else if (!noNewLine) {
        tokens.push({tag:'\n'});
      }

      seenTag = false;
      lineStart = tokens.length;
    }

    function changeDelimiters(text, index) {
      var close = '=' + ctag,
          closeIndex = text.indexOf(close, index),
          delimiters = trim(
            text.substring(text.indexOf('=', index) + 1, closeIndex)
          ).split(' ');

      otag = delimiters[0];
      ctag = delimiters[delimiters.length - 1];

      return closeIndex + close.length - 1;
    }

    if (delimiters) {
      delimiters = delimiters.split(' ');
      otag = delimiters[0];
      ctag = delimiters[1];
    }

    for (i = 0; i < len; i++) {
      if (state == IN_TEXT) {
        if (tagChange(otag, text, i)) {
          --i;
          addBuf();
          state = IN_TAG_TYPE;
        } else {
          if (text.charAt(i) == '\n') {
            filterLine(seenTag);
          } else {
            buf += text.charAt(i);
          }
        }
      } else if (state == IN_TAG_TYPE) {
        i += otag.length - 1;
        tag = Hogan.tags[text.charAt(i + 1)];
        tagType = tag ? text.charAt(i + 1) : '_v';
        if (tagType == '=') {
          i = changeDelimiters(text, i);
          state = IN_TEXT;
        } else {
          if (tag) {
            i++;
          }
          state = IN_TAG;
        }
        seenTag = i;
      } else {
        if (tagChange(ctag, text, i)) {
          tokens.push({tag: tagType, n: trim(buf), otag: otag, ctag: ctag,
                       i: (tagType == '/') ? seenTag - otag.length : i + ctag.length});
          buf = '';
          i += ctag.length - 1;
          state = IN_TEXT;
          if (tagType == '{') {
            if (ctag == '}}') {
              i++;
            } else {
              cleanTripleStache(tokens[tokens.length - 1]);
            }
          }
        } else {
          buf += text.charAt(i);
        }
      }
    }

    filterLine(seenTag, true);

    return tokens;
  }

  function cleanTripleStache(token) {
    if (token.n.substr(token.n.length - 1) === '}') {
      token.n = token.n.substring(0, token.n.length - 1);
    }
  }

  function trim(s) {
    if (s.trim) {
      return s.trim();
    }

    return s.replace(/^\s*|\s*$/g, '');
  }

  function tagChange(tag, text, index) {
    if (text.charAt(index) != tag.charAt(0)) {
      return false;
    }

    for (var i = 1, l = tag.length; i < l; i++) {
      if (text.charAt(index + i) != tag.charAt(i)) {
        return false;
      }
    }

    return true;
  }

  // the tags allowed inside super templates
  var allowedInSuper = {'_t': true, '\n': true, '$': true, '/': true};

  function buildTree(tokens, kind, stack, customTags) {
    var instructions = [],
        opener = null,
        tail = null,
        token = null;

    tail = stack[stack.length - 1];

    while (tokens.length > 0) {
      token = tokens.shift();

      if (tail && tail.tag == '<' && !(token.tag in allowedInSuper)) {
        throw new Error('Illegal content in < super tag.');
      }

      if (Hogan.tags[token.tag] <= Hogan.tags['$'] || isOpener(token, customTags)) {
        stack.push(token);
        token.nodes = buildTree(tokens, token.tag, stack, customTags);
      } else if (token.tag == '/') {
        if (stack.length === 0) {
          throw new Error('Closing tag without opener: /' + token.n);
        }
        opener = stack.pop();
        if (token.n != opener.n && !isCloser(token.n, opener.n, customTags)) {
          throw new Error('Nesting error: ' + opener.n + ' vs. ' + token.n);
        }
        opener.end = token.i;
        return instructions;
      } else if (token.tag == '\n') {
        token.last = (tokens.length == 0) || (tokens[0].tag == '\n');
      }

      instructions.push(token);
    }

    if (stack.length > 0) {
      throw new Error('missing closing tag: ' + stack.pop().n);
    }

    return instructions;
  }

  function isOpener(token, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].o == token.n) {
        token.tag = '#';
        return true;
      }
    }
  }

  function isCloser(close, open, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].c == close && tags[i].o == open) {
        return true;
      }
    }
  }

  function stringifySubstitutions(obj) {
    var items = [];
    for (var key in obj) {
      items.push('"' + esc(key) + '": function(c,p,t,i) {' + obj[key] + '}');
    }
    return "{ " + items.join(",") + " }";
  }

  function stringifyPartials(codeObj) {
    var partials = [];
    for (var key in codeObj.partials) {
      partials.push('"' + esc(key) + '":{name:"' + esc(codeObj.partials[key].name) + '", ' + stringifyPartials(codeObj.partials[key]) + "}");
    }
    return "partials: {" + partials.join(",") + "}, subs: " + stringifySubstitutions(codeObj.subs);
  }

  Hogan.stringify = function(codeObj, text, options) {
    return "{code: function (c,p,i) { " + Hogan.wrapMain(codeObj.code) + " }," + stringifyPartials(codeObj) +  "}";
  }

  var serialNo = 0;
  Hogan.generate = function(tree, text, options) {
    serialNo = 0;
    var context = { code: '', subs: {}, partials: {} };
    Hogan.walk(tree, context);

    if (options.asString) {
      return this.stringify(context, text, options);
    }

    return this.makeTemplate(context, text, options);
  }

  Hogan.wrapMain = function(code) {
    return 'var t=this;t.b(i=i||"");' + code + 'return t.fl();';
  }

  Hogan.template = Hogan.Template;

  Hogan.makeTemplate = function(codeObj, text, options) {
    var template = this.makePartials(codeObj);
    template.code = new Function('c', 'p', 'i', this.wrapMain(codeObj.code));
    return new this.template(template, text, this, options);
  }

  Hogan.makePartials = function(codeObj) {
    var key, template = {subs: {}, partials: codeObj.partials, name: codeObj.name};
    for (key in template.partials) {
      template.partials[key] = this.makePartials(template.partials[key]);
    }
    for (key in codeObj.subs) {
      template.subs[key] = new Function('c', 'p', 't', 'i', codeObj.subs[key]);
    }
    return template;
  }

  function esc(s) {
    return s.replace(rSlash, '\\\\')
            .replace(rQuot, '\\\"')
            .replace(rNewline, '\\n')
            .replace(rCr, '\\r')
            .replace(rLineSep, '\\u2028')
            .replace(rParagraphSep, '\\u2029');
  }

  function chooseMethod(s) {
    return (~s.indexOf('.')) ? 'd' : 'f';
  }

  function createPartial(node, context) {
    var prefix = "<" + (context.prefix || "");
    var sym = prefix + node.n + serialNo++;
    context.partials[sym] = {name: node.n, partials: {}};
    context.code += 't.b(t.rp("' +  esc(sym) + '",c,p,"' + (node.indent || '') + '"));';
    return sym;
  }

  Hogan.codegen = {
    '#': function(node, context) {
      context.code += 'if(t.s(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,1),' +
                      'c,p,0,' + node.i + ',' + node.end + ',"' + node.otag + " " + node.ctag + '")){' +
                      't.rs(c,p,' + 'function(c,p,t){';
      Hogan.walk(node.nodes, context);
      context.code += '});c.pop();}';
    },

    '^': function(node, context) {
      context.code += 'if(!t.s(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,1),c,p,1,0,0,"")){';
      Hogan.walk(node.nodes, context);
      context.code += '};';
    },

    '>': createPartial,
    '<': function(node, context) {
      var ctx = {partials: {}, code: '', subs: {}, inPartial: true};
      Hogan.walk(node.nodes, ctx);
      var template = context.partials[createPartial(node, context)];
      template.subs = ctx.subs;
      template.partials = ctx.partials;
    },

    '$': function(node, context) {
      var ctx = {subs: {}, code: '', partials: context.partials, prefix: node.n};
      Hogan.walk(node.nodes, ctx);
      context.subs[node.n] = ctx.code;
      if (!context.inPartial) {
        context.code += 't.sub("' + esc(node.n) + '",c,p,i);';
      }
    },

    '\n': function(node, context) {
      context.code += write('"\\n"' + (node.last ? '' : ' + i'));
    },

    '_v': function(node, context) {
      context.code += 't.b(t.v(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,0)));';
    },

    '_t': function(node, context) {
      context.code += write('"' + esc(node.text) + '"');
    },

    '{': tripleStache,

    '&': tripleStache
  }

  function tripleStache(node, context) {
    context.code += 't.b(t.t(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,0)));';
  }

  function write(s) {
    return 't.b(' + s + ');';
  }

  Hogan.walk = function(nodelist, context) {
    var func;
    for (var i = 0, l = nodelist.length; i < l; i++) {
      func = Hogan.codegen[nodelist[i].tag];
      func && func(nodelist[i], context);
    }
    return context;
  }

  Hogan.parse = function(tokens, text, options) {
    options = options || {};
    return buildTree(tokens, '', [], options.sectionTags || []);
  }

  Hogan.cache = {};

  Hogan.cacheKey = function(text, options) {
    return [text, !!options.asString, !!options.disableLambda, options.delimiters, !!options.modelGet].join('||');
  }

  Hogan.compile = function(text, options) {
    options = options || {};
    var key = Hogan.cacheKey(text, options);
    var template = this.cache[key];

    if (template) {
      var partials = template.partials;
      for (var name in partials) {
        delete partials[name].instance;
      }
      return template;
    }

    template = this.generate(this.parse(this.scan(text, options.delimiters), text, options), text, options);
    return this.cache[key] = template;
  }
})(typeof exports !== 'undefined' ? exports : Hogan);

},{}],2:[function(require,module,exports){
/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

// This file is for use with Node.js. See dist/ for browser files.

var Hogan = require('./compiler');
Hogan.Template = require('./template').Template;
Hogan.template = Hogan.Template;
module.exports = Hogan;

},{"./compiler":1,"./template":3}],3:[function(require,module,exports){
/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var Hogan = {};

(function (Hogan) {
  Hogan.Template = function (codeObj, text, compiler, options) {
    codeObj = codeObj || {};
    this.r = codeObj.code || this.r;
    this.c = compiler;
    this.options = options || {};
    this.text = text || '';
    this.partials = codeObj.partials || {};
    this.subs = codeObj.subs || {};
    this.buf = '';
  }

  Hogan.Template.prototype = {
    // render: replaced by generated code.
    r: function (context, partials, indent) { return ''; },

    // variable escaping
    v: hoganEscape,

    // triple stache
    t: coerceToString,

    render: function render(context, partials, indent) {
      return this.ri([context], partials || {}, indent);
    },

    // render internal -- a hook for overrides that catches partials too
    ri: function (context, partials, indent) {
      return this.r(context, partials, indent);
    },

    // ensurePartial
    ep: function(symbol, partials) {
      var partial = this.partials[symbol];

      // check to see that if we've instantiated this partial before
      var template = partials[partial.name];
      if (partial.instance && partial.base == template) {
        return partial.instance;
      }

      if (typeof template == 'string') {
        if (!this.c) {
          throw new Error("No compiler available.");
        }
        template = this.c.compile(template, this.options);
      }

      if (!template) {
        return null;
      }

      // We use this to check whether the partials dictionary has changed
      this.partials[symbol].base = template;

      if (partial.subs) {
        // Make sure we consider parent template now
        if (!partials.stackText) partials.stackText = {};
        for (key in partial.subs) {
          if (!partials.stackText[key]) {
            partials.stackText[key] = (this.activeSub !== undefined && partials.stackText[this.activeSub]) ? partials.stackText[this.activeSub] : this.text;
          }
        }
        template = createSpecializedPartial(template, partial.subs, partial.partials,
          this.stackSubs, this.stackPartials, partials.stackText);
      }
      this.partials[symbol].instance = template;

      return template;
    },

    // tries to find a partial in the current scope and render it
    rp: function(symbol, context, partials, indent) {
      var partial = this.ep(symbol, partials);
      if (!partial) {
        return '';
      }

      return partial.ri(context, partials, indent);
    },

    // render a section
    rs: function(context, partials, section) {
      var tail = context[context.length - 1];

      if (!isArray(tail)) {
        section(context, partials, this);
        return;
      }

      for (var i = 0; i < tail.length; i++) {
        context.push(tail[i]);
        section(context, partials, this);
        context.pop();
      }
    },

    // maybe start a section
    s: function(val, ctx, partials, inverted, start, end, tags) {
      var pass;

      if (isArray(val) && val.length === 0) {
        return false;
      }

      if (typeof val == 'function') {
        val = this.ms(val, ctx, partials, inverted, start, end, tags);
      }

      pass = !!val;

      if (!inverted && pass && ctx) {
        ctx.push((typeof val == 'object') ? val : ctx[ctx.length - 1]);
      }

      return pass;
    },

    // find values with dotted names
    d: function(key, ctx, partials, returnFound) {
      var found,
          names = key.split('.'),
          val = this.f(names[0], ctx, partials, returnFound),
          doModelGet = this.options.modelGet,
          cx = null;

      if (key === '.' && isArray(ctx[ctx.length - 2])) {
        val = ctx[ctx.length - 1];
      } else {
        for (var i = 1; i < names.length; i++) {
          found = findInScope(names[i], val, doModelGet);
          if (found !== undefined) {
            cx = val;
            val = found;
          } else {
            val = '';
          }
        }
      }

      if (returnFound && !val) {
        return false;
      }

      if (!returnFound && typeof val == 'function') {
        ctx.push(cx);
        val = this.mv(val, ctx, partials);
        ctx.pop();
      }

      return val;
    },

    // find values with normal names
    f: function(key, ctx, partials, returnFound) {
      var val = false,
          v = null,
          found = false,
          doModelGet = this.options.modelGet;

      for (var i = ctx.length - 1; i >= 0; i--) {
        v = ctx[i];
        val = findInScope(key, v, doModelGet);
        if (val !== undefined) {
          found = true;
          break;
        }
      }

      if (!found) {
        return (returnFound) ? false : "";
      }

      if (!returnFound && typeof val == 'function') {
        val = this.mv(val, ctx, partials);
      }

      return val;
    },

    // higher order templates
    ls: function(func, cx, partials, text, tags) {
      var oldTags = this.options.delimiters;

      this.options.delimiters = tags;
      this.b(this.ct(coerceToString(func.call(cx, text)), cx, partials));
      this.options.delimiters = oldTags;

      return false;
    },

    // compile text
    ct: function(text, cx, partials) {
      if (this.options.disableLambda) {
        throw new Error('Lambda features disabled.');
      }
      return this.c.compile(text, this.options).render(cx, partials);
    },

    // template result buffering
    b: function(s) { this.buf += s; },

    fl: function() { var r = this.buf; this.buf = ''; return r; },

    // method replace section
    ms: function(func, ctx, partials, inverted, start, end, tags) {
      var textSource,
          cx = ctx[ctx.length - 1],
          result = func.call(cx);

      if (typeof result == 'function') {
        if (inverted) {
          return true;
        } else {
          textSource = (this.activeSub && this.subsText && this.subsText[this.activeSub]) ? this.subsText[this.activeSub] : this.text;
          return this.ls(result, cx, partials, textSource.substring(start, end), tags);
        }
      }

      return result;
    },

    // method replace variable
    mv: function(func, ctx, partials) {
      var cx = ctx[ctx.length - 1];
      var result = func.call(cx);

      if (typeof result == 'function') {
        return this.ct(coerceToString(result.call(cx)), cx, partials);
      }

      return result;
    },

    sub: function(name, context, partials, indent) {
      var f = this.subs[name];
      if (f) {
        this.activeSub = name;
        f(context, partials, this, indent);
        this.activeSub = false;
      }
    }

  };

  //Find a key in an object
  function findInScope(key, scope, doModelGet) {
    var val;

    if (scope && typeof scope == 'object') {

      if (scope[key] !== undefined) {
        val = scope[key];

      // try lookup with get for backbone or similar model data
      } else if (doModelGet && scope.get && typeof scope.get == 'function') {
        val = scope.get(key);
      }
    }

    return val;
  }

  function createSpecializedPartial(instance, subs, partials, stackSubs, stackPartials, stackText) {
    function PartialTemplate() {};
    PartialTemplate.prototype = instance;
    function Substitutions() {};
    Substitutions.prototype = instance.subs;
    var key;
    var partial = new PartialTemplate();
    partial.subs = new Substitutions();
    partial.subsText = {};  //hehe. substext.
    partial.buf = '';

    stackSubs = stackSubs || {};
    partial.stackSubs = stackSubs;
    partial.subsText = stackText;
    for (key in subs) {
      if (!stackSubs[key]) stackSubs[key] = subs[key];
    }
    for (key in stackSubs) {
      partial.subs[key] = stackSubs[key];
    }

    stackPartials = stackPartials || {};
    partial.stackPartials = stackPartials;
    for (key in partials) {
      if (!stackPartials[key]) stackPartials[key] = partials[key];
    }
    for (key in stackPartials) {
      partial.partials[key] = stackPartials[key];
    }

    return partial;
  }

  var rAmp = /&/g,
      rLt = /</g,
      rGt = />/g,
      rApos = /\'/g,
      rQuot = /\"/g,
      hChars = /[&<>\"\']/;

  function coerceToString(val) {
    return String((val === null || val === undefined) ? '' : val);
  }

  function hoganEscape(str) {
    str = coerceToString(str);
    return hChars.test(str) ?
      str
        .replace(rAmp, '&amp;')
        .replace(rLt, '&lt;')
        .replace(rGt, '&gt;')
        .replace(rApos, '&#39;')
        .replace(rQuot, '&quot;') :
      str;
  }

  var isArray = Array.isArray || function(a) {
    return Object.prototype.toString.call(a) === '[object Array]';
  };

})(typeof exports !== 'undefined' ? exports : Hogan);

},{}],4:[function(require,module,exports){
'use strict';
// For more information about browser field, check out the browser field at https://github.com/substack/browserify-handbook#browser-field.

var styleElementsInsertedAtTop = [];

var insertStyleElement = function(styleElement, options) {
    var head = document.head || document.getElementsByTagName('head')[0];
    var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];

    options = options || {};
    options.insertAt = options.insertAt || 'bottom';

    if (options.insertAt === 'top') {
        if (!lastStyleElementInsertedAtTop) {
            head.insertBefore(styleElement, head.firstChild);
        } else if (lastStyleElementInsertedAtTop.nextSibling) {
            head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
        } else {
            head.appendChild(styleElement);
        }
        styleElementsInsertedAtTop.push(styleElement);
    } else if (options.insertAt === 'bottom') {
        head.appendChild(styleElement);
    } else {
        throw new Error('Invalid value for parameter \'insertAt\'. Must be \'top\' or \'bottom\'.');
    }
};

module.exports = {
    // Create a <link> tag with optional data attributes
    createLink: function(href, attributes) {
        var head = document.head || document.getElementsByTagName('head')[0];
        var link = document.createElement('link');

        link.href = href;
        link.rel = 'stylesheet';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            link.setAttribute('data-' + key, value);
        }

        head.appendChild(link);
    },
    // Create a <style> tag with optional data attributes
    createStyle: function(cssText, attributes, extraOptions) {
        extraOptions = extraOptions || {};

        var style = document.createElement('style');
        style.type = 'text/css';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            style.setAttribute('data-' + key, value);
        }

        if (style.sheet) { // for jsdom and IE9+
            style.innerHTML = cssText;
            style.sheet.cssText = cssText;
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
        } else if (style.styleSheet) { // for IE8 and below
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
            style.styleSheet.cssText = cssText;
        } else { // for Chrome, Firefox, and Safari
            style.appendChild(document.createTextNode(cssText));
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
        }
    }
};

},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],6:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],7:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"./compiler":6,"./template":8,"dup":2}],8:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"dup":3}],9:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],10:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.12.2
(function() {
  var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - nodeLoadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    moduleLoadTime = getNanoSeconds();
    upTime = process.uptime() * 1e9;
    nodeLoadTime = moduleLoadTime - upTime;
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);



}).call(this,require('_process'))
},{"_process":11}],11:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],12:[function(require,module,exports){
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var now = require('right-now')
var raf = require('raf')

module.exports = Engine
function Engine(fn) {
    if (!(this instanceof Engine)) 
        return new Engine(fn)
    this.running = false
    this.last = now()
    this._frame = 0
    this._tick = this.tick.bind(this)

    if (fn)
        this.on('tick', fn)
}

inherits(Engine, EventEmitter)

Engine.prototype.start = function() {
    if (this.running) 
        return
    this.running = true
    this.last = now()
    this._frame = raf(this._tick)
    return this
}

Engine.prototype.stop = function() {
    this.running = false
    if (this._frame !== 0)
        raf.cancel(this._frame)
    this._frame = 0
    return this
}

Engine.prototype.tick = function() {
    this._frame = raf(this._tick)
    var time = now()
    var dt = time - this.last
    this.emit('tick', dt)
    this.last = time
}
},{"events":5,"inherits":9,"raf":13,"right-now":14}],13:[function(require,module,exports){
(function (global){
var now = require('performance-now')
  , root = typeof window === 'undefined' ? global : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = root['request' + suffix]
  , caf = root['cancel' + suffix] || root['cancelRequest' + suffix]

for(var i = 0; !raf && i < vendors.length; i++) {
  raf = root[vendors[i] + 'Request' + suffix]
  caf = root[vendors[i] + 'Cancel' + suffix]
      || root[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(root, fn)
}
module.exports.cancel = function() {
  caf.apply(root, arguments)
}
module.exports.polyfill = function(object) {
  if (!object) {
    object = root;
  }
  object.requestAnimationFrame = raf
  object.cancelAnimationFrame = caf
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"performance-now":10}],14:[function(require,module,exports){
(function (global){
module.exports =
  global.performance &&
  global.performance.now ? function now() {
    return performance.now()
  } : Date.now || function now() {
    return +new Date
  }

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CPU = function () {
  function CPU() {
    _classCallCheck(this, CPU);

    this.reset();
  }

  _createClass(CPU, [{
    key: "reset",
    value: function reset() {
      this.memory = new Array(256).fill(0);
      this.pc = 0;
      this.registers = {
        general: [{ name: "A", value: 0 }, { name: "B", value: 0 }],
        equality: [{ name: "EQ", value: 0 }, { name: "EM", value: 0 }]

      };
      this.hardwareBus = [];
      this.ops = {
        "opcodes": [{ mnemonic: "NOP", opcode: 0x0, args: 0, action: "wait" }, { mnemonic: "LOAD", opcode: 0x1, args: 1, action: "load" }, { mnemonic: "STORE", opcode: 0x2, args: 1, action: "store" }, { mnemonic: "ADD", opcode: 0x3, args: 1, action: "add" }, { mnemonic: "SUB", opcode: 0x4, args: 1, action: "subtract" }, { mnemonic: "MUL", opcode: 0x5, args: 1, action: "multiply" }, { mnemonic: "DIV", opcode: 0x6, args: 1, action: "divide" }, { mnemonic: "CMP", opcode: 0x7, args: 1, action: "compare" }, { mnemonic: "JMP", opcode: 0x8, args: 0, action: "jumpTo" }, { mnemonic: "JE", opcode: 0x9, args: 0, action: "jumpIfEqual" }, { mnemonic: "JG", opcode: 0xA, args: 0, action: "jumpIfGreater" }, { mnemonic: "JL", opcode: 0xB, args: 0, action: "jumpIfLess" }, { mnemonic: "IN", opcode: 0xC, args: 1, action: "hardwareIn" }, { mnemonic: "OUT", opcode: 0xD, args: 1, action: "hardwareOut" }, { mnemonic: "LIT", opcode: 0xE, args: 1, action: "setRegister" }]
      };

      this.loadFromProgROM();
    }
  }, {
    key: "step",
    value: function step() {
      var opcode = this.memory[this.pc]; //get opcode from memory at program counter 
      var action = this.ops["opcodes"].filter(function (op) {
        return op.opcode == opcode;
      })[0] //look up opcode :TODO currently ignores duplicates and just takes first; should handle as error? 
      .action; //get action


      var args = this.memory.slice(this.pc + 1, this.pc + 1 + this.ops["opcodes"].filter(function (op) {
        return op.opcode == opcode;
      })[0].args);

      this[action].apply(this, args);
    }
  }, {
    key: "getLength",
    value: function getLength() {
      var opcode = this.memory[this.pc]; //get opcode from memory at program counter 
      var length = this.ops["opcodes"].filter(function (op) {
        return op.opcode == opcode;
      })[0] //look up opcode :TODO currently ignores duplicates and just takes first; should handle as error? 
      .args; //get action
      return length;
    }
  }, {
    key: "wait",
    value: function wait() {
      this.pc++;
    }
  }, {
    key: "hardwareOut",
    value: function hardwareOut(address) {

      var command = this.memory[address];
      this.hardwareBus[0] = this.register("B").value;
      this.hardwareBus[1] = this.register("A").value;
      this.hardwareBus[2] = command;

      this.pc += 2;
    }
  }, {
    key: "setRegister",
    value: function setRegister(literal) {
      this.register("A").value = literal;
      this.pc += 2;
    }
  }, {
    key: "add",
    value: function add(address) {
      this.register("A").value = (this.register("A").value + this.memory[address]) % 256;

      this.pc += 2;
    }
  }, {
    key: "subtract",
    value: function subtract(address) {
      var diff = this.register("A").value - this.memory[address];
      if (Math.sign(diff < 0)) {
        diff = 256 + diff;
      }
      this.register("A").value = diff;

      this.pc += 2;
    }
  }, {
    key: "multiply",
    value: function multiply(address) {
      this.register("A").value = this.register("A").value * this.memory[address] % 256;

      this.pc += 2;
    }
  }, {
    key: "divide",
    value: function divide(address) {
      this.register("A").value = Math.floor(this.register("A").value / this.memory[address]);

      this.pc += 2;
    }
  }, {
    key: "compare",
    value: function compare(address) {

      this.registerEQ("EQ").value = Number(this.register("A").value == this.memory[address]);
      if (this.register("A").value > this.memory[address]) {
        this.registerEQ("EM").value = 1;
      } else {
        this.registerEQ("EM").value = 0;
      }

      this.pc += 2;
    }
  }, {
    key: "jumpTo",
    value: function jumpTo() {
      this.pc = this.registers.general.filter(function (register) {
        return register.name == "A";
      })[0].value;
    }
  }, {
    key: "jumpIfEqual",
    value: function jumpIfEqual() {
      if (this.registerEQ("EM").value == 1) {
        this.pc = this.registers.general.filter(function (register) {
          return register.name == "A";
        })[0].value;
      } else {
        this.pc++;
      }
    }
  }, {
    key: "jumpIfGreater",
    value: function jumpIfGreater() {
      if (this.registerEQ("EM").value == 1 && this.registerEQ("EQ").value == 0) {
        this.pc = this.registers.general.filter(function (register) {
          return register.name == "A";
        })[0].value;
      } else {
        this.pc++;
      }
    }
  }, {
    key: "jumpIfLess",
    value: function jumpIfLess() {
      if (this.registerEQ("EM").value == 0 && this.registerEQ("EQ").value == 0) {
        this.pc = this.registers.general.filter(function (register) {
          return register.name == "A";
        })[0].value;
      } else {
        this.pc++;
      }
    }
  }, {
    key: "load",
    value: function load(address) {
      this.register("B").value = this.register("A").value;
      this.register("A").value = this.memory[address];
      this.pc += 2;
    }
  }, {
    key: "store",
    value: function store(address) {

      this.memory[address] = this.register("A").value;
      this.register("A").value = this.register("B").value;
      this.register("B").value = 0x0;

      this.pc += 2;
    }

    //register helper

  }, {
    key: "register",
    value: function register(name) {
      return this.registers.general.filter(function (register) {
        return register.name == name;
      })[0];
    }
  }, {
    key: "registerEQ",
    value: function registerEQ(name) {
      return this.registers.equality.filter(function (register) {
        return register.name == name;
      })[0];
    }

    //load program data

  }, {
    key: "loadFromProgROM",
    value: function loadFromProgROM() {
      //letters
      this.memory[0x7F] = 129;
      this.memory[0x80] = 129;
      this.memory[0x81] = 129;
      this.memory[0x82] = 255;
      this.memory[0x83] = 255;
      this.memory[0x84] = 129;
      this.memory[0x85] = 129;
      this.memory[0x86] = 129;

      this.memory[0x87] = 255;
      this.memory[0x88] = 128;
      this.memory[0x89] = 128;
      this.memory[0x8A] = 255;
      this.memory[0x8B] = 255;
      this.memory[0x8C] = 128;
      this.memory[0x8D] = 128;
      this.memory[0x8E] = 255;

      this.memory[0x8F] = 128;
      this.memory[0x90] = 128;
      this.memory[0x91] = 128;
      this.memory[0x92] = 128;
      this.memory[0x93] = 128;
      this.memory[0x94] = 128;
      this.memory[0x95] = 255;
      this.memory[0x96] = 255;

      this.memory[0x97] = 255;
      this.memory[0x98] = 129;
      this.memory[0x99] = 129;
      this.memory[0x9A] = 129;
      this.memory[0x9B] = 129;
      this.memory[0x9C] = 129;
      this.memory[0x9D] = 255;
      this.memory[0x9E] = 255;

      this.memory[0x9F] = 0;
      this.memory[0xA0] = 0;
      this.memory[0xA1] = 0;
      this.memory[0xA2] = 24;
      this.memory[0xA3] = 24;
      this.memory[0xA4] = 0;
      this.memory[0xA5] = 0;
      this.memory[0xA6] = 0;

      //word index
      this.memory[0xA7] = 0x7F;
      this.memory[0xA8] = 0x9F;
      this.memory[0xA9] = 0x87;
      this.memory[0xAA] = 0x9F;
      this.memory[0xAB] = 0x8F;
      this.memory[0xAC] = 0x9F;
      this.memory[0xAD] = 0x8F;
      this.memory[0xAE] = 0x9F;
      this.memory[0xAF] = 0x97;

      //word end 
      this.memory[0xB0] = 0xA7 + 0x9;

      //prog 
      this.memory[0x0] = 0x0; //to get over 1st step bug

      //set 0xFE to amount to increment 
      this.memory[0x1] = 0xE;
      this.memory[0x2] = 0x1;
      this.memory[0x3] = 0x2;
      this.memory[0x4] = 0xFE;

      //set A to where the word index starts
      this.memory[0x5] = 0xE;
      this.memory[0x6] = 0xA7;

      // store from A into 0XFF
      this.memory[0x7] = 0x2;
      this.memory[0x8] = 0xFF;

      //load from index into A
      this.memory[0x9] = 0x1;
      this.memory[0xA] = 0xFF;
      this.memory[0xB] = 0x2;
      this.memory[0xC] = 0xE;
      this.memory[0xD] = 0x1;
      this.memory[0xE] = 0x00;

      // store from A into 0XFD
      this.memory[0xF] = 0x2;
      this.memory[0x10] = 0xFD;

      //set A to 0x1 ( the map-offset command in the display)
      this.memory[0x11] = 0xE;
      this.memory[0x12] = 0x1;

      //tell 0x0 (the display) to offset to 0xFF, where index is stored
      this.memory[0x13] = 0xD;
      this.memory[0x14] = 0xFD;

      //increment index 

      //load from index into A
      this.memory[0x15] = 0x1;
      this.memory[0x16] = 0xFF;
      this.memory[0x17] = 0x3;
      this.memory[0x18] = 0xFE;
      this.memory[0x19] = 0x2;
      this.memory[0x1A] = 0xFF;

      // load and compare
      this.memory[0x1B] = 0x1;
      this.memory[0x1C] = 0xFF;

      this.memory[0x1D] = 0x7;
      this.memory[0x1E] = 0xB0;

      //jump if less
      this.memory[0x1F] = 0xE;
      this.memory[0x20] = 0x9;

      // if at end, go back to beginning
      this.memory[0x21] = 0xB;
      this.memory[0x22] = 0xE;
      this.memory[0x23] = 0x5;
      this.memory[0x24] = 0x8;
    }
  }]);

  return CPU;
}();

exports.default = CPU;

},{}],16:[function(require,module,exports){
var Hogan = require('hogan.js');
module.exports = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("\n" + i);t.b("		<h2>");t.b(t.v(t.f("header",c,p,0)));t.b("</h2>");t.b("\n");t.b("\n" + i);t.b("		<div class = \"registers\">");t.b("\n" + i);t.b("			<p>PC:");if(t.s(t.f("wrapped",c,p,1),c,p,0,73,87,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(t.v(t.d("mainCpu.pc",c,p,0)));});c.pop();}t.b("</p>");t.b("\n");t.b("\n" + i);if(t.s(t.d("mainCpu.registers.general",c,p,1),c,p,0,138,205,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("				<p>REGISTER ");t.b(t.v(t.f("name",c,p,0)));t.b(":");if(t.s(t.f("wrapped",c,p,1),c,p,0,176,185,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(t.v(t.f("value",c,p,0)));});c.pop();}t.b("</p>");t.b("\n" + i);});c.pop();}if(t.s(t.d("mainCpu.registers.equality",c,p,1),c,p,0,270,337,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("				<p>REGISTER ");t.b(t.v(t.f("name",c,p,0)));t.b(":");if(t.s(t.f("wrapped",c,p,1),c,p,0,308,317,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(t.v(t.f("value",c,p,0)));});c.pop();}t.b("</p>");t.b("\n" + i);});c.pop();}t.b("\n" + i);t.b("		</div>");t.b("\n" + i);t.b("		<div class = \"memory\">");t.b("\n" + i);if(t.s(t.d("mainCpu.memory",c,p,1),c,p,0,426,513,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("			<li contenteditable=\"true\" class = \"memcell\">");if(t.s(t.f("wrapped",c,p,1),c,p,0,487,492,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(t.v(t.d(".",c,p,0)));});c.pop();}t.b("</li>");t.b("\n" + i);});c.pop();}t.b("		</div>");t.b("\n");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "\n\t\t<h2>{{header}}</h2>\n\n\t\t<div class = \"registers\">\n\t\t\t<p>PC:{{#wrapped}}{{mainCpu.pc}}{{/wrapped}}</p>\n\n\t\t\t{{#mainCpu.registers.general}}\n\t\t\t\t<p>REGISTER {{name}}:{{#wrapped}}{{value}}{{/wrapped}}</p>\n\t\t\t{{/mainCpu.registers.general}}\n\t\t\t{{#mainCpu.registers.equality}}\n\t\t\t\t<p>REGISTER {{name}}:{{#wrapped}}{{value}}{{/wrapped}}</p>\n\t\t\t{{/mainCpu.registers.equality}}\n\n\t\t</div>\n\t\t<div class = \"memory\">\n\t\t\t{{#mainCpu.memory}}\n\t\t\t<li contenteditable=\"true\" class = \"memcell\">{{#wrapped}}{{.}}{{/wrapped}}</li>\n\t\t\t{{/mainCpu.memory}}\n\t\t</div>\n\n", Hogan);
},{"hogan.js":7}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Display = function () {
  function Display(cpu) {
    _classCallCheck(this, Display);

    this.memory = new Array(64).fill(0);
    this.rawMemory = new Array(8).fill(0);
    this.address = 0x0;
    this.memoryPointer = 0x7F;
    this.cpu = cpu;
    this.ops = {
      "opcodes": [{ mnemonic: "MAP", opcode: 0x0, args: 1, action: "map_memory" }, { mnemonic: "OFFSET", opcode: 0x1, args: 1, action: "map_memory_offset" }]
    };
  }

  _createClass(Display, [{
    key: "reset",
    value: function reset() {
      this.memory = new Array(64).fill(0);
      this.rawMemory = new Array(8).fill(0);
      this.address = 0x0;
      this.memoryPointer = 0x7F;
      this.draw();
    }
  }, {
    key: "init",
    value: function init(ctx) {
      this.context = ctx;
    }
  }, {
    key: "draw",
    value: function draw() {
      var _this = this;

      this.memory.forEach(function (cell, index) {
        var x = index % 8;
        var y = Math.floor(index / 8);
        _this.context.fillStyle = ["black", "green"][cell];
        _this.context.fillRect(x * 32, y * 16, 32, 16);
      });
    }
  }, {
    key: "step",
    value: function step() {
      var _this2 = this;

      if (this.cpu.hardwareBus[0] == this.address) {
        this.processCommand(this.cpu.hardwareBus[1], this.cpu.hardwareBus[2]);
      }
      this.memory = [];;
      this.rawMemory = this.cpu.memory.slice(this.memoryPointer, this.memoryPointer + 8);
      this.rawMemory.forEach(function (each) {
        var b = Number(each).toString(2).padStart(8, '0');
        b = b.split("");
        b.forEach(function (x) {
          return _this2.memory.push(Number(x));
        });
      });
      this.draw();
    }
  }, {
    key: "processCommand",
    value: function processCommand(opcode, operand) {
      this.cpu.hardwareBus = [];
      var action = this.ops["opcodes"].filter(function (op) {
        return op.opcode == opcode;
      })[0] //look up opcode :TODO currently ignores duplicates and just takes first; should handle as error? 
      .action; //get action

      this[action].apply(this, [operand]);
    }
  }, {
    key: "map_memory_offset",
    value: function map_memory_offset(address) {
      this.memoryPointer = address;
    }
  }]);

  return Display;
}();

exports.default = Display;

},{}],18:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _Hogan = require('Hogan.js');

var _Hogan2 = _interopRequireDefault(_Hogan);

var _template = require('./template.mustache');

var _template2 = _interopRequireDefault(_template);

var _debug_pane_template = require('./debug_pane_template.mustache');

var _debug_pane_template2 = _interopRequireDefault(_debug_pane_template);

var _CPU = require('./CPU');

var _CPU2 = _interopRequireDefault(_CPU);

var _Display = require('./hardware/Display');

var _Display2 = _interopRequireDefault(_Display);

var _rafLoop = require('raf-loop');

var _rafLoop2 = _interopRequireDefault(_rafLoop);

var _styles = require('./styles.css');

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var mainCpu = new _CPU2.default();
var mainDisplay = new _Display2.default(mainCpu);

var testButton = document.createElement("BUTTON");
testButton.innerHTML = "Step";
var resetButton = document.createElement("BUTTON");
resetButton.innerHTML = "Reset";
var runButton = document.createElement("BUTTON");
runButton.innerHTML = "RUN";
var pauseButton = document.createElement("BUTTON");
pauseButton.innerHTML = "PAUSE";

window.lasttime = 0;
var engine = (0, _rafLoop2.default)(function (dt) {
  // delta time in milliseconds
  window.lasttime += dt;
  if (window.lasttime > 100) {
    window.lasttime = 0;
    mainCpu.step();
    mainDisplay.step();
    update_debug();
  }
});

document.addEventListener('DOMContentLoaded', function () {
  startApp();
});

function startApp() {

  document.body.innerHTML = _template2.default.render({});

  document.getElementById("debug_pane").innerHTML = _debug_pane_template2.default.render({ header: 'It Lives!' });

  var c = document.getElementById("display_canvas");
  var ctx = c.getContext("2d");
  mainDisplay.init(ctx);

  resetButton.onclick = function () {

    engine.stop();
    mainCpu.reset();
    mainDisplay.reset();
    update_debug();
  };

  runButton.onclick = function () {
    engine.start();
  };
  pauseButton.onclick = function () {

    engine.stop();
    update_debug();
  };

  testButton.onclick = function () {
    mainCpu.step();
    mainDisplay.step();
    update_debug();
  };
  document.body.getElementsByClassName("registers")[0].appendChild(testButton);
}

function update_debug() {

  document.getElementById("debug_pane").innerHTML = _debug_pane_template2.default.render({ header: 'It Lives!', mainCpu: mainCpu,
    wrapped: function wrapped() {
      return function (tpl) {
        var number = "";
        if (_typeof(this) === 'object') {
          number = Number(_Hogan2.default.compile(tpl).render(this));
        } else {
          number = Number(this);
        }

        var hex = "0x" + number.toString(16).toUpperCase().padStart(2, '0');
        return hex;
      };
    }

  });

  var activeLength = mainCpu.getLength();

  [].concat(_toConsumableArray(document.body.getElementsByClassName('memcell'))).forEach(function (cell, idx) {
    if (idx >= mainCpu.pc && idx <= mainCpu.pc + activeLength) {
      cell.classList.add("active");
    } else {
      cell.classList.remove("active");
    }
  });

  document.body.getElementsByClassName("registers")[0].appendChild(runButton);
  document.body.getElementsByClassName("registers")[0].appendChild(pauseButton);
  document.body.getElementsByClassName("registers")[0].appendChild(testButton);
  document.body.getElementsByClassName("registers")[0].appendChild(resetButton);

  [].concat(_toConsumableArray(document.body.getElementsByClassName("memcell"))).forEach(function (cell, idx) {
    cell.addEventListener("input", function () {
      mainCpu.memory[idx] = Number(cell.innerHTML);
    }, false);
  });
}

},{"./CPU":15,"./debug_pane_template.mustache":16,"./hardware/Display":17,"./styles.css":19,"./template.mustache":20,"Hogan.js":2,"raf-loop":12}],19:[function(require,module,exports){
var css = "body {\n  font-family: monospace;\n}\n.container {\n  display: grid;\n  grid-template-columns: 50% 1fr;\n  grid-gap: 10px;\n}\n.memory {\n  display: grid;\n  grid-template-columns: repeat(16, 1fr);\n  grid-gap: 10px;\n}\n.memory li {\n  float: left;\n  list-style: none;\n}\n.memory .active {\n  background: coral;\n}\ncanvas {\n  width: 256px;\n  height: 256px;\n}\n"; (require("browserify-css").createStyle(css, { "href": "src/styles.css" }, { "insertAt": "bottom" })); module.exports = css;
},{"browserify-css":4}],20:[function(require,module,exports){
var Hogan = require('hogan.js');
module.exports = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class = \"container\">");t.b("\n" + i);t.b("	<div id = \"debug_pane\">");t.b("\n" + i);t.b("	</div> ");t.b("\n" + i);t.b("	<div class = \"display_pane\">");t.b("\n" + i);t.b("		<h2>DISPLAY</h2>");t.b("\n" + i);t.b("		<canvas id = \"display_canvas\"></canvas>");t.b("\n" + i);t.b("	</div>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "<div class = \"container\">\n\t<div id = \"debug_pane\">\n\t</div> \n\t<div class = \"display_pane\">\n\t\t<h2>DISPLAY</h2>\n\t\t<canvas id = \"display_canvas\"></canvas>\n\t</div>\n</div>\n", Hogan);
},{"hogan.js":7}]},{},[18]);
