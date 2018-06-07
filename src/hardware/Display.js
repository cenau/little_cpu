class Display {
  constructor(cpu){
    this.memory = new Array(64).fill(0);
    this.rawMemory = new Array(8).fill(0);
    this.address = 0x0
    this.memoryPointer = 0x7F
    this.cpu = cpu
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
    this.memory = [];  ;
    this.rawMemory = this.cpu.memory.slice(this.memoryPointer,this.memoryPointer+8)
    this.rawMemory.forEach(each => {
      let b = Number(each).toString(2).padStart(8,'0')
      b = b.split("")
      b.forEach(x => this.memory.push(Number(x)))})
    this.draw()
  }
  




}

export default Display;
