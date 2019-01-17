(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CPU =
/*#__PURE__*/
function () {
  function CPU(rom1) {
    _classCallCheck(this, CPU);

    this.progRom = rom1;
    this.reset();
  }

  _createClass(CPU, [{
    key: "reset",
    value: function reset() {
      this.memory = new Array(256).fill(0);
      this.pc = 0;
      this.registers = {
        general: [{
          name: "A",
          value: 0
        }, {
          name: "B",
          value: 0
        }],
        equality: [{
          name: "EQ",
          value: 0
        }, {
          name: "EM",
          value: 0
        }]
      };
      this.hardwareBus = [];
      this.ops = {
        "opcodes": [{
          mnemonic: "NOP",
          opcode: 0x0,
          args: 0,
          action: "wait"
        }, {
          mnemonic: "LOAD",
          opcode: 0x1,
          args: 1,
          action: "load"
        }, {
          mnemonic: "STORE",
          opcode: 0x2,
          args: 1,
          action: "store"
        }, {
          mnemonic: "ADD",
          opcode: 0x3,
          args: 1,
          action: "add"
        }, {
          mnemonic: "SUB",
          opcode: 0x4,
          args: 1,
          action: "subtract"
        }, {
          mnemonic: "MUL",
          opcode: 0x5,
          args: 1,
          action: "multiply"
        }, {
          mnemonic: "DIV",
          opcode: 0x6,
          args: 1,
          action: "divide"
        }, {
          mnemonic: "CMP",
          opcode: 0x7,
          args: 1,
          action: "compare"
        }, {
          mnemonic: "JMP",
          opcode: 0x8,
          args: 0,
          action: "jumpTo"
        }, {
          mnemonic: "JE",
          opcode: 0x9,
          args: 0,
          action: "jumpIfEqual"
        }, {
          mnemonic: "JG",
          opcode: 0xA,
          args: 0,
          action: "jumpIfGreater"
        }, {
          mnemonic: "JL",
          opcode: 0xB,
          args: 0,
          action: "jumpIfLess"
        }, {
          mnemonic: "IN",
          opcode: 0xC,
          args: 1,
          action: "hardwareIn"
        }, {
          mnemonic: "OUT",
          opcode: 0xD,
          args: 1,
          action: "hardwareOut"
        }, {
          mnemonic: "LIT",
          opcode: 0xE,
          args: 1,
          action: "setRegister"
        }]
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
    } //register helper

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
    } //load program data

  }, {
    key: "loadFromProgROM",
    value: function loadFromProgROM() {
      this.memory = this.progRom.slice(0);
    }
  }]);

  return CPU;
}();

var _default = CPU;
exports.default = _default;

},{}]},{},[1]);
