
class CPU {
  constructor() {
    this.reset();
  }
  reset() {
    this.memory = new Array(256).fill(0);
    this.pc=0;
    this.registers = {
        general: [
            {name:"A",value:0},
            {name:"B",value:0},
                     
                ],
        equality: [
            {name:"EQ",value:0},
            {name:"EM",value:0},
                 ]

  }
    this.hardwareBus = []
    this.ops  = {
        "opcodes":[
            {mnemonic:"NOP",opcode:0x0,args:0,action:"wait"}, 
            {mnemonic:"LOAD",opcode:0x1,args:1,action:"load"}, 
            {mnemonic:"STORE",opcode:0x2,args:1,action:"store"}, 
            {mnemonic:"ADD",opcode:0x3,args:1,action:"add"}, 
            {mnemonic:"SUB",opcode:0x4,args:1,action:"subtract"}, 
            {mnemonic:"MUL",opcode:0x5,args:1,action:"multiply"}, 
            {mnemonic:"DIV",opcode:0x6,args:1,action:"divide"}, 
            {mnemonic:"CMP",opcode:0x7,args:1,action:"compare"}, 
            {mnemonic:"JMP",opcode:0x8,args:0,action:"jumpTo"}, 
            {mnemonic:"JE",opcode:0x9,args:0,action:"jumpIfEqual"}, 
            {mnemonic:"JG",opcode:0xA,args:0,action:"jumpIfGreater"}, 
            {mnemonic:"JL",opcode:0xB,args:0,action:"jumpIfLess"}, 
            {mnemonic:"IN",opcode:0xC,args:1,action:"hardwareIn"}, 
            {mnemonic:"OUT",opcode:0xD,args:1,action:"hardwareOut"}, 
            {mnemonic:"LIT",opcode:0xE,args:1,action:"setRegister"}, 

        ]
    }

    this.loadFromProgROM();
  }

  step() {
    let opcode = this.memory[this.pc] //get opcode from memory at program counter 
    let action = this.ops["opcodes"] 
        .filter(op => op.opcode==opcode)[0] //look up opcode :TODO currently ignores duplicates and just takes first; should handle as error? 
        .action //get action

    
    let args = this.memory
        .slice(this.pc+1,
            this.pc+1 +  
                this.ops["opcodes"] 
                .filter(op => op.opcode==opcode)[0]
                .args
              )

  this[action].apply(this,args)
  }


  getLength() {
    let opcode = this.memory[this.pc] //get opcode from memory at program counter 
    let length = this.ops["opcodes"] 
        .filter(op => op.opcode==opcode)[0] //look up opcode :TODO currently ignores duplicates and just takes first; should handle as error? 
        .args //get action
    return length
  }
  wait() {
    this.pc++;
  }

  
  hardwareOut(address){

    let command = this.memory[address]
    this.hardwareBus[0] = this.register("B").value
    this.hardwareBus[1] = this.register("A").value
    this.hardwareBus[2] = command
    
    this.pc +=2;
  }

  setRegister(literal){
    this.register("A").value = literal;
    this.pc +=2;
  }
  add(address){
    this.register("A").value = (this.register("A").value + this.memory[address]) % 256 
   

    this.pc +=2;
  }
  
  subtract(address){
    let diff  = (this.register("A").value - this.memory[address])  
    if (Math.sign(diff < 0)){
      diff =256 + diff
    }
    this.register("A").value = diff;

    this.pc +=2;
  }
  
  multiply(address){
    this.register("A").value = (this.register("A").value * this.memory[address]) % 256 
   

    this.pc +=2;
  }
  divide(address){
    this.register("A").value = Math.floor(this.register("A").value / this.memory[address]) 
   

    this.pc +=2;
  }
  compare(address){
 
    this.registerEQ("EQ").value = Number(this.register("A").value == this.memory[address])
    if (this.register("A").value > this.memory[address]){
      this.registerEQ("EM").value = 1;
    }
    else {
      this.registerEQ("EM").value = 0;
    }

    this.pc +=2;
  }

  jumpTo() {
   this.pc = this.registers.general.filter(register => register.name=="A")[0].value
  }
  
  jumpIfEqual() {
   if (this.registerEQ("EM").value == 1){
    this.pc = this.registers.general.filter(register => register.name=="A")[0].value
    }
    else {
      this.pc ++;
    }
  }
  jumpIfGreater() {
   if (this.registerEQ("EM").value == 1 && this.registerEQ("EQ").value == 0){
    this.pc = this.registers.general.filter(register => register.name=="A")[0].value
    }
    else {
      this.pc ++;
    }
  }
  jumpIfLess() {
   if (this.registerEQ("EM").value == 0 && this.registerEQ("EQ").value == 0){
    this.pc = this.registers.general.filter(register => register.name=="A")[0].value
    }
    else {
      this.pc ++;
    }
  }

