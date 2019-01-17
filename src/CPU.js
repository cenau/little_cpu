
class CPU {
  constructor(rom1) {
    this.progRom = rom1;
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

  this.memory = this.progRom.slice(0)
 

    }
}


export default CPU;
