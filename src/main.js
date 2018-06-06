import hogan from 'Hogan.js'
import template from './template.mustache';
import cpu from './CPU'

const mainCpu = new cpu();

import css from './styles.css';




document.addEventListener('DOMContentLoaded', () => {
  startApp();
});

function startApp() {
  document.body.innerHTML = template.render({ header: 'It Lives!' });
  const testButton = document.createElement("BUTTON");
  testButton.innerHTML = "Step"
  testButton.onclick = function(){mainCpu.step()
  
  
  document.body.innerHTML = template.render({ header: 'It Lives!' , mainCpu:mainCpu, 
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
  console.log(activeLength);

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
  console.log(mainCpu);
  mainCpu.memory[100] = 0x1
  mainCpu.memory[2] = 0x1
  mainCpu.memory[3] = 0xFF
  mainCpu.memory[4] = 0x3
  mainCpu.memory[5] = 100
  mainCpu.memory[6] = 0x2
  mainCpu.memory[7] = 0xFF
  mainCpu.memory[8] = 0xF
  mainCpu.memory[9] = 0x2
  mainCpu.memory[10] = 0x8
}