  load(address){
    this.register("B").value = this.register("A").value
    this.register("A").value = this.memory[address];
    this.pc +=2;
  }
  store(address){

    this.memory[address] = this.register("A").value;
    this.register("A").value = this.register("B").value;
    this.register("B").value = 0x0;
    
    this.pc +=2;
  }

//register helper
    register(name){
      return this.registers.general.filter(register => register.name==name)[0] 
}
    registerEQ(name){
      return this.registers.equality.filter(register => register.name==name)[0] 
}

//load program data
    loadFromProgROM(){


      //hello prog 
      //letters
  this.memory[0x7F] = 0b10000001
  this.memory[0x80] = 0b10000001
  this.memory[0x81] = 0b10000001
  this.memory[0x82] = 0b11111111
  this.memory[0x83] = 0b11111111
  this.memory[0x84] = 0b10000001
  this.memory[0x85] = 0b10000001
  this.memory[0x86] = 0b10000001


  this.memory[0x87] = 0b11111111
  this.memory[0x88] = 0b10000000
  this.memory[0x89] = 0b10000000
  this.memory[0x8A] = 0b11111111
  this.memory[0x8B] = 0b11111111
  this.memory[0x8C] = 0b10000000
  this.memory[0x8D] = 0b10000000
  this.memory[0x8E] = 0b11111111
  
  this.memory[0x8F] = 0b10000000
  this.memory[0x90] = 0b10000000
  this.memory[0x91] = 0b10000000
  this.memory[0x92] = 0b10000000
  this.memory[0x93] = 0b10000000
  this.memory[0x94] = 0b10000000
  this.memory[0x95] = 0b11111111
  this.memory[0x96] = 0b11111111
  
  this.memory[0x97] = 0b11111111
  this.memory[0x98] = 0b10000001
  this.memory[0x99] = 0b10000001
  this.memory[0x9A] = 0b10000001
  this.memory[0x9B] = 0b10000001
  this.memory[0x9C] = 0b10000001
  this.memory[0x9D] = 0b11111111
  this.memory[0x9E] = 0b11111111
  
  this.memory[0x9F] = 0b00000000
  this.memory[0xA0] = 0b00000000
  this.memory[0xA1] = 0b00000000
  this.memory[0xA2] = 0b00011000
  this.memory[0xA3] = 0b00011000
  this.memory[0xA4] = 0b00000000
  this.memory[0xA5] = 0b00000000
  this.memory[0xA6] = 0b00000000

  //word index
  this.memory[0xA7] = 0x7F 
  this.memory[0xA8] = 0x9F 
  this.memory[0xA9] = 0x87 
  this.memory[0xAA] = 0x9F 
  this.memory[0xAB] = 0x8F 
  this.memory[0xAC] = 0x9F 
  this.memory[0xAD] = 0x8F 
  this.memory[0xAE] = 0x9F 
  this.memory[0xAF] = 0x97

  //word end 
  this.memory[0xB0] = 0xA7 + 0x9 


  //prog 
  this.memory[0x0] = 0x0 //to get over 1st step bug

  //set 0xFE to amount to increment 
  this.memory[0x1] = 0xE 
  this.memory[0x2] = 0x1
  this.memory[0x3] = 0x2
  this.memory[0x4] = 0xFE


  //set A to where the word index starts
  this.memory[0x5] = 0xE 
  this.memory[0x6] = 0xA7

  // store from A into 0XFF
  this.memory[0x7] = 0x2
  this.memory[0x8] = 0xFF
  
  //load from index into A
  this.memory[0x9] = 0x1 
  this.memory[0xA] = 0xFF
  this.memory[0xB] = 0x2 
  this.memory[0xC] = 0xE
  this.memory[0xD] = 0x1
  this.memory[0xE] = 0x00

  
  // store from A into 0XFD
  this.memory[0xF] = 0x2
  this.memory[0x10] = 0xFD

  //set A to 0x1 ( the map-offset command in the display)
  this.memory[0x11] = 0xE
  this.memory[0x12] = 0x1

  //tell 0x0 (the display) to offset to 0xFF, where index is stored
  this.memory[0x13] = 0xD
  this.memory[0x14] = 0xFD

  //increment index 
  
  //load from index into A
  this.memory[0x15] = 0x1
  this.memory[0x16] = 0xFF
  this.memory[0x17] = 0x3
  this.memory[0x18] = 0xFE
  this.memory[0x19] = 0x2
  this.memory[0x1A] = 0xFF


  // load and compare
  this.memory[0x1B] = 0x1
  this.memory[0x1C] = 0xFF
  
  this.memory[0x1D] = 0x7
  this.memory[0x1E] = 0xB0
  
  //jump if less
  this.memory[0x1F] = 0xE 
  this.memory[0x20] = 0x9
  
  // if at end, go back to beginning
  this.memory[0x21] = 0xB
  this.memory[0x22] = 0xE 
  this.memory[0x23] = 0x5 
  this.memory[0x24] = 0x8



/*
  //OUT test prog 
  this.memory[0x2] = 0xE
  this.memory[0x3] = 0x1

  this.memory[0x4] = 0x2 
  this.memory[0x5] = 0x0
  
  this.memory[0x6] = 0x1
  this.memory[0x7] = 0x1

  this.memory[0x8] = 0x3 
  this.memory[0xA] = 0x0

  this.memory[0xB] = 0x2 
  this.memory[0xC] = 0x1

  this.memory[0xD] = 0xE
  this.memory[0xE] = 0x10

  this.memory[0xF] = 0x1 
  this.memory[0x10] = 0xFF
  
  this.memory[0x11] = 0xD
  this.memory[0x12] = 0x1
  
  this.memory[0x13] = 0xE
  this.memory[0x14] = 0x5
  this.memory[0x15] = 0x8
*/

    }
}


export default CPU;
