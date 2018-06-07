import hogan from 'Hogan.js'
import template from './template.mustache';
import debug_pane_template from './debug_pane_template.mustache';
import cpu from './CPU'
import display from './hardware/Display'

const mainCpu = new cpu();
const mainDisplay = new display(mainCpu);

import css from './styles.css';




document.addEventListener('DOMContentLoaded', () => {
  startApp();
});

function startApp() {
  document.body.innerHTML = template.render({});
  
  document.getElementById("debug_pane").innerHTML = debug_pane_template.render({ header: 'It Lives!' });
  
  const c=document.getElementById("display_canvas");
  const ctx=c.getContext("2d");
  mainDisplay.init(ctx);

  const testButton = document.createElement("BUTTON");
  testButton.innerHTML = "Step"
  testButton.onclick = function(){mainCpu.step()
 mainDisplay.step() 
  
   document.getElementById("debug_pane").innerHTML= debug_pane_template.render({ header: 'It Lives!' , mainCpu:mainCpu, 
    wrapped: function() {
    return function(tpl) {
      let number = ""
      if (typeof this==='object') {
        number = Number(hogan.compile(tpl).render(this))
      }
      else {
        number = Number(this)
      }

      const hex = "0x" + (number.toString(16).toUpperCase().padStart(2,'0'))
      return hex
    }
  }
  
  });
  

 const activeLength = mainCpu.getLength();

 [...document.body.getElementsByClassName('memcell')].forEach(function(cell,idx){
    if (idx >= mainCpu.pc && idx <= mainCpu.pc + activeLength){
     cell.classList.add("active")
    }
   else {
     cell.classList.remove("active")
   }
 })

  document.body.getElementsByClassName("registers")[0].appendChild(testButton)
}
  document.body.getElementsByClassName("registers")[0].appendChild(testButton)


  //letters
  mainCpu.memory[0x7F] = 0b10000001
  mainCpu.memory[0x80] = 0b10000001
  mainCpu.memory[0x81] = 0b10000001
  mainCpu.memory[0x82] = 0b11111111
  mainCpu.memory[0x83] = 0b11111111
  mainCpu.memory[0x84] = 0b10000001
  mainCpu.memory[0x85] = 0b10000001
  mainCpu.memory[0x86] = 0b10000001


  mainCpu.memory[0x8F] = 0b11111111
  mainCpu.memory[0x90] = 0b00011000
  mainCpu.memory[0x91] = 0b00011000
  mainCpu.memory[0x92] = 0b00011000
  mainCpu.memory[0x93] = 0b00011000
  mainCpu.memory[0x94] = 0b00011000
  mainCpu.memory[0x95] = 0b00011000
  mainCpu.memory[0x96] = 0b11111111

  //prog 
  mainCpu.memory[0x0] = 0x0 //to get over 1st step bug
  
  //set A to where the second letter starts
  mainCpu.memory[0x1] = 0xF 
  mainCpu.memory[0x2] = 0x8F

  // store 0x8F from A into 0XFF
  mainCpu.memory[0x3] = 0x2
  mainCpu.memory[0x4] = 0xFF

  //set A to 0x1 ( the map-offset command in the display)
  mainCpu.memory[0x5] = 0xF
  mainCpu.memory[0x6] = 0x1

  //tell 0x0 (the display) to offset to 0xFF, where 0x8F is stored
  mainCpu.memory[0x7] = 0xE
  mainCpu.memory[0x8] = 0xFF

}

