import hogan from 'Hogan.js'
import template from './template.mustache';
import debug_pane_template from './debug_pane_template.mustache';
import cpu from './CPU'
import display from './hardware/Display'
import outT from './hardware/OUTtester'

import loop from 'raf-loop'

import testRom from './testRom'




const mainCpu = new cpu(testRom);

const mainDisplay = new display(mainCpu);
const outT1 = new outT(mainCpu);
console.log(outT1)
import css from './styles.css';

  const testButton = document.createElement("BUTTON");
  testButton.innerHTML = "Step"
  const resetButton = document.createElement("BUTTON");
  resetButton.innerHTML = "Reset"
  const runButton = document.createElement("BUTTON");
  runButton.innerHTML = "RUN"
  const pauseButton = document.createElement("BUTTON");
  pauseButton.innerHTML = "PAUSE"

    window.lasttime =0;
  const engine = loop(function(dt) {
    // delta time in milliseconds
    window.lasttime += dt
    if ( window.lasttime > 100){
     window.lasttime = 0
      mainCpu.step();
     mainDisplay.step();
      outT1.step();
    //bit stupid, but make sure to add things to step further down as well... or make this more sensible (ie iterate array of things to step at both places...)
    update_debug()
    }
  })

document.addEventListener('DOMContentLoaded', () => {
  startApp();
});

function startApp() {



  document.body.innerHTML = template.render({});
  
  document.getElementById("debug_pane").innerHTML = debug_pane_template.render({ header: 'It Lives!' });
  
  const c=document.getElementById("display_canvas");
  const ctx=c.getContext("2d");
  mainDisplay.init(ctx);


  resetButton.onclick = function(){
  
  engine.stop();
  mainCpu.reset()
  mainDisplay.reset() 
  update_debug()
  }

  runButton.onclick = function(){
    engine.start();  
  }
  pauseButton.onclick = function(){
    
    engine.stop();
    update_debug()
  }

  testButton.onclick = function(){mainCpu.step()
 mainDisplay.step() 
outT1.step()
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

  document.body.getElementsByClassName("registers")[0].appendChild(runButton)
  document.body.getElementsByClassName("registers")[0].appendChild(pauseButton)
  document.body.getElementsByClassName("registers")[0].appendChild(testButton)
  document.body.getElementsByClassName("registers")[0].appendChild(resetButton);

  [...document.body.getElementsByClassName("memcell")].forEach(function(cell,idx){cell.addEventListener("input", function() {
    mainCpu.memory[idx] = Number(cell.innerHTML);
  }, false);
})
}
