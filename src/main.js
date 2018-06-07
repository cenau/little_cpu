import hogan from 'Hogan.js'
import template from './template.mustache';
import debug_pane_template from './debug_pane_template.mustache';
import cpu from './CPU'
import display from './hardware/Display'

const mainCpu = new cpu();
const mainDisplay = new display(mainCpu);

import css from './styles.css';


  const testButton = document.createElement("BUTTON");
  testButton.innerHTML = "Step"
  const resetButton = document.createElement("BUTTON");
  resetButton.innerHTML = "Reset"


document.addEventListener('DOMContentLoaded', () => {
  startApp();
});

function startApp() {
  document.body.innerHTML = template.render({});
  
  document.getElementById("debug_pane").innerHTML = debug_pane_template.render({ header: 'It Lives!' });
  
  const c=document.getElementById("display_canvas");
  const ctx=c.getContext("2d");
  mainDisplay.init(ctx);


  resetButton.onclick = function(){mainCpu.reset()
  
  mainDisplay.reset() 
  update_debug()
  }

  testButton.onclick = function(){mainCpu.step()
 mainDisplay.step() 
  update_debug()

}
  document.body.getElementsByClassName("registers")[0].appendChild(testButton)



}

function update_debug() {

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
  document.body.getElementsByClassName("registers")[0].appendChild(resetButton);

  [...document.body.getElementsByClassName("memcell")].forEach(function(cell,idx){cell.addEventListener("input", function() {
    mainCpu.memory[idx] = Number(cell.innerHTML);
  }, false);
})
}
