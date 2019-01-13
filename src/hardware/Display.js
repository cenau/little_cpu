class Display {
  constructor(cpu){
    this.memory = new Array(64).fill(0);
    this.rawMemory = new Array(8).fill(0);
    this.address = 0x0
    this.memoryPointer = 0x7F
    this.cpu = cpu
    this.ops  = {
        "opcodes":[
            {mnemonic:"MAP",opcode:0x0,args:1,action:"map_memory"},
            {mnemonic:"OFFSET",opcode:0x1,args:1,action:"map_memory_offset"},
        ]
    }
  }
 
  reset(){
    this.memory = new Array(64).fill(0);
    this.rawMemory = new Array(8).fill(0);
    this.address = 0x0
    this.memoryPointer = 0x7F
    this.draw()

  }
  init(ctx){
    this.context = ctx;
  }

  draw(){
    this.memory.forEach((cell, index) => {
      let x = index % 8;
      let y = Math.floor(index / 8);
      this.context.fillStyle = ["black","green"][cell]
      this.context.fillRect(x * 32,y * 16,32,16);
  });
  }

  step(){
    if (this.cpu.hardwareBus[0] == this.address) {
      this.processCommand(this.cpu.hardwareBus[1], this.cpu.hardwareBus[2])
    }
    this.memory = [];  ;
    this.rawMemory = this.cpu.memory.slice(this.memoryPointer,this.memoryPointer+8)
    this.rawMemory.forEach(each => {
      let b = Number(each).toString(2).padStart(8,'0')
      b = b.split("")
      b.forEach(x => this.memory.push(Number(x)))})
    this.draw()
  }
  

   processCommand(opcode,operand){
    this.cpu.hardwareBus = [];
    let action = this.ops["opcodes"] 
        .filter(op => op.opcode==opcode)[0] //look up opcode :TODO currently ignores duplicates and just takes first; should handle as error? 
        .action //get action

  this[action].apply(this,[operand])
    
   }


  map_memory_offset(address) {
    this.memoryPointer = address;
  
   }

}

export default Display;
