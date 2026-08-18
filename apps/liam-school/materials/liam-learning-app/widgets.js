// Lightweight interactive widgets for math activities
(function(){
  function qs(sel,ctx=document){return ctx.querySelector(sel)}
  function qsa(sel,ctx=document){return Array.from((ctx||document).querySelectorAll(sel))}

  // Equation balancer: element should have data-equation="3x+5=20"
  function initEquationBalancers(root=document){
    qsa('[data-widget="equation-balancer"]', root).forEach(container=>{
      if(container.__init) return; container.__init=true;
      const eq = container.dataset.equation||'';
      // parse simple form ax + b = c or x + a = b
      const parts = eq.split('='); if(parts.length!==2){container.textContent='Invalid equation';return}
      const left = parts[0].trim(); const right = parts[1].trim();
      container.innerHTML = `<div class="eq-row"><div class="side left">${left}</div><div class="equals">=</div><div class="side right">${right}</div></div><div class="controls"></div>`;
      const controls = qs('.controls', container);
      ['-5','+5','\u00F7 3','x \u00D7 3','-1','+1'].forEach(op=>{
        const btn=document.createElement('button'); btn.className='op'; btn.textContent=op; btn.addEventListener('click',()=>applyOp(op,container)); controls.appendChild(btn);
      });
    });
  }
  function applyOp(op,container){
    // very simple visual: append operation under both sides and update text simplified for student
    const left=qs('.side.left',container), right=qs('.side.right',container);
    const note=document.createElement('div'); note.className='op-note'; note.textContent=`Applied ${op} to both sides`; container.appendChild(note);
  }

  // Drag-and-drop matching initializer: containers with data-widget="match" and JSON payload in data-pairs
  function initDragMatches(root=document){
    qsa('[data-widget="match"]', root).forEach(container=>{
      if(container.__init) return; container.__init=true;
      let pairs=[]; try{pairs=JSON.parse(container.dataset.pairs||'[]')}catch(e){}
      const left=document.createElement('div'); left.className='match-left'; const right=document.createElement('div'); right.className='match-right';
      container.appendChild(left); container.appendChild(right);
      pairs.forEach((p,i)=>{const a=document.createElement('div');a.className='match-item';a.draggable=true;a.textContent=p.left;a.dataset.id='l'+i;left.appendChild(a);const b=document.createElement('div');b.className='match-slot';b.textContent=p.right;b.dataset.id='r'+i;right.appendChild(b);});
      // simple drag handlers
      left.querySelectorAll('.match-item').forEach(el=>{
        el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',el.dataset.id));
      });
      right.querySelectorAll('.match-slot').forEach(slot=>{
        slot.addEventListener('dragover',e=>e.preventDefault());
        slot.addEventListener('drop',e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');const item=left.querySelector(`[data-id="${id}"]`); if(item){slot.textContent = slot.textContent + ' ← ' + item.textContent; item.remove(); slot.classList.add('matched');}
        });
      });
    });
  }

  // Number line: container with data-widget="number-line" data-value
  function initNumberLines(root=document){
    qsa('[data-widget="number-line"]', root).forEach(container=>{
      if(container.__init) return; container.__init=true;
      const val = Number(container.dataset.value||0);
      container.innerHTML = `<div class="number-line-canvas" style="height:80px;position:relative;background:linear-gradient(#fff,#f7f7f7);border:1px solid #eee"><div class="tick" style="position:absolute;left:10%;top:8px">-5</div><div class="tick" style="position:absolute;left:50%;top:8px">0</div><div class="tick" style="position:absolute;left:90%;top:8px">5</div><div class="dot" style="position:absolute;left:50%;top:40px;background:#176f5b;border-radius:50%;width:18px;height:18px;transform:translate(-50%,-50%)"></div></div>`;
      const dot = qs('.dot', container); dot.draggable=true; dot.addEventListener('dragstart', (e)=>{e.dataTransfer.setData('text/plain','dot');});
    });
  }

  // Simple graph plot: data-widget="plot" data-m data-b
  function initPlots(root=document){
    qsa('[data-widget="plot"]', root).forEach(container=>{
      if(container.__init) return; container.__init=true;
      const m=Number(container.dataset.m||1), b=Number(container.dataset.b||0);
      const cvs=document.createElement('canvas'); cvs.width=360; cvs.height=200; container.appendChild(cvs);
      const ctx=cvs.getContext('2d'); ctx.clearRect(0,0,cvs.width,cvs.height); ctx.strokeStyle='#ddd'; for(let x=0;x<=cvs.width;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,cvs.height);ctx.stroke()} for(let y=0;y<=cvs.height;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cvs.width,y);ctx.stroke()} ctx.strokeStyle='#176f5b'; ctx.beginPath(); for(let px=0;px<=cvs.width;px++){let xx=(px-cvs.width/2)/20; let yy = m*xx + b; let py = cvs.height/2 - yy*20; if(px===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.stroke();
    });
  }

  function initAll(root=document){ initEquationBalancers(root); initDragMatches(root); initNumberLines(root); initPlots(root); }

  // auto-init on DOMContentLoaded and when new content is added
  document.addEventListener('DOMContentLoaded', ()=>initAll(document));
  // expose for manual init after dynamic render
  window.LiamWidgets = {initAll, initEquationBalancers, initDragMatches, initNumberLines, initPlots};
})();
