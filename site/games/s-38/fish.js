/* Both impressions and both skins share this die profile. Coordinates are in stall units. */
(function(root){
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
  // The back, belly, dorsal fin and caudal peduncle are measured independently.
  const profile=[
    [0,.055,.064],[.018,.19,.145],[.047,.33,.25],[.10,.49,.40],[.19,.60,.55],
    [.275,.62,.65],[.313,.80,.66],[.37,.86,.67],[.40,.81,.67],[.44,.84,.66],
    [.48,.77,.64],[.52,.78,.62],[.58,.66,.60],[.64,.54,.49],[.70,.44,.47],
    [.76,.30,.30],[.807,.19,.19],[.845,.22,.22],[.90,.38,.38],[.97,.57,.55],[1,.58,.56]
  ];
  function edges(u){
    let k=1;while(k<profile.length-1 && profile[k][0]<u)k++;
    const [a,b]=[profile[k-1],profile[k]],t=clamp((u-a[0])/(b[0]-a[0])),p=profile[Math.max(0,k-2)],q=profile[Math.min(profile.length-1,k+1)],du=b[0]-a[0];
    const f=i=>(2*t*t*t-3*t*t+1)*a[i]+(t*t*t-2*t*t+t)*(b[i]-p[i])*du/(b[0]-p[0])+(-2*t*t*t+3*t*t)*b[i]+(t*t*t-t*t)*(q[i]-a[i])*du/(q[0]-a[0]);
    return [f(1),f(2)]
  }
  function point(u,v,e=edges(u)){
    return {x:-1.68+3.36*u-.37*smooth(.83,1,u)*(1-Math.pow(Math.abs(v),1.45)),z:v*(v<0?e[0]:e[1])}
  }
  function uv(x,z){let u=clamp((x+1.68)/3.36),v=0;for(let i=0;i<4;i++){const e=edges(u);v=z/(z<0?e[0]:e[1]);u=clamp((x+1.68+.37*smooth(.83,1,u)*(1-Math.pow(clamp(Math.abs(v)),1.45)))/3.36)}return {u,v}}
  const bell=(v,w)=>Math.exp(-(v*v)/(w*w));
  function relief(u,v,x,z){
    const fullness=Math.pow(Math.max(0,1-v*v),.56)*Math.pow(Math.max(0,Math.sin(Math.PI*u)),.40);
    const dome=.085+.30*fullness*(1-.62*smooth(.71,.93,u));
    const ex=x+1.14, ez=z+.15,eye=Math.sqrt(ex*ex+ez*ez);
    let h=.105*bell(eye,.103)+.039*bell(eye-.13,.027)-.034*bell(eye-.177,.022);
    h+=.028*bell(z+.33+(x+1.15)*.14,.029)*bell(x+1.13,.25);
    const cheek=-.81+.19*Math.cos((z+.09)*3.7);
    h+=.050*bell(x-cheek,.045)-.027*bell(x-cheek-.068,.028);
    h-=.057*bell(z-.105+.20*(x+1.59),.023)*bell(x+1.52,.16);
    // Engraved overlapping fans, staggered by a half scale in alternate columns.
    const col=Math.round((x+.46)/.275);
    let sc=0;
    for(let k=col-1;k<=col+1;k++){
      const dx=x-(-.46+k*.275),pitch=.295;
      const dz=z-(Math.round(z/pitch-(k%2)*.5)+(k%2)*.5)*pitch;
      const arc=.095-.15*(dz/.1475)**2;
      sc+=.048*bell(dx-arc,.026)-.025*bell(dx-arc-.037,.028)+.013*bell(dx-.008,.081)*bell(dz,.10)
    }
    const backFin=smooth(.49,.64,-z)*smooth(.24,.34,u)*(1-smooth(.48,.62,u));
    const pec=((x+.50)/.38)**2+((z-.23-.33*(x+.50))/.135)**2;
    const scales=smooth(cheek+.04,cheek+.17,x)*(1-smooth(.69,.815,u))*(1-backFin)*smooth(.82,1.22,pec);
    h+=sc*scales+.059*Math.max(0,1-pec)+.025*bell(pec-.88,.18);
    h+=.016*Math.cos((z-.33*x)*91)*Math.max(0,1-pec);
    h+=backFin*(.026*Math.cos((x+z*.42)*49)-.017);
    const rays=Math.atan2(z,Math.max(.06,x-.84));
    h+=smooth(.79,.90,u)*(.029*Math.cos(rays*24)+.012*Math.cos(rays*47));
    return Math.max(.018,(dome+h)*(.36+.64*smooth(0,.10,1-Math.abs(v)))*(.45+.55*smooth(0,.055,Math.min(u,1-u))))
  }
  function channel(u,x,z){return smooth(.77,.88,u)*(.5+.5*Math.cos(Math.atan2(z,Math.max(.06,x-.84))*24))**2}
  const api={clamp,smooth,edges,point,uv,relief,channel};
  if(typeof module!=='undefined')module.exports=api;else root.Die=api;
})(globalThis);
