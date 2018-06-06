
class CPU {
  constructor() {
    this.reset();
  }
  reset() {
    this.memory = new Array(4096).fill(0);
    this.pc=0;
    this.registers = {
        general: [
            {name:"A",value:0}
                     
                ],
        equality: [
            {name:"EQ",value:0},
            {name:"EM",value:0},
                 ]

  }
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
            {mnemonic:"JNE",opcode:0xA,args:0,action:"jumpIfNotEqual"}, 
            {mnemonic:"JG",opcode:0xB,args:0,action:"jumpIfGreater"}, 
            {mnemonic:"JL",opcode:0xC,args:0,action:"jumpIfLess"}, 
            {mnemonic:"IN",opcode:0xD,args:1,action:"hardwareIn"}, 
            {mnemonic:"OUT",opcode:0xE,args:1,action:"hardwareOut"}, 
            {mnemonic:"LIT",opcode:0xF,args:1,action:"setRegister"}, 

        ]
    }
  }

  step() {
    let opcode = this.memory[this.pc] //get opcode from memory at program counter 
    let action = this.ops["opcodes"] 
        .filter(op => op.opcode==opcode)[0] //look up opcode :TODO currently ignores duplicates and just takes first; should handle as error? 
        .action //get action

    console.log(opcode, action)
    
    let args = this.memory
        .slice(this.pc+1,
            this.pc+1 +  
                this.ops["opcodes"] 
                .filter(op => op.opcode==opcode)[0]
                .args
              )

  this[action].apply(this,args)
  console.log(this.registers.general[0])
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

  setRegister(literal){
    this.registers.general.filter(register => register.name=="A")[0].value = literal;
    this.pc +=2;
  }
  add(address){
    this.registers.general.filter(register => register.name=="A")[0].value += this.memory[address]
    
    this.pc +=2;
  }

  jumpTo() {
   this.pc = this.registers.general.filter(register => register.name=="A")[0].value
  }

  load(address){
    this.registers.general.filter(register => register.name=="A")[0].value = this.memory[address];
    this.pc +=2;
  }
  store(address){

    this.memory[address] = this.registers.general.filter(register => register.name=="A")[0].value;
    this.registers.general.filter(register => register.name=="A")[0].value = 0; 
    
    this.pc +=2;
  }


}


export default CPU;
