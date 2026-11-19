(() => {
  'use strict';
  let ctx,bus,rustle,formant,voice,pulse,accum=0;
  function wake(){
    if(!ctx){
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      ctx=new AC();bus=ctx.createGain();bus.gain.value=.43;bus.connect(ctx.destination);
      const buffer=ctx.createBuffer(1,ctx.sampleRate*.72,ctx.sampleRate),data=buffer.getChannelData(0);
      let last=0;for(let i=0;i<data.length;i++){last=(last+.08*(Math.random()*2-1))/1.075;data[i]=last*4;}
      const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
      formant=ctx.createBiquadFilter();formant.type='bandpass';formant.Q.value=1.5;
      rustle=ctx.createGain();rustle.gain.value=0;noise.connect(formant).connect(rustle).connect(bus);noise.start();
      voice=ctx.createOscillator();voice.type='sine';pulse=ctx.createGain();pulse.gain.value=0;
      voice.connect(pulse).connect(bus);voice.start();
    }
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  }
  function quiet(){
    if(!ctx)return;
    for(const g of [pulse,rustle]){g.gain.cancelScheduledValues(ctx.currentTime);g.gain.setTargetAtTime(0,ctx.currentTime,.002);}
    accum=0;
  }
  function update(s,h){
    if(!ctx||ctx.state!=='running')return;
    const t=ctx.currentTime;
    if(!s.pinch||s.sound<.006){quiet();return;}
    const press=s.pressure[1],drag=Math.min(1,s.inputSpeed/12);
    formant.frequency.setTargetAtTime(390+press*370+drag*140,t,.03);
    rustle.gain.setTargetAtTime(.23*s.sound,t,.02);
    accum+=h*(2.1+3.2*s.flow+.7*press);
    if(accum>=1){
      accum%=1;
      const level=.20*Math.min(1,s.sound);
      voice.frequency.cancelScheduledValues(t);voice.frequency.setValueAtTime(184+70*press,t);
      voice.frequency.exponentialRampToValueAtTime(86+30*drag,t+.077);
      pulse.gain.cancelScheduledValues(t);pulse.gain.setValueAtTime(.001,t);
      pulse.gain.linearRampToValueAtTime(level,t+.015);pulse.gain.exponentialRampToValueAtTime(.001,t+.09);
    }
  }
  function note(kind){
    if(!ctx)return;const t=ctx.currentTime;
    const p={berry:[360,175,.085,.14],china:[1030,822,.21,.065],wood:[218,126,.13,.11],lift:[460,540,.085,.048]}[kind];
    if(!p)return;
    const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(p[0],t);o.frequency.exponentialRampToValueAtTime(p[1],t+p[2]);
    g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(p[3],t+.007);
    g.gain.exponentialRampToValueAtTime(.0001,t+p[2]);o.connect(g).connect(bus);o.start(t);o.stop(t+p[2]+.01);
  }
  window.PastrySound={wake,quiet,update,note};
})();
