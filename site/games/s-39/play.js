'use strict';
(()=>{
 const canvas=document.querySelector('#world'),guide=document.querySelector('#guide'),mute=document.querySelector('#sound'),icons=[...document.querySelectorAll('#path i')];
 const game=Sweets.create();
 window.__GAME__={step:dt=>game.step(dt),getState:game.getState};
 const world=makeWorkshop(canvas,game);
 let context=null,out,noiseBuf,rubGain,filter,potTone,muted=false;
 function unlock(){
   if(!context){
     const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
     context=new AC();out=context.createGain();out.gain.value=muted?0:.72;out.connect(context.destination);
     const n=Math.ceil(context.sampleRate*1.8);noiseBuf=context.createBuffer(1,n,context.sampleRate);const d=noiseBuf.getChannelData(0);
     let previous=0;for(let i=0;i<n;i++){previous=(previous+.19*(Math.random()*2-1))/1.025;d[i]=previous*.8;}
     const noise=context.createBufferSource();noise.buffer=noiseBuf;noise.loop=true;
     filter=context.createBiquadFilter();filter.type='bandpass';filter.Q.value=.84;
     potTone=context.createBiquadFilter();potTone.type='peaking';potTone.frequency.value=470;potTone.Q.value=2.3;potTone.gain.value=5.2;
     rubGain=context.createGain();rubGain.gain.value=0;noise.connect(filter).connect(potTone).connect(rubGain).connect(out);noise.start();
   }
   if(context.state==='suspended')context.resume().catch(()=>{});
 }
 function tone(hz,end,length,gain,type='sine',delay=0){
   if(!context||muted)return;const a=context.createOscillator(),e=context.createGain(),now=context.currentTime+delay;
   a.type=type;a.frequency.setValueAtTime(hz,now);a.frequency.exponentialRampToValueAtTime(end,now+length*.81);
   e.gain.setValueAtTime(.0001,now);e.gain.exponentialRampToValueAtTime(gain,now+.009);e.gain.exponentialRampToValueAtTime(.0001,now+length);
   a.connect(e).connect(out);a.start(now);a.stop(now+length+.02);a.onended=()=>{a.disconnect();e.disconnect();};
 }
 let prevSpeed=0,grainTravel=0;
 function sound(s,dt){
   const events=game.events();if(!context)return;
   rubGain.gain.setTargetAtTime(muted?0:s.scrape*.61,context.currentTime,.055);
   filter.frequency.setTargetAtTime(370+Math.min(3,s.paddleSpeed)*117+(1-s.clarity)*320,context.currentTime,.081);
   if(s.active==='paddle'){
     grainTravel+=dt*s.paddleSpeed;if(grainTravel>.20+.27*s.clarity){grainTravel=0;tone(247+s.paddleX*37,118,.071,.019+s.scrape*.024,'triangle');}
     if(s.paddleSpeed>.8 && prevSpeed<=.8)tone(394,216,.125,.025);
   }prevSpeed=s.paddleSpeed;
   for(const e of events){
     if(e.kind==='drop'){const p=clamp(e.strength,.2,2);tone(265-34*p,68,.30,.21);tone(470,183,.12,.075,'sine',.017);tone(112,74,.32,.095,'sine',.052);}
     if(e.kind==='pierce')tone(186,86,.15,.060);
     if(e.kind==='ceramic'||e.kind==='stage'&&e.stage==='rest'){tone(758,735,.24,.042);tone(1173,1140,.16,.019);}
   }
 }
 function clamp(x,lo,hi){return Math.max(lo,Math.min(hi,x));}
 mute.addEventListener('click',()=>{unlock();muted=!muted;if(out)out.gain.setTargetAtTime(muted?0:.72,context.currentTime,.025);mute.classList.toggle('muted',muted);mute.setAttribute('aria-pressed',String(!muted));});
 let pointer=null,tool='',poke=0;
 canvas.addEventListener('pointerdown',e=>{
   if(pointer!==null)return;unlock();const s=game.read(),name=world.hit(e.clientX,e.clientY,s);
   if(!name){poke=performance.now();return;}
   const xy=world.coords(e.clientX,e.clientY,name);
   if(game.input('down',name,...xy)){pointer=e.pointerId;tool=name;canvas.setPointerCapture(pointer);canvas.style.cursor='grabbing';if(name==='grip'&&s.stage==='thread')tone(127,90,.09,.020);}
 });
 canvas.addEventListener('pointermove',e=>{
   if(e.pointerId===pointer){game.input('move',tool,...world.coords(e.clientX,e.clientY,tool));}
   else if(pointer===null&&e.pointerType==='mouse'){canvas.style.cursor=world.hit(e.clientX,e.clientY,game.read())?'grab':'default';}
 });
 function release(e){if(e.pointerId!==pointer)return;game.input('up',tool);pointer=null;tool='';canvas.style.cursor='';}
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,release);
 window.addEventListener('blur',()=>{game.input('up','');pointer=null;tool='';});
 window.addEventListener('resize',()=>world.resize());
 let previous=performance.now(),lastStage='',stages={thread:0,stir:1,dip:2,drip:2,place:3,rest:3,serve:3,refill:0};
 function hud(s,now){
   if(s.stage!==lastStage){icons.forEach((o,i)=>o.classList.toggle('now',i===stages[s.stage]));lastStage=s.stage;}
   if(s.idle<3.95||s.stage==='refill'||now-poke<700){guide.style.opacity=0;return;}
   const pos=world.guide(s),period=5.4,phase=(s.idle-3.95)%period,progress=clamp((phase-.47)/1.34,0,1),ease=progress*progress*(3-2*progress);
   const motions={thread:[24,-13],stir:[21,10],dip:[-3,28],drip:[10,22],place:[-4,19],rest:[24,-5],serve:[17,-13]},v=motions[s.stage];
   const opacity=Math.min(1,phase/.38)*clamp((2.8-phase)/.6,0,1)*.87;
   guide.style.opacity=String(opacity);guide.style.transform='translate('+clamp(pos.x-4+v[0]*ease,2,world.w()-46)+'px,'+clamp(pos.y-4+v[1]*ease,2,world.h()-62)+'px) rotate('+(-10+7*ease)+'deg)';
 }
 let deferred=false;
 function frame(now){
   let dt=clamp((now-previous)/1000,0,.065);previous=now;game.step(dt);const s=game.read();
   world.update(s);sound(s,dt);world.render();hud(s,now);
   if(!deferred){deferred=true;requestAnimationFrame(()=>setTimeout(()=>world.finishSetup(),0));}
   requestAnimationFrame(frame);
 }
 document.addEventListener('visibilitychange',()=>{previous=performance.now();if(document.hidden){game.input('up','');pointer=null;if(context)rubGain.gain.setTargetAtTime(0,context.currentTime,.035);}});
 const paper=Craft.canvas(96,96),ctx=paper.getContext('2d'),pixels=ctx.createImageData(96,96);
 for(let i=0;i<pixels.data.length;i+=4){let a=Math.random()*255;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=a;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);document.documentElement.style.setProperty('--noise','url('+paper.toDataURL()+')');
 requestAnimationFrame(frame);
})();
