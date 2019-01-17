class OUTtester {
  constructor(cpu){
    this.address = 0x10
    this.cpu = cpu
    this.ops  = {
        "opcodes":[
            {mnemonic:"PRINT",opcode:0x0,args:1,action:"print_debug"},
        ]
    }
  }
 
  reset(){
    this.address = 0x10
    console.log("OUTTEST RESET")
  }


  step(){
    if (this.cpu.hardwareBus[0] == this.address) {
      this.processCommand(this.cpu.hardwareBus[1], this.cpu.hardwareBus[2])
    }
  }
  

   processCommand(opcode,operand){
    this.cpu.hardwareBus = [];
    let action = this.ops["opcodes"] 
        .filter(op => op.opcode==opcode)[0] //look up opcode :TODO currently ignores duplicates and just takes first; should handle as error? 
        .action //get action

  this[action].apply(this,[operand])
    
   }

 //ops 
  print_debug(operand) {
    console.log("OUTT:" ,operand);
  
   }

}

export default OUTtester;
