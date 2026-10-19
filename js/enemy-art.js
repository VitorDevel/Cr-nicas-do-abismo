/* Directional, four-pose procedural sprite rigs for the enemy roster.
   The atlas references guide the silhouettes, material contrast and readable poses. */
(() => {
  const catalog = () => window.ABISMO_PARTIAL_CATALOG || {};
  const TAU = Math.PI * 2;
  const ARCH = {
    slime:'blob', lodo:'blob', wolf:'quad', stag:'quad', snowstalker:'quad', shockhound:'quad', bear:'quad', boar:'quad', boglurker:'quad',
    bat:'flyer', harpy:'flyer', thunderhawk:'flyer', spider:'bug', sandscorpion:'bug', scarab:'bug', crab:'bug',
    thornling:'plant', dryad:'plant', mossbeast:'plant', plagueshroom:'plant', flamewisp:'spirit',
    guardian:'golem', icegolem:'golem', lavagolem:'golem', crystalguard:'golem',
    skeleton:'human', cultist:'human', shaman:'human', mage:'human', brute:'human', miner:'human', duneraider:'human', graveknight:'human', pyromancer:'human',
    wraith:'spirit', stormwisp:'spirit', astraleye:'spirit', voidwalker:'spirit', frostling:'elemental', emberling:'elemental', prismite:'elemental', shardmage:'elemental',
    mimic:'mimic', dummy:'dummy', hyena:'quad', direboar:'quad', crystalspider:'bug', bonearcher:'human', mirewitch:'human', ironbeetle:'bug'
  };
  const palette = (id, type) => {
    const src = catalog()[id] || {}, colors = src.pal || [];
    return { base: type.color || colors[0] || '#9b8db8', shadow: colors[1] || '#242331', accent: colors[2] || '#f1d48b' };
  };
  function shade(hex, target, p) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return target;
    const a=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)), b=[1,3,5].map(i=>parseInt(target.slice(i,i+2),16));
    return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*p).toString(16).padStart(2,'0')).join('');
  }
  function pose(e, now) {
    const moving=e.state==='chase'||e.state==='attack'||Math.hypot(e.kx||0,e.ky||0)>20;
    const rate=e.state==='attack'?14:e.state==='windup'?8:moving?9:4;
    const frame=((Math.floor((now*rate+(e.bob||0))*1.05)%4)+4)%4;
    return { frame, gait: moving ? [0,1,0,-1][frame] : 0, bob: moving ? [0,-1.5,0,1][frame] : Math.sin(now*2+(e.bob||0))*.65,
      wind:e.state==='windup'?Math.max(0,1-(e.timer||0)/(e.maxTimer||1)):0, hit:e.hit||0 };
  }
  function stroke(g, color='#11121a', width=1.25) { g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.lineCap='round'; }
  function outline(g, fill, border='#171821', width=1.35) { g.fillStyle=fill;stroke(g,border,width);g.fill();g.stroke(); }
  function glow(g,x,y,r,color,alpha=.28) { g.save();g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,color+'cc');gr.addColorStop(1,color+'00');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();g.restore(); }
  function eye(g,x,y,r,color='#fff0a1') { glow(g,x,y,r*3,color,.2);g.fillStyle=color;g.beginPath();g.ellipse(x,y,r*1.3,r,0,0,TAU);g.fill();g.fillStyle='#17131b';g.beginPath();g.ellipse(x,y,r*.32,r*.86,0,0,TAU);g.fill(); }
  function limb(g,x1,y1,x2,y2,x3,y3,w,col,dark,phase=0) {
    g.save();stroke(g,dark,w+2);g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.lineTo(x3,y3);g.stroke();stroke(g,col,w);g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.lineTo(x3,y3);g.stroke();
    g.fillStyle=shade(col,'#ffffff',.24);g.beginPath();g.arc(x2,y2,w*.36,0,TAU);g.fill();g.restore();
  }
  function drawBlob(g,e,p,c) {
    const squash=1+Math.sin((p.frame/4)*TAU)*.07*(e.state==='idle'?.45:1), y=p.bob+4;
    g.save();g.translate(0,y);g.scale(1/squash,squash);
    g.beginPath();g.moveTo(-15,7);g.quadraticCurveTo(-18,-5,-10,-10);g.quadraticCurveTo(-7,-18,0,-14);g.quadraticCurveTo(11,-18,13,-9);g.quadraticCurveTo(19,-3,15,7);g.quadraticCurveTo(7,12,0,11);g.quadraticCurveTo(-9,13,-15,7);g.closePath();outline(g,shade(c.base,'#ffffff',.12),c.shadow,1.5);
    g.fillStyle=shade(c.base,'#ffffff',.38);g.beginPath();g.ellipse(-5,-8,4,2,-.35,0,TAU);g.fill();
    g.globalAlpha=.55;stroke(g,c.accent,1.3);g.beginPath();g.moveTo(-10,3);g.quadraticCurveTo(-3,7,2,3);g.quadraticCurveTo(8,7,12,2);g.stroke();g.globalAlpha=1;
    eye(g,-5,-1,1.6,'#f5ffe3');eye(g,5,-1,1.6,'#f5ffe3');
    g.fillStyle='#181d23';g.beginPath();g.moveTo(-4,5);g.quadraticCurveTo(0,7,4,5);g.strokeStyle='#181d23';g.lineWidth=1;g.stroke();
    g.save();g.globalCompositeOperation='lighter';g.fillStyle=c.accent;g.globalAlpha=.4;g.beginPath();g.arc(0,-4,2.2,0,TAU);g.fill();g.restore();g.restore();
  }
  function drawQuad(g,e,p,c,id) {
    const {gait}=p, pace=e.state==='attack'?1.5:1;
    // Four articulated legs with knee plates and paw silhouettes.
    for(const side of [-1,1]) for(const row of [-1,1]) {
      const x=side*(row<0?9:11), hipY=row<0?-1:5, swing=gait*4*pace*(row===side?1:-1);
      limb(g,x,hipY,x+side*1.2,hipY+6,x+swing,hipY+12,2.6,c.base,c.shadow,swing);
      g.fillStyle=shade(c.shadow,'#ffffff',.2);g.beginPath();g.ellipse(x+swing+1,hipY+12,3.1,1.6,.08,0,TAU);g.fill();
      for(let claw=0;claw<2;claw++){g.strokeStyle='#e4d7ba';g.lineWidth=.55;g.beginPath();g.moveTo(x+swing+claw,hipY+12);g.lineTo(x+swing+claw+1,hipY+13);g.stroke();}
    }
    g.beginPath();g.moveTo(-13,0);g.quadraticCurveTo(-17,-8,-9,-11);g.quadraticCurveTo(0,-15,12,-9);g.quadraticCurveTo(17,-5,14,3);g.quadraticCurveTo(4,8,-10,6);g.closePath();outline(g,shade(c.base,'#10121a',.2),c.shadow,1.7);
    // Shoulder fur, flank plates and back ridge give each beast a readable profile.
    g.fillStyle=shade(c.base,'#ffffff',.28);for(let i=0;i<5;i++){const x=-10+i*5;g.beginPath();g.moveTo(x,-8);g.lineTo(x+2,-13-(i%2)*2);g.lineTo(x+4,-7);g.closePath();g.fill();}
    for(let i=0;i<3;i++){g.fillStyle=i%2?shade(c.base,'#000000',.22):c.accent;g.beginPath();g.ellipse(-4+i*4,1,2.3,1.1,-.2,0,TAU);g.fill();}
    // Seat the head into the shoulders so quadrupeds no longer look disconnected.
    // The head belongs on the leading shoulder, not in the torso center.
    const headY=-8+p.bob*.25;
    g.save();g.translate(7,0);
    g.beginPath();g.moveTo(-8,headY+1);g.lineTo(-9,headY-7);g.lineTo(-4,headY-12);g.lineTo(3,headY-11);g.lineTo(8,headY-5);g.lineTo(12,headY-2);g.lineTo(7,headY+2);g.closePath();outline(g,shade(c.base,'#ffffff',.08),c.shadow,1.35);
    g.fillStyle=shade(c.base,'#17151a',.42);g.beginPath();g.moveTo(5,headY-2);g.lineTo(14,headY+1);g.lineTo(7,headY+4);g.closePath();g.fill();
    if(id==='stag'){for(const s of [-1,1]){stroke(g,c.accent,1.8);g.beginPath();g.moveTo(s*4,headY-9);g.lineTo(s*6,headY-16);g.lineTo(s*10,headY-20);g.moveTo(s*6,headY-16);g.lineTo(s*2,headY-20);g.moveTo(s*8,headY-18);g.lineTo(s*12,headY-22);g.stroke();}}
    else {g.fillStyle=c.shadow;for(const s of [-1,1]){g.beginPath();g.moveTo(s*5,headY-8);g.lineTo(s*7,headY-15);g.lineTo(s*10,headY-7);g.closePath();g.fill();}}
    eye(g,3,headY-5,1.3,id==='snowstalker'?'#9de8ff':id==='shockhound'?'#ffe36d':'#ffdf88');
    g.fillStyle='#f6e8c8';g.beginPath();g.moveTo(7,headY+1);g.lineTo(6,headY+5);g.lineTo(9,headY+2);g.fill();
    g.restore();
    stroke(g,shade(c.base,'#000000',.25),2);g.beginPath();g.moveTo(-12,1);g.quadraticCurveTo(-20,4+Math.sin(p.frame*1.57)*3,-18,10+gait*2);g.stroke();
  }
  function drawHumanoid(g,e,p,c,id) {
    const gait=p.gait*3, attack=p.wind, robe=['mage','cultist','shaman','pyromancer','wraith','voidwalker','witchdoc','necro','spectre'].includes(id);
    // Boots/legs and moving sleeves are drawn separately so the four walk poses read clearly.
    for(const s of [-1,1]){const dx=(s<0?1:-1)*gait;limb(g,s*4,6,s*4+dx,11,s*4+dx,15,2.5,robe?c.shadow:c.base,c.shadow);g.fillStyle='#20222c';g.beginPath();g.roundRect(s*4+dx-2,13,5,3,1);g.fill();}
    const body=robe?shade(c.base,'#111421',.26):shade(c.base,'#17151e',.08);
    g.beginPath();g.moveTo(-6,-12);g.lineTo(6,-12);g.lineTo(9,5);g.lineTo(13,13);g.lineTo(-13,13);g.lineTo(-9,5);g.closePath();outline(g,body,c.shadow,1.6);
    g.fillStyle=shade(c.base,'#ffffff',.25);g.beginPath();g.moveTo(-4,-10);g.lineTo(0,-8);g.lineTo(4,-10);g.lineTo(3,4);g.lineTo(0,8);g.lineTo(-3,4);g.closePath();g.fill();
    // Cross-belts, segmented armor and class color trim.
    stroke(g,c.accent,1.25);g.beginPath();g.moveTo(-7,-8);g.lineTo(6,3);g.moveTo(7,-8);g.lineTo(-6,3);g.stroke();
    g.fillStyle=c.accent;g.fillRect(-8,5,16,1.8);g.fillStyle='#eed18a';g.beginPath();g.roundRect(-1.5,4,3,4,1);g.fill();
    for(const s of [-1,1]){
      g.fillStyle=shade(c.base,'#ffffff',.23);g.beginPath();g.moveTo(s*6,-11);g.lineTo(s*11,-8);g.lineTo(s*9,-3);g.lineTo(s*4,-5);g.closePath();g.fill();g.strokeStyle=c.shadow;g.lineWidth=1;g.stroke();
      limb(g,s*8,-8,s*11+gait*.6,-2,s*11+gait,3+attack*2,3.2,c.base,c.shadow);
      g.fillStyle='#d8ac7d';g.beginPath();g.arc(s*11+gait,3+attack*2,2.2,0,TAU);g.fill();
    }
    g.fillStyle=id==='skeleton'?'#ddd7c6':shade(c.base,'#e8cda7',.38);g.beginPath();g.ellipse(0,-17,6.2,7,0,0,TAU);g.fill();g.strokeStyle=c.shadow;g.lineWidth=1.2;g.stroke();
    if(id==='skeleton'){
      g.fillStyle='#201f24';g.beginPath();g.ellipse(-2.2,-18,1.6,2.1,0,0,TAU);g.ellipse(2.2,-18,1.6,2.1,0,0,TAU);g.fill();
      stroke(g,'#eee5cf',1);g.beginPath();g.moveTo(-4,-12);g.lineTo(0,-10);g.lineTo(4,-12);for(let i=-2;i<=2;i++){g.moveTo(i*1.4,-11);g.lineTo(i*1.4,-8);}g.stroke();
      g.strokeStyle='#ece4cf';g.lineWidth=1.5;for(let y=-7;y<2;y+=2.5){g.beginPath();g.moveTo(-5,y);g.quadraticCurveTo(0,y+1,5,y);g.stroke();}
    } else {
      g.fillStyle=c.shadow;g.beginPath();g.moveTo(-7,-20);g.lineTo(-4,-27);g.lineTo(0,-24);g.lineTo(5,-28);g.lineTo(8,-18);g.closePath();g.fill();
      eye(g,-2,-17,1,'#ffdb85');eye(g,2,-17,1,'#ffdb85');
      g.fillStyle=robe?c.accent:'#b9c5d0';g.fillRect(-6,-11,12,1.5);
    }
    if(['goblin','orc','troll'].includes(id)){
      const ear=id==='goblin'?9:12;
      for(const s of [-1,1]){g.beginPath();g.moveTo(s*4,-18);g.lineTo(s*(ear+3),-23);g.lineTo(s*6,-14);g.closePath();outline(g,shade(c.base,'#ffffff',.08),c.shadow,1);}
      if(id==='troll'){g.fillStyle=c.accent;for(const s of [-1,1]){g.beginPath();g.moveTo(s*5,-10);g.lineTo(s*7,-4);g.lineTo(s*3,-7);g.closePath();g.fill();}}
    }
    if(id==='abyss_knight'){
      g.fillStyle=shade(c.base,'#11111d',.32);g.beginPath();g.moveTo(-8,-11);g.lineTo(-13,-1);g.lineTo(-9,10);g.lineTo(0,14);g.lineTo(10,9);g.lineTo(13,-2);g.lineTo(8,-12);g.closePath();g.fill();g.strokeStyle=c.accent;g.lineWidth=1;g.stroke();
      g.fillStyle=c.accent;g.fillRect(-4,-18,8,2);g.fillRect(-2,-15,4,1);
    }
    // Every humanoid carries a distinct tool silhouette instead of a blank arm.
    ctxWeapon(g,id,c,p,attack);
  }
  function ctxWeapon(g,id,c,p,attack){
    const lift=attack*8+p.gait*1.5;
    if(id==='shadow_archer'){
      g.save();g.translate(13,0);g.strokeStyle='#382a4a';g.lineWidth=2.5;g.beginPath();g.moveTo(0,-18-lift);g.quadraticCurveTo(12,-5-lift,0,8-lift);g.stroke();g.strokeStyle=c.accent;g.lineWidth=1;g.beginPath();g.moveTo(0,-18-lift);g.lineTo(0,8-lift);g.moveTo(-1,-5-lift);g.lineTo(8,-5-lift);g.stroke();g.restore();return;
    }
    if(['mage','shaman','pyromancer','cultist'].includes(id)){g.strokeStyle='#68482d';g.lineWidth=2.5;g.beginPath();g.moveTo(12,7);g.lineTo(15,-17-lift);g.stroke();g.strokeStyle=c.accent;g.lineWidth=1;g.beginPath();g.arc(15,-19-lift,4,0,TAU);g.stroke();glow(g,15,-19-lift,11,c.base);}
    else {g.strokeStyle='#66472c';g.lineWidth=2.6;g.beginPath();g.moveTo(12,7);g.lineTo(18,-13-lift);g.stroke();g.fillStyle='#d6d9df';g.beginPath();g.moveTo(18,-13-lift);g.lineTo(24,-22-lift);g.lineTo(22,-10-lift);g.closePath();g.fill();g.strokeStyle=c.accent;g.lineWidth=1;g.beginPath();g.moveTo(18,-13-lift);g.lineTo(23,-21-lift);g.stroke();}
  }
  function drawFlyer(g,e,p,c,id){
    const flap=Math.sin((p.frame/4)*TAU)*7+(e.state==='windup'?p.wind*4:0);
    for(const s of [-1,1]){
      g.save();g.translate(s*4,-8);g.rotate(s*flap*.025);
      g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(s*12,-18-flap,s*26,-15-flap*.5);g.quadraticCurveTo(s*22,-2,s*13,6);g.lineTo(s*6,3);g.closePath();outline(g,id==='bat'?'#47355f':shade(c.base,'#171521',.18),c.shadow,1.4);
      stroke(g,shade(c.base,'#ffffff',.45),.8);g.beginPath();g.moveTo(2,1);g.quadraticCurveTo(s*14,-8-flap,s*24,-14-flap*.5);g.moveTo(s*8,2);g.lineTo(s*18,-1);g.moveTo(s*12,4);g.lineTo(s*21,-4);g.stroke();g.restore();
    }
    g.beginPath();g.moveTo(-5,-12);g.lineTo(-4,-19);g.lineTo(0,-23);g.lineTo(5,-18);g.lineTo(7,-8);g.lineTo(5,7);g.lineTo(-5,7);g.closePath();outline(g,c.base,c.shadow,1.5);
    g.fillStyle=shade(c.base,'#ffffff',.26);g.beginPath();g.moveTo(-3,-8);g.lineTo(0,-13);g.lineTo(4,-8);g.lineTo(3,5);g.lineTo(-3,5);g.closePath();g.fill();
    for(const s of [-1,1]){eye(g,s*2.6,-16,1.15,id==='harpy'?'#ffd876':'#ff6c89');g.strokeStyle='#ead6aa';g.lineWidth=1;g.beginPath();g.moveTo(s*2,5);g.lineTo(s*4,11);g.lineTo(s*6,8);g.stroke();}
    if(id==='harpy'||id==='thunderhawk'){g.fillStyle='#e6cfa0';g.beginPath();g.moveTo(-2,-20);g.lineTo(0,-27);g.lineTo(2,-20);g.closePath();g.fill();}
    if(id==='phoenix'){
      for(const s of [-1,1])for(let i=0;i<4;i++){const x=s*(5+i*3),f=p.frame;g.beginPath();g.moveTo(s*3,1);g.quadraticCurveTo(x,-5-i*2,x+s*2,-16-i*2+Math.sin(f*Math.PI/2+i)*2);g.strokeStyle=i%2?'#ffd86c':'#ff7440';g.lineWidth=2.3-i*.25;g.stroke();}
      for(let i=0;i<3;i++){g.beginPath();g.moveTo((i-1)*3,6);g.quadraticCurveTo((i-1)*5,14+Math.sin(p.frame*1.57+i)*2,(i-1)*4,20);g.strokeStyle=i===1?'#ffe98a':'#f35c38';g.lineWidth=2.2;g.stroke();}
      glow(g,0,-4,17,'#ff8d37',.28);
    }
  }
  function drawBug(g,e,p,c,id){
    const legs=id==='spider'?4:3;
    for(const s of [-1,1])for(let i=0;i<legs;i++){
      const y=-2+i*4, swing=p.gait*(i%2?2.5:-2.5), endX=s*(17+i*1.5), kneeX=s*(10+i);
      stroke(g,c.shadow,2.6);g.beginPath();g.moveTo(s*5,y);g.lineTo(kneeX+swing,y+3);g.lineTo(endX+swing,y+8);g.stroke();
      stroke(g,shade(c.base,'#ffffff',.24),1.1);g.beginPath();g.moveTo(kneeX+swing,y+3);g.lineTo(endX+swing,y+8);g.stroke();
    }
    g.beginPath();g.ellipse(0,5,9,8,.08,0,TAU);outline(g,shade(c.base,'#000000',.15),c.shadow,1.5);
    for(let i=0;i<4;i++){g.strokeStyle=shade(c.base,'#ffffff',.25);g.lineWidth=.85;g.beginPath();g.arc(0,5,7-i*.9,.25,Math.PI-.25);g.stroke();}
    g.beginPath();g.ellipse(0,-6,7.5,6.5,0,0,TAU);outline(g,c.base,c.shadow,1.3);
    g.beginPath();g.moveTo(-5,-9);g.lineTo(-4,-17);g.lineTo(0,-20);g.lineTo(5,-16);g.lineTo(6,-9);g.closePath();outline(g,shade(c.base,'#ffffff',.12),c.shadow,1.2);
    for(const s of [-1,1]){eye(g,s*3.2,-15,1.2,id==='scarab'?'#f2d86b':'#ff7884');stroke(g,c.shadow,1.3);g.beginPath();g.moveTo(s*2,-9);g.quadraticCurveTo(s*5,-5,s*1.5,-3);g.stroke();g.strokeStyle=c.accent;g.lineWidth=.8;g.beginPath();g.moveTo(s*2,-19);g.quadraticCurveTo(s*8,-26,s*7,-28);g.stroke();}
    if(id==='sandscorpion'){stroke(g,c.base,3);g.beginPath();g.moveTo(0,9);g.quadraticCurveTo(12,14,13,3);g.quadraticCurveTo(14,-8,10,-15);g.stroke();g.fillStyle=c.accent;g.beginPath();g.moveTo(10,-15);g.lineTo(7,-19);g.lineTo(13,-18);g.closePath();g.fill();}
  }
  function drawPlant(g,e,p,c,id){
    const sway=Math.sin(p.frame*Math.PI/2)*2.2;
    for(const s of [-1,1]){limb(g,s*5,0,s*(10+sway),-4,s*(13+sway),-10,3,shade(c.base,'#102116',.15),c.shadow);g.fillStyle=shade(c.base,'#ffffff',.18);g.beginPath();g.ellipse(s*(12+sway),-11,5,2.5,s*-.6,0,TAU);g.fill();g.strokeStyle=c.shadow;g.lineWidth=.8;g.stroke();g.strokeStyle=c.accent;g.lineWidth=.7;g.beginPath();g.moveTo(s*(9+sway),-11);g.lineTo(s*(14+sway),-11);g.stroke();}
    g.beginPath();g.moveTo(-7,11);g.quadraticCurveTo(-11,1,-6,-10);g.lineTo(0,-15);g.lineTo(7,-10);g.quadraticCurveTo(11,2,7,11);g.closePath();outline(g,shade(c.base,'#143524',.1),c.shadow,1.7);
    for(let i=0;i<5;i++){const y=-8+i*3.7;g.fillStyle=i%2?shade(c.base,'#ffffff',.2):c.accent;g.beginPath();g.moveTo(0,y);g.quadraticCurveTo(-8,y-4,-9,y+1);g.quadraticCurveTo(-4,y+4,0,y+2);g.quadraticCurveTo(7,y-3,9,y+1);g.quadraticCurveTo(4,y+4,0,y+2);g.fill();}
    if(id==='plagueshroom'){g.fillStyle='#e8d49f';g.beginPath();g.ellipse(0,-17,10,5,0,Math.PI,TAU);g.lineTo(6,-13);g.quadraticCurveTo(0,-11,-6,-13);g.closePath();g.fill();g.strokeStyle=c.shadow;g.lineWidth=1;g.stroke();for(const x of [-5,0,5]){g.fillStyle='#fae8c0';g.beginPath();g.arc(x,-18,1.2,0,TAU);g.fill();}}
    else {for(const s of [-1,1]){g.strokeStyle=c.accent;g.lineWidth=2;g.beginPath();g.moveTo(s*2,-12);g.lineTo(s*4,-19);g.lineTo(s*2,-24);g.moveTo(s*4,-19);g.lineTo(s*8,-23);g.stroke();}eye(g,-2,-13,1,'#f7ffa7');eye(g,2,-13,1,'#f7ffa7');}
    for(const s of [-1,1]){g.fillStyle=c.shadow;g.beginPath();g.moveTo(s*7,-4);g.lineTo(s*12,-8);g.lineTo(s*8,-1);g.closePath();g.fill();}
  }
  function drawGolem(g,e,p,c,id){
    const gait=p.gait*2.4, y=p.bob;
    for(const s of [-1,1]){limb(g,s*6,5,s*8+gait,10,s*8+gait,14,4,shade(c.base,'#161824',.2),c.shadow);g.fillStyle=shade(c.base,'#000000',.28);g.beginPath();g.roundRect(s*8+gait-4,12,8,4,1);g.fill();}
    for(const s of [-1,1]){g.beginPath();g.moveTo(s*6,-9);g.lineTo(s*13,-12);g.lineTo(s*17,-6);g.lineTo(s*15,2);g.lineTo(s*7,1);g.closePath();outline(g,shade(c.base,'#ffffff',.12),c.shadow,1.7);}
    g.beginPath();g.moveTo(-8,-12);g.lineTo(-5,-17);g.lineTo(4,-17);g.lineTo(9,-11);g.lineTo(10,4);g.lineTo(5,10);g.lineTo(-6,9);g.lineTo(-10,3);g.closePath();outline(g,shade(c.base,'#10121a',.08),c.shadow,1.8);
    g.fillStyle=shade(c.base,'#ffffff',.26);g.beginPath();g.moveTo(-5,-12);g.lineTo(0,-16);g.lineTo(6,-11);g.lineTo(4,-5);g.lineTo(-6,-5);g.closePath();g.fill();
    stroke(g,shade(c.base,'#11121a',.45),1.2);g.beginPath();g.moveTo(-7,-2);g.lineTo(-2,1);g.lineTo(-5,5);g.moveTo(6,-4);g.lineTo(2,0);g.lineTo(5,4);g.stroke();
    glow(g,0,-2,11,c.accent,.35);g.fillStyle=c.accent;g.beginPath();g.moveTo(0,-6);g.lineTo(4,-2);g.lineTo(0,3);g.lineTo(-4,-2);g.closePath();g.fill();g.strokeStyle='#f4f0d5';g.lineWidth=.8;g.stroke();
    if(id.includes('crystal')||id==='prismite'){for(let s of [-1,1]){g.fillStyle=c.accent;g.beginPath();g.moveTo(s*7,-11);g.lineTo(s*10,-20);g.lineTo(s*13,-11);g.closePath();g.fill();g.stroke();}}
    if(id==='ancestral_guardian'||id==='forest_lord'){
      for(const s of [-1,1]){g.strokeStyle='#6f9d4e';g.lineWidth=2;g.beginPath();g.moveTo(s*5,-14);g.quadraticCurveTo(s*10,-23,s*14,-23);g.moveTo(s*9,-17);g.lineTo(s*14,-14);g.stroke();g.fillStyle='#a8df72';g.beginPath();g.ellipse(s*14,-23,3.5,1.7,s*.7,0,TAU);g.fill();}
      g.strokeStyle='#a7d77a';g.lineWidth=1;g.beginPath();g.moveTo(-5,-2);g.lineTo(0,2);g.lineTo(5,-3);g.stroke();
    }
    for(const s of [-1,1])eye(g,s*3,-11,1.1,c.accent);
  }
  function drawSerpent(g,e,p,c,id){
    const wave=p.frame*.95;
    stroke(g,c.shadow,10);g.beginPath();g.moveTo(0,12);g.bezierCurveTo(-12+Math.sin(wave)*3,5,12+Math.sin(wave+1)*4,-2,0,-9);g.stroke();
    stroke(g,c.base,7);g.beginPath();g.moveTo(0,12);g.bezierCurveTo(-12+Math.sin(wave)*3,5,12+Math.sin(wave+1)*4,-2,0,-9);g.stroke();
    for(let i=0;i<6;i++){const q=i/6,x=Math.sin(wave+q*4)*7,y=9-q*16;g.fillStyle=i%2?shade(c.base,'#ffffff',.15):c.accent;g.beginPath();g.ellipse(x,y,2.4,1.2,q,0,TAU);g.fill();}
    g.beginPath();g.moveTo(-6,-10);g.lineTo(-5,-17);g.lineTo(0,-21);g.lineTo(5,-17);g.lineTo(6,-10);g.lineTo(0,-6);g.closePath();outline(g,c.base,c.shadow,1.4);
    eye(g,-2.5,-16,1.1,'#ffe981');eye(g,2.5,-16,1.1,'#ffe981');g.fillStyle='#fff0ce';for(const s of [-1,1]){g.beginPath();g.moveTo(s*2,-11);g.lineTo(s*3,-6);g.lineTo(s*4,-11);g.fill();}
    g.strokeStyle='#ff6f8a';g.lineWidth=1;g.beginPath();g.moveTo(0,-8);g.lineTo(Math.sin(wave)*3,-3);g.stroke();
    if(id==='leviathan')for(const s of [-1,1]){g.fillStyle=shade(c.base,'#ffffff',.4);g.beginPath();g.moveTo(s*4,-7);g.lineTo(s*13,-15+Math.sin(wave+s)*2);g.lineTo(s*9,-3);g.closePath();g.fill();g.strokeStyle=c.shadow;g.lineWidth=.8;g.stroke();g.strokeStyle=c.accent;g.lineWidth=1.2;g.beginPath();g.moveTo(s*5,-17);g.quadraticCurveTo(s*11,-24,s*13,-18);g.stroke();}
  }
  function drawElemental(g,e,p,c,id){
    const pulse=1+Math.sin(p.frame*Math.PI/2)*.08;
    g.save();g.translate(0,p.bob);glow(g,0,-4,23,c.base,.36);
    if(id==='ice_elemental'){
      for(let i=0;i<8;i++){const a=i*TAU/8+phaseOf(p),inner=8,outer=17+(i%2)*5;g.beginPath();g.moveTo(Math.cos(a)*inner,Math.sin(a)*inner-4);g.lineTo(Math.cos(a-.16)*outer,Math.sin(a-.16)*outer-4);g.lineTo(Math.cos(a+.12)*outer*.7,Math.sin(a+.12)*outer*.7-4);g.closePath();outline(g,i%2?'#d8fbff':c.base,c.shadow,1);}
    }else if(id==='lightning_elemental'){
      for(let i=0;i<4;i++){const a=i*TAU/4+p.frame*.3;g.strokeStyle=c.accent;g.lineWidth=2;g.beginPath();g.moveTo(Math.cos(a)*5,Math.sin(a)*5-4);g.lineTo(Math.cos(a)*13,Math.sin(a)*13-4);g.lineTo(Math.cos(a+.3)*18,Math.sin(a+.3)*18-4);g.stroke();}
    }else{
      for(let i=0;i<5;i++){const a=i*TAU/5+p.frame*.14;g.beginPath();g.moveTo(Math.cos(a)*5,-4+Math.sin(a)*5);g.quadraticCurveTo(Math.cos(a)*12,-14+Math.sin(a)*15,Math.cos(a+.12)*13,-25+(i%2)*4);g.quadraticCurveTo(Math.cos(a)*9,-18+Math.sin(a)*10,Math.cos(a)*5,-4+Math.sin(a)*5);g.closePath();outline(g,id==='poison_elemental'?shade(c.base,'#d9ff6b',.18):shade(c.base,'#ffe1a0',.1),c.shadow,1.3);}
    }
    g.beginPath();g.ellipse(0,-4,8*pulse,11/pulse,0,0,TAU);outline(g,c.base,c.shadow,1.5);glow(g,0,-5,12,c.accent,.4);eye(g,-2.4,-7,1.2,'#fff4bd');eye(g,2.4,-7,1.2,'#fff4bd');g.restore();
  }
  function phaseOf(p){return p.frame*Math.PI/2}
  function drawDragon(g,e,p,c,id){
    const flap=Math.sin(p.frame*Math.PI/2)*5, tail=Math.sin(p.frame*Math.PI/2+1)*3;
    for(const s of [-1,1]){
      g.beginPath();g.moveTo(s*3,-8);g.quadraticCurveTo(s*19,-26-flap,s*28,-19-flap);g.lineTo(s*22,-10);g.lineTo(s*29,-3);g.lineTo(s*13,-5);g.lineTo(s*7,1);g.closePath();outline(g,shade(c.base,'#11121a',.13),c.shadow,1.5);
      stroke(g,c.accent,1);g.beginPath();g.moveTo(s*6,-8);g.lineTo(s*21,-17-flap);g.lineTo(s*24,-7);g.moveTo(s*12,-5);g.lineTo(s*21,-8);g.stroke();
    }
    stroke(g,c.shadow,5);g.beginPath();g.moveTo(-5,7);g.quadraticCurveTo(-15,13+tail,-21,9+tail);g.stroke();stroke(g,c.base,3);g.beginPath();g.moveTo(-5,7);g.quadraticCurveTo(-15,13+tail,-21,9+tail);g.stroke();
    g.beginPath();g.moveTo(-12,-8);g.lineTo(-8,-13);g.lineTo(4,-13);g.lineTo(11,-8);g.lineTo(10,8);g.lineTo(0,12);g.lineTo(-10,7);g.closePath();outline(g,c.base,c.shadow,1.7);
    for(let i=0;i<5;i++){const x=-7+i*3.5;g.fillStyle=i%2?shade(c.base,'#ffffff',.22):c.accent;g.beginPath();g.moveTo(x,-9);g.lineTo(x+1.5,-16-(i%2)*3);g.lineTo(x+3,-8);g.closePath();g.fill();}
    g.beginPath();g.moveTo(4,-12);g.lineTo(8,-19);g.lineTo(13,-20);g.lineTo(18,-16);g.lineTo(19,-10);g.lineTo(12,-7);g.lineTo(7,-8);g.closePath();outline(g,c.base,c.shadow,1.4);
    for(const s of [-1,1]){g.fillStyle=c.accent;g.beginPath();g.moveTo(s*11,-17);g.lineTo(s*13,-24);g.lineTo(s*15,-16);g.closePath();g.fill();}
    eye(g,14,-15,1.3,id==='infernal_dragon'?'#fff2a0':'#a9f6ff');g.fillStyle='#f1dfc2';g.beginPath();g.moveTo(17,-10);g.lineTo(23,-8);g.lineTo(17,-6);g.closePath();g.fill();
    if(id==='infernal_dragon'){glow(g,21,-7,9,'#ff622d',.45);g.fillStyle='#ff8e42';g.beginPath();g.moveTo(20,-8);g.quadraticCurveTo(29,-11,31,-6);g.quadraticCurveTo(25,-5,20,-5);g.fill();}
  }
  function drawSpirit(g,e,p,c,id){
    const float=Math.sin(p.frame*Math.PI/2)*2.3;
    g.save();g.translate(0,float);
    g.beginPath();g.moveTo(-7,-21);g.quadraticCurveTo(0,-27,7,-21);g.lineTo(9,-9);g.lineTo(13,7);g.lineTo(7,4);g.lineTo(3,12);g.lineTo(0,6);g.lineTo(-5,12);g.lineTo(-7,5);g.lineTo(-13,8);g.lineTo(-9,-7);g.closePath();outline(g,shade(c.base,'#11192b',.22),c.shadow,1.5);
    g.globalCompositeOperation='lighter';g.strokeStyle=c.accent;g.globalAlpha=.8;g.lineWidth=1;g.beginPath();g.arc(0,-8,10,.2,5.4);g.stroke();g.globalAlpha=1;g.globalCompositeOperation='source-over';
    g.fillStyle='#17152b';g.beginPath();g.ellipse(0,-17,5,6,0,0,TAU);g.fill();eye(g,-2.1,-17,1.2,c.accent);eye(g,2.1,-17,1.2,c.accent);
    for(const s of [-1,1]){stroke(g,c.base,2.5);g.beginPath();g.moveTo(s*6,-7);g.quadraticCurveTo(s*15,-1+float,s*12,9);g.stroke();}
    g.restore();
  }
  function drawMimic(g,e,p,c){
    const jaw=e.state==='windup'?1:e.state==='recover'?.24:0, hop=p.bob;
    g.save();g.translate(0,hop);
    g.fillStyle='#432c25';g.beginPath();g.roundRect(-17,-2,34,22,3);g.fill();g.strokeStyle='#1c1720';g.lineWidth=1.6;g.stroke();
    g.fillStyle='#9c542d';g.beginPath();g.roundRect(-14,0,28,17,2);g.fill();g.stroke();
    g.fillStyle='#d3a84e';g.fillRect(-16,-1,4,19);g.fillRect(12,-1,4,19);g.fillRect(-16,5,32,3);
    g.save();g.translate(0,-3);g.rotate(-jaw*.85);g.fillStyle='#513528';g.beginPath();g.roundRect(-17,-11,34,12,3);g.fill();g.strokeStyle='#1c1720';g.lineWidth=1.6;g.stroke();g.fillStyle='#c17940';g.fillRect(-13,-9,26,5);g.strokeStyle='#f1d17a';g.lineWidth=2;g.strokeRect(-14,-10,28,9);g.fillStyle='#f5d985';g.beginPath();g.arc(0,-5,2.3,0,TAU);g.fill();g.restore();
    if(jaw>.15){g.fillStyle='#210e1b';g.beginPath();g.ellipse(0,4,12,5,0,0,TAU);g.fill();for(let i=0;i<7;i++){const x=-10+i*3.3;g.fillStyle='#f2e6cd';g.beginPath();g.moveTo(x,0);g.lineTo(x+1.6,5+Math.sin(i)*1.3);g.lineTo(x+3.2,0);g.fill();}g.strokeStyle='#d95368';g.lineWidth=2;g.beginPath();g.moveTo(0,4);g.quadraticCurveTo(8,12+Math.sin(p.frame*1.5)*2,3,17);g.stroke();}
    else{eye(g,-6,-9,1.5,'#ffe278');eye(g,6,-9,1.5,'#ffe278');}
    g.restore();
  }

  function drawBoss(g,e,p,c,id,now){
    const r=e.t.r||36, size=Math.max(1.12,Math.min(1.72,r/34)), g0=p.gait*2.4, phase=p.frame*Math.PI/2;
    g.save();g.scale(size,size);g.translate(0,p.bob*.7);glow(g,0,-7,48,c.base,.22);
    const body=(fill, path)=>{g.beginPath();path();g.closePath();outline(g,fill,c.shadow,2.1);};
    const eyePair=(color=c.accent,y=-19)=>{eye(g,-5,y,2.2,color);eye(g,5,y,2.2,color);};
    switch(id){
      case 'mimic':case 'mimic_boss':
        g.save();g.scale(1.55,1.45);drawMimic(g,e,p,c);g.restore();
        for(const s of [-1,1]){g.fillStyle='#6f4328';g.beginPath();g.ellipse(s*24,8,5,7,s*.18,0,TAU);g.fill();g.strokeStyle=c.shadow;g.lineWidth=1.5;g.stroke();}
        break;
      case 'arquimago':
        g.save();g.translate(0,p.bob-4);g.globalCompositeOperation='lighter';g.strokeStyle=c.accent;g.lineWidth=1.5;
        g.beginPath();g.ellipse(0,-11,31,12,phase*.25,0,TAU);g.stroke();g.beginPath();g.ellipse(0,-11,22,27,-phase*.2,0,TAU);g.stroke();g.restore();
        g.beginPath();g.moveTo(-14,-19);g.lineTo(-22,15);g.lineTo(22,15);g.lineTo(14,-19);g.closePath();outline(g,shade(c.base,'#13172f',.25),c.shadow,2);
        g.beginPath();g.moveTo(-12,-19);g.lineTo(0,-38);g.lineTo(12,-19);g.closePath();outline(g,shade(c.base,'#ffffff',.2),c.shadow,1.8);
        g.fillStyle='#111329';g.beginPath();g.arc(0,-17,8,0,TAU);g.fill();eyePair('#d8f1ff',-18);
        g.strokeStyle='#846236';g.lineWidth=3;g.beginPath();g.moveTo(19,10);g.lineTo(21,-25);g.stroke();glow(g,21,-29,15,c.accent,.52);g.fillStyle=c.accent;g.beginPath();g.arc(21,-29,5,0,TAU);g.fill();break;
      case 'red_guardian':case 'titan':
        for(const s of [-1,1]){limb(g,s*10,-2,s*17+g0,8,s*19+g0,16,7,shade(c.base,'#17191e',.15),c.shadow);g.beginPath();g.arc(s*19+g0,15,5,0,TAU);outline(g,shade(c.base,'#ffffff',.12),c.shadow,1.4);}
        g.beginPath();g.moveTo(-16,-19);g.lineTo(-12,-31);g.lineTo(0,-36);g.lineTo(12,-31);g.lineTo(17,-17);g.lineTo(15,11);g.lineTo(0,19);g.lineTo(-15,11);g.closePath();outline(g,shade(c.base,'#201722',.15),c.shadow,2.4);
        for(const s of [-1,1]){g.fillStyle=shade(c.base,'#ffffff',.18);g.beginPath();g.moveTo(s*10,-16);g.lineTo(s*24,-21);g.lineTo(s*21,-4);g.lineTo(s*11,1);g.closePath();outline(g,g.fillStyle,c.shadow,1.7);}
        stroke(g,c.accent,2.5);g.beginPath();g.moveTo(-9,-14);g.lineTo(-2,-6);g.lineTo(-8,2);g.moveTo(9,-14);g.lineTo(2,-6);g.lineTo(8,2);g.moveTo(0,-2);g.lineTo(0,13);g.stroke();
        g.fillStyle='#241921';g.beginPath();g.arc(0,-24,9,0,TAU);g.fill();glow(g,0,-24,18,c.accent,.55);g.fillStyle=c.accent;g.fillRect(-7,-25,14,3);break;
      case 'guardian':
        for(const s of [-1,1]){limb(g,s*9,1,s*14+g0,9,s*14+g0,17,5,'#46516a',c.shadow);g.beginPath();g.moveTo(s*8,-16);g.lineTo(s*18,-22);g.lineTo(s*22,-10);g.lineTo(s*12,-5);g.closePath();outline(g,'#697894',c.shadow,1.8);}
        g.beginPath();g.moveTo(-13,-20);g.lineTo(-10,-31);g.lineTo(0,-35);g.lineTo(10,-31);g.lineTo(14,-20);g.lineTo(13,9);g.lineTo(0,18);g.lineTo(-13,9);g.closePath();outline(g,'#39455c',c.shadow,2.4);
        g.beginPath();g.moveTo(-8,-14);g.lineTo(0,-20);g.lineTo(8,-14);g.lineTo(6,6);g.lineTo(0,12);g.lineTo(-6,6);g.closePath();outline(g,'#9aa7b8',c.shadow,1.5);
        g.fillStyle='#202638';g.beginPath();g.arc(0,-23,9,0,TAU);g.fill();eyePair('#75d9ff',-22);glow(g,0,-4,16,'#58b9ff',.5);
        g.strokeStyle='#72d7ff';g.lineWidth=2;g.beginPath();g.moveTo(-6,-4);g.lineTo(0,3);g.lineTo(6,-4);g.moveTo(-6,3);g.lineTo(0,10);g.lineTo(6,3);g.stroke();break;
      case 'boss':
        for(const s of [-1,1]){limb(g,s*8,1,s*12+g0,8,s*11+g0,16,4.5,'#706782',c.shadow);g.beginPath();g.moveTo(s*7,-16);g.lineTo(s*15,-22);g.lineTo(s*20,-12);g.lineTo(s*12,-7);g.closePath();outline(g,'#8c759f',c.shadow,1.8);}
        g.beginPath();g.moveTo(-12,-19);g.lineTo(-14,6);g.lineTo(-20,15);g.lineTo(0,19);g.lineTo(20,15);g.lineTo(14,6);g.lineTo(12,-19);g.closePath();outline(g,'#493b5d',c.shadow,2.2);
        g.beginPath();g.moveTo(-10,-20);g.lineTo(-8,-32);g.lineTo(0,-27);g.lineTo(8,-32);g.lineTo(10,-20);g.lineTo(8,-8);g.lineTo(0,-3);g.lineTo(-8,-8);g.closePath();outline(g,'#c0af9b',c.shadow,1.8);
        for(const s of [-1,1]){g.fillStyle='#f1d78b';g.beginPath();g.moveTo(s*5,-29);g.lineTo(s*11,-42);g.lineTo(s*10,-27);g.closePath();g.fill();}
        eyePair('#bba0ff',-19);g.fillStyle=c.accent;g.beginPath();g.arc(0,1,4,0,TAU);g.fill();
        stroke(g,'#d8d7e0',4);g.beginPath();g.moveTo(13,-1);g.lineTo(24,-31);g.stroke();g.fillStyle='#e8e1cc';g.beginPath();g.moveTo(24,-32);g.lineTo(29,-42);g.lineTo(28,-28);g.closePath();g.fill();break;
      case 'forest_lord':case 'ent_anc':
        for(const s of [-1,1]){limb(g,s*7,3,s*10+g0,10,s*12+g0,17,5,'#564338','#241d20');g.strokeStyle='#483b2d';g.lineWidth=5;g.beginPath();g.moveTo(s*5,-24);g.quadraticCurveTo(s*22,-31,s*27,-45);g.lineTo(s*20,-31);g.moveTo(s*18,-35);g.lineTo(s*31,-38);g.stroke();}
        body('#513d2e',()=>{g.moveTo(-14,9);g.lineTo(-12,-17);g.lineTo(-8,-29);g.lineTo(0,-34);g.lineTo(10,-25);g.lineTo(14,7);g.lineTo(0,17);});
        g.fillStyle='#376c3c';for(let i=0;i<9;i++){const a=i/9*TAU;g.beginPath();g.ellipse(Math.cos(a)*13,-29+Math.sin(a)*9,6,3,a,0,TAU);g.fill();}
        stroke(g,'#a1d878',2);g.beginPath();g.moveTo(-9,-14);g.lineTo(-2,-7);g.lineTo(-8,2);g.moveTo(9,-12);g.lineTo(2,-4);g.lineTo(8,4);g.stroke();eyePair('#eaff9d',-23);break;
      case 'lorde':
        g.beginPath();g.moveTo(-12,-22);g.lineTo(-17,-5);g.lineTo(-21,15);g.lineTo(-11,11);g.lineTo(0,19);g.lineTo(12,11);g.lineTo(21,15);g.lineTo(16,-6);g.lineTo(11,-22);g.closePath();outline(g,'#211e2e','#0e111c',2);
        for(const s of [-1,1]){g.beginPath();g.moveTo(s*7,-17);g.lineTo(s*10,-31);g.lineTo(s*13,-19);g.closePath();g.fillStyle='#d8d2b0';g.fill();g.stroke();}
        g.beginPath();g.ellipse(0,-20,10,11,0,0,TAU);outline(g,'#d9d2ba','#3c3438',1.8);g.fillStyle='#2c2430';g.fillRect(-7,-22,14,4);eyePair('#ffcb73',-20);
        stroke(g,'#c4c6d0',4);g.beginPath();g.moveTo(12,-2);g.lineTo(21,-26);g.stroke();g.fillStyle='#efe4cd';g.beginPath();g.moveTo(21,-27);g.lineTo(25,-35);g.lineTo(23,-24);g.closePath();g.fill();break;
      case 'hidra':
        body('#375543',()=>{g.moveTo(-16,8);g.lineTo(-14,-8);g.lineTo(-8,-16);g.lineTo(8,-16);g.lineTo(14,-7);g.lineTo(17,9);g.lineTo(0,17);});
        for(let h=-1;h<=1;h++){const hx=h*13, sway=Math.sin(phase+h)*2.6;stroke(g,'#183b33',6);g.beginPath();g.moveTo(h*6,-10);g.quadraticCurveTo(hx+sway,-27,hx+sway,-35);g.stroke();stroke(g,c.base,4.2);g.beginPath();g.moveTo(h*6,-10);g.quadraticCurveTo(hx+sway,-27,hx+sway,-35);g.stroke();g.beginPath();g.moveTo(hx+sway-5,-37);g.lineTo(hx+sway-4,-43);g.lineTo(hx+sway,-46);g.lineTo(hx+sway+5,-42);g.lineTo(hx+sway+4,-36);g.closePath();outline(g,shade(c.base,'#ffffff',.15),c.shadow,1.4);eye(g,hx+sway-2,-41,1,'#f0ff97');eye(g,hx+sway+2,-41,1,'#f0ff97');g.fillStyle='#e9ddb5';for(let s of [-1,1]){g.beginPath();g.moveTo(hx+sway+s*2,-35);g.lineTo(hx+sway+s*3,-31);g.lineTo(hx+sway+s*4,-35);g.fill();}}
        break;
      case 'thorn_queen':case 'matriarca':
        for(let s of [-1,1])for(let i=0;i<4;i++){const a=(i/3-.5)*1.6+s*.5, ex=s*(19+i*3),ey=-4+i*5;stroke(g,'#24452e',3.2);g.beginPath();g.moveTo(s*7,ey);g.lineTo(s*(12+i),ey-5);g.lineTo(ex,ey+Math.sin(phase+i)*2);g.stroke();g.strokeStyle=c.base;g.lineWidth=1.4;g.stroke();}
        g.beginPath();g.ellipse(0,4,15,13,0,0,TAU);outline(g,'#263c29',c.shadow,2);g.beginPath();g.ellipse(0,-12,12,12,0,0,TAU);outline(g,c.base,c.shadow,1.8);g.fillStyle='#29402d';for(let i=0;i<7;i++){const a=i/7*TAU;g.beginPath();g.moveTo(Math.cos(a)*8,-18+Math.sin(a)*8);g.lineTo(Math.cos(a)*15,-22+Math.sin(a)*13);g.lineTo(Math.cos(a)*8,-10+Math.sin(a)*8);g.closePath();g.fill();}
        eyePair('#f6ff86',-15);stroke(g,'#eeedcf',2);g.beginPath();g.moveTo(-5,-2);g.lineTo(-8,4);g.moveTo(5,-2);g.lineTo(8,4);g.stroke();break;
      case 'astral_devourer':case 'devorador_astral':
        g.save();g.globalCompositeOperation='lighter';g.strokeStyle=c.accent;g.lineWidth=1.8;g.beginPath();g.ellipse(0,-8,25,13,phase*.18,0,TAU);g.stroke();g.beginPath();g.ellipse(0,-8,18,28,-phase*.2,0,TAU);g.stroke();g.restore();
        g.beginPath();g.moveTo(-13,-17);g.quadraticCurveTo(0,-34,14,-17);g.lineTo(20,8);g.lineTo(9,3);g.lineTo(4,17);g.lineTo(0,8);g.lineTo(-7,18);g.lineTo(-9,4);g.lineTo(-20,9);g.closePath();outline(g,'#221638',c.shadow,2);
        g.fillStyle='#120b22';g.beginPath();g.ellipse(0,-17,11,12,0,0,TAU);g.fill();glow(g,0,-17,20,'#ba65ff',.6);g.fillStyle='#d79cff';g.beginPath();g.ellipse(0,-17,6,8,0,0,TAU);g.fill();g.fillStyle='#1a1024';g.beginPath();g.arc(0,-17,2.5,0,TAU);g.fill();
        for(let s of [-1,1])for(let i=0;i<2;i++){const x=s*(9+i*4);stroke(g,c.base,3);g.beginPath();g.moveTo(s*8,-4+i*5);g.quadraticCurveTo(x+s*5,2+Math.sin(phase+i)*3,x,13);g.stroke();}break;
      case 'prisma':
        for(let s of [-1,1]){g.fillStyle=shade(c.base,'#ffffff',.35);g.beginPath();g.moveTo(s*7,-14);g.lineTo(s*31,-27);g.lineTo(s*23,-4);g.lineTo(s*32,12);g.lineTo(s*10,5);g.closePath();g.fill();g.strokeStyle=c.shadow;g.lineWidth=1.4;g.stroke();for(let i=0;i<3;i++){g.strokeStyle=c.accent;g.beginPath();g.moveTo(s*(12+i*5),-12+i*4);g.lineTo(s*(24+i*2),-20+i*8);g.stroke();}}
        g.beginPath();g.moveTo(-9,-21);g.lineTo(-5,-30);g.lineTo(0,-37);g.lineTo(6,-30);g.lineTo(10,-20);g.lineTo(8,9);g.lineTo(0,18);g.lineTo(-8,9);g.closePath();outline(g,'#493b75',c.shadow,2);g.fillStyle='#e5d9ff';g.beginPath();g.moveTo(0,-31);g.lineTo(7,-19);g.lineTo(4,-3);g.lineTo(0,3);g.lineTo(-4,-3);g.lineTo(-7,-19);g.closePath();g.fill();g.stroke();glow(g,0,-14,16,c.accent,.45);eyePair('#f8edff',-19);break;
      case 'mae_cinzas':
        for(let s of [-1,1]){g.beginPath();g.moveTo(s*6,-16);g.quadraticCurveTo(s*22,-32,s*34,-23);g.lineTo(s*25,-11);g.lineTo(s*31,-1);g.lineTo(s*13,-7);g.closePath();outline(g,'#4a171d',c.shadow,1.6);stroke(g,'#ff7438',1.5);g.beginPath();g.moveTo(s*13,-11);g.lineTo(s*27,-21);g.lineTo(s*20,-9);g.stroke();}
        g.beginPath();g.moveTo(-12,-20);g.lineTo(-8,-31);g.lineTo(0,-35);g.lineTo(8,-31);g.lineTo(13,-20);g.lineTo(11,8);g.lineTo(0,16);g.lineTo(-11,8);g.closePath();outline(g,'#3a1a1e',c.shadow,2);stroke(g,'#ff5636',2.2);g.beginPath();g.moveTo(-8,-15);g.lineTo(-2,-7);g.lineTo(-6,4);g.moveTo(8,-15);g.lineTo(2,-7);g.lineTo(6,4);g.moveTo(0,-4);g.lineTo(0,12);g.stroke();
        g.fillStyle='#ad342b';g.beginPath();g.ellipse(0,-24,10,9,0,0,TAU);g.fill();g.stroke();for(const s of [-1,1]){g.fillStyle='#f2d7b3';g.beginPath();g.moveTo(s*4,-29);g.lineTo(s*12,-42);g.lineTo(s*9,-26);g.closePath();g.fill();}eyePair('#ffe27d',-24);break;
      case 'kraken':
        for(let s of [-1,1])for(let i=0;i<2;i++){const start=s*(6+i*5);stroke(g,'#164b5b',4);g.beginPath();g.moveTo(start,4);g.bezierCurveTo(s*(19+i*3),9+Math.sin(phase+i)*2,s*(17+i*5),-17,s*(27+i*4),-24-i*3);g.stroke();stroke(g,c.base,2.3);g.beginPath();g.moveTo(start,4);g.bezierCurveTo(s*(19+i*3),9+Math.sin(phase+i)*2,s*(17+i*5),-17,s*(27+i*4),-24-i*3);g.stroke();for(let q=0;q<4;q++){g.fillStyle='#d2f0df';g.beginPath();g.arc(s*(14+q*3),3-q*5,.9,0,TAU);g.fill();}}
        g.beginPath();g.moveTo(-12,-14);g.quadraticCurveTo(0,-38,12,-14);g.lineTo(15,8);g.lineTo(0,15);g.lineTo(-15,8);g.closePath();outline(g,'#176072',c.shadow,2);g.beginPath();g.ellipse(0,-16,8,7,0,0,TAU);g.fillStyle='#d77f61';g.fill();g.stroke();eyePair('#f2d879',-18);break;
      case 'verme':
        stroke(g,'#593b28',14);g.beginPath();g.moveTo(0,15);g.bezierCurveTo(-20,5,18,-3,0,-14);g.bezierCurveTo(-9,-20,-7,-25,0,-28);g.stroke();stroke(g,c.base,10);g.beginPath();g.moveTo(0,15);g.bezierCurveTo(-20,5,18,-3,0,-14);g.bezierCurveTo(-9,-20,-7,-25,0,-28);g.stroke();
        for(let i=0;i<7;i++){const y=10-i*5;g.strokeStyle=shade(c.base,'#ffffff',.25);g.lineWidth=1.1;g.beginPath();g.arc(Math.sin(phase+i)*5,y,5,-.2,Math.PI+.2);g.stroke();}
        g.fillStyle='#8e5c3b';g.beginPath();g.ellipse(0,-28,10,9,0,0,TAU);g.fill();g.stroke();g.fillStyle='#24151a';g.beginPath();g.ellipse(0,-26,6,5,0,0,TAU);g.fill();for(let i=0;i<7;i++){const a=i/7*TAU;g.fillStyle='#f4e4c8';g.beginPath();g.moveTo(Math.cos(a)*5,-26+Math.sin(a)*4);g.lineTo(Math.cos(a)*7,-26+Math.sin(a)*7);g.lineTo(Math.cos(a+1)*5,-26+Math.sin(a+1)*4);g.fill();}break;
      case 'rei_sombras':
        g.beginPath();g.moveTo(-13,-24);g.lineTo(-21,5);g.lineTo(-14,2);g.lineTo(-9,18);g.lineTo(0,10);g.lineTo(10,18);g.lineTo(14,2);g.lineTo(21,5);g.lineTo(12,-24);g.closePath();outline(g,'#21172f',c.shadow,2);g.fillStyle='#755099';g.beginPath();g.ellipse(0,-21,9,10,0,0,TAU);g.fill();g.stroke();for(const s of [-1,1]){g.fillStyle='#ddd3bb';g.beginPath();g.moveTo(s*4,-28);g.lineTo(s*9,-41);g.lineTo(s*8,-26);g.closePath();g.fill();}eyePair('#d6a3ff',-22);stroke(g,'#8772b1',4);g.beginPath();g.moveTo(10,-3);g.lineTo(22,-27);g.stroke();g.strokeStyle='#d6c4e5';g.lineWidth=2;g.beginPath();g.arc(22,-30,7,-.8,2.5);g.stroke();break;
      case 'raijin':case 'tempestade':case 'lightning_lord':
        for(const s of [-1,1]){stroke(g,'#e6c773',5);g.beginPath();g.moveTo(s*7,-12);g.lineTo(s*15,-4);g.lineTo(s*20,7);g.stroke();stroke(g,'#74c9ff',1.3);g.beginPath();g.moveTo(s*12,-20);g.lineTo(s*22,-27);g.lineTo(s*17,-15);g.lineTo(s*27,-19);g.stroke();}
        g.beginPath();g.moveTo(-11,-21);g.lineTo(-8,-31);g.lineTo(0,-35);g.lineTo(8,-31);g.lineTo(11,-21);g.lineTo(10,9);g.lineTo(0,17);g.lineTo(-10,9);g.closePath();outline(g,'#55492f',c.shadow,2);g.fillStyle='#c29c48';g.beginPath();g.moveTo(-8,-13);g.lineTo(0,-19);g.lineTo(8,-13);g.lineTo(6,5);g.lineTo(0,9);g.lineTo(-6,5);g.closePath();g.fill();g.stroke();stroke(g,'#63bfff',2);g.beginPath();g.moveTo(-2,-16);g.lineTo(3,-9);g.lineTo(-2,-2);g.lineTo(3,5);g.stroke();eyePair('#fff07a',-22);break;
      case 'dragao':
        for(const s of [-1,1]){g.beginPath();g.moveTo(s*5,-17);g.quadraticCurveTo(s*24,-42,s*34,-23);g.lineTo(s*28,-7);g.lineTo(s*22,-12);g.lineTo(s*12,-3);g.closePath();outline(g,'#9d3426',c.shadow,1.8);stroke(g,'#ffac54',1);g.beginPath();g.moveTo(s*9,-15);g.quadraticCurveTo(s*25,-29,s*30,-22);g.stroke();}
        g.beginPath();g.moveTo(-10,-19);g.lineTo(-7,-31);g.lineTo(0,-37);g.lineTo(8,-31);g.lineTo(12,-18);g.lineTo(8,9);g.lineTo(0,17);g.lineTo(-9,8);g.closePath();outline(g,'#9e3829',c.shadow,2);for(let i=0;i<5;i++){g.fillStyle=i%2?'#c64b31':'#ef7842';g.beginPath();g.moveTo(-7+i*3.4,-23);g.lineTo(-5.5+i*3.4,-30-(i%2)*3);g.lineTo(-3+i*3.4,-22);g.closePath();g.fill();}
        stroke(g,'#e3aa75',3);g.beginPath();g.moveTo(-7,4);g.lineTo(-14,12);g.moveTo(7,4);g.lineTo(14,12);g.stroke();eyePair('#ffd47b',-23);break;
      case 'ice_archon':case 'soberana':
        g.beginPath();g.moveTo(-12,-17);g.lineTo(-22,-2);g.lineTo(-16,14);g.lineTo(0,19);g.lineTo(16,14);g.lineTo(22,-2);g.lineTo(12,-17);g.lineTo(8,9);g.lineTo(0,14);g.lineTo(-8,9);g.closePath();outline(g,'#526f90',c.shadow,2);g.strokeStyle='#ccf6ff';g.lineWidth=1.1;g.stroke();
        g.beginPath();g.moveTo(-8,-20);g.lineTo(-11,-31);g.lineTo(-4,-27);g.lineTo(0,-39);g.lineTo(4,-27);g.lineTo(11,-31);g.lineTo(8,-20);g.closePath();outline(g,'#b8efff',c.shadow,1.7);g.beginPath();g.moveTo(0,-32);g.lineTo(4,-21);g.lineTo(0,-10);g.lineTo(-4,-21);g.closePath();g.fillStyle='#e6fbff';g.fill();g.stroke();eyePair('#ffffff',-21);break;
      case 'colosso':
        for(const s of [-1,1]){g.beginPath();g.moveTo(s*8,-9);g.lineTo(s*19,-16);g.lineTo(s*24,-7);g.lineTo(s*20,8);g.lineTo(s*9,5);g.closePath();outline(g,'#606875',c.shadow,2);limb(g,s*16,-2,s*20+g0,8,s*22+g0,15,6,'#626b79',c.shadow);}
        g.beginPath();g.moveTo(-14,-20);g.lineTo(-10,-32);g.lineTo(0,-36);g.lineTo(11,-31);g.lineTo(14,-18);g.lineTo(12,8);g.lineTo(0,18);g.lineTo(-13,8);g.closePath();outline(g,'#7e8794',c.shadow,2.2);
        for(let i=0;i<7;i++){const s=i%2?-1:1,x=s*(5+(i%3)*2),y=-23+Math.floor(i/2)*8;g.strokeStyle='#343d4a';g.lineWidth=1.4;g.beginPath();g.moveTo(x,y);g.lineTo(x-s*3,y+4);g.lineTo(x+s*2,y+8);g.stroke();}
        glow(g,0,-9,19,'#59c9ff',.52);g.fillStyle='#57c4ff';g.beginPath();g.arc(0,-9,5.8,0,TAU);g.fill();g.strokeStyle='#d8f9ff';g.lineWidth=1.4;g.stroke();eyePair('#85d9ff',-24);break;
      case 'celestial_vulture':
        for(const s of [-1,1]){g.beginPath();g.moveTo(s*4,-11);g.quadraticCurveTo(s*24,-38,s*38,-22);g.lineTo(s*27,-3);g.lineTo(s*17,-7);g.lineTo(s*12,3);g.closePath();outline(g,shade(c.base,'#ffffff',.18),c.shadow,1.8);for(let i=0;i<4;i++){g.strokeStyle=i%2?'#d8c7ff':'#79dcf0';g.lineWidth=1.3;g.beginPath();g.moveTo(s*(10+i*2),-8+i*3);g.lineTo(s*(28+i*2),-24+i*4);g.stroke();}}
        g.beginPath();g.moveTo(-11,-18);g.lineTo(-8,-30);g.lineTo(0,-37);g.lineTo(9,-30);g.lineTo(12,-17);g.lineTo(8,8);g.lineTo(0,16);g.lineTo(-9,8);g.closePath();outline(g,'#56477c',c.shadow,2);
        for(let i=0;i<5;i++){g.fillStyle=i%2?'#8b70c7':'#d5baff';g.beginPath();g.moveTo(-7+i*3.4,-26);g.lineTo(-5+i*3.4,-34-(i%2)*3);g.lineTo(-2+i*3.4,-25);g.closePath();g.fill();}
        g.fillStyle='#d9a951';g.beginPath();g.moveTo(6,-14);g.lineTo(18,-11);g.lineTo(8,-6);g.closePath();g.fill();eyePair('#fff2a0',-22);glow(g,0,-4,26,'#70c9ff',.24);break;
      case 'oni':
        for(const s of [-1,1]){limb(g,s*9,-3,s*18+g0,5,s*20+g0,15,7,'#4e295f',c.shadow);g.beginPath();g.moveTo(s*8,-18);g.lineTo(s*20,-24);g.lineTo(s*24,-8);g.lineTo(s*12,-3);g.closePath();outline(g,'#54355f',c.shadow,2);}
        g.beginPath();g.moveTo(-14,-21);g.lineTo(-11,-32);g.lineTo(0,-37);g.lineTo(11,-32);g.lineTo(15,-20);g.lineTo(13,10);g.lineTo(0,18);g.lineTo(-13,10);g.closePath();outline(g,'#672d56',c.shadow,2.4);
        for(let i=0;i<7;i++){const x=-10+i*3.3;g.fillStyle=i%2?'#9b5cc0':'#392445';g.beginPath();g.moveTo(x,-21);g.lineTo(x+1,-31-(i%2)*4);g.lineTo(x+3,-20);g.closePath();g.fill();}
        for(const s of [-1,1]){g.beginPath();g.moveTo(s*4,-27);g.quadraticCurveTo(s*17,-42,s*13,-28);g.lineTo(s*8,-20);g.closePath();outline(g,'#ece1cc',c.shadow,1.6);}
        g.fillStyle='#211723';g.beginPath();g.ellipse(0,-17,10,9,0,0,TAU);g.fill();eye(g,-4,-18,2,'#ff564f');eye(g,4,-18,2,'#ff564f');g.fillStyle='#f4e7dc';for(let i=0;i<5;i++){const x=-7+i*3.5;g.beginPath();g.moveTo(x,-11);g.lineTo(x+1.6,-5+(i%2)*2);g.lineTo(x+3.2,-11);g.fill();}
        stroke(g,'#382536',5);g.beginPath();g.moveTo(13,-1);g.lineTo(25,-32);g.stroke();g.beginPath();g.moveTo(25,-35);g.lineTo(33,-43);g.lineTo(30,-30);g.lineTo(37,-24);g.lineTo(27,-24);g.closePath();outline(g,'#c8d3df',c.shadow,1.8);g.strokeStyle='#d58bff';g.lineWidth=1.5;g.beginPath();g.moveTo(24,-32);g.lineTo(31,-26);g.stroke();glow(g,0,-2,29,'#a34bde',.42);break;
      default:
        g.beginPath();g.moveTo(-12,-22);g.lineTo(-17,-7);g.lineTo(-13,13);g.lineTo(0,18);g.lineTo(13,13);g.lineTo(17,-7);g.lineTo(12,-22);g.closePath();outline(g,c.base,c.shadow,2);g.fillStyle=c.accent;g.fillRect(-3,-12,6,17);eyePair();
    }
    // Moving attack pose changes the boss silhouette and weapon angle before impact.
    if(p.wind>.05){g.save();g.globalAlpha=.22+.28*Math.sin(now*12);g.fillStyle=c.base;g.beginPath();g.arc(0,-4,35+p.wind*10,0,TAU);g.fill();g.restore();}
    g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.75+.2*Math.sin(now*3.5);
    g.strokeStyle=c.accent;g.lineWidth=1.2;g.beginPath();g.arc(0,-20,Math.max(16,r*.62),phase,phase+Math.PI*1.35);g.stroke();
    for(const s of [-1,1]){g.fillStyle=c.accent;g.beginPath();g.moveTo(s*7,-28);g.lineTo(s*11,-35);g.lineTo(s*14,-27);g.closePath();g.fill();}
    for(let i=0;i<3;i++){const a=now*(.8+i*.12)+i*TAU/3;g.fillStyle=i%2?'#fff2b0':c.accent;g.beginPath();g.arc(Math.cos(a)*24,-8+Math.sin(a)*10,1.3,0,TAU);g.fill();}
    g.restore();
    // Extra boss silhouette details: layered armor, a central insignia and animated rank marks.
    g.save();
    g.strokeStyle=c.shadow; g.lineWidth=1.4; g.fillStyle=shade(c.base,'#ffffff',.16);
    for(const s of [-1,1]){g.beginPath();g.moveTo(s*8,-8);g.lineTo(s*15,-11);g.lineTo(s*18,-2);g.lineTo(s*11,2);g.closePath();g.fill();g.stroke();}
    g.strokeStyle=c.accent; g.lineWidth=1; g.beginPath();g.moveTo(-5,6);g.lineTo(0,10);g.lineTo(5,6);g.moveTo(0,10);g.lineTo(0,15);g.stroke();
    for(let i=0;i<4;i++){const a=now*1.4+i*TAU/4;const x=Math.cos(a)*(r*.9),y=-18+Math.sin(a)*(r*.42);g.fillStyle=i%2?c.accent:'#fff1b0';g.beginPath();g.moveTo(x,y-2.2);g.lineTo(x+1.8,y);g.lineTo(x,y+2.2);g.lineTo(x-1.8,y);g.closePath();g.fill();}
    g.restore();
    g.restore();
  }
  function inferArch(id,t){return t.arch||catalog()[id]?.arch||ARCH[id]||(/slime|blob|gosma/.test(id)?'blob':/bat|harpy|hawk/.test(id)?'flyer':/spider|scorpion|scarab|crab|beetle/.test(id)?'bug':/golem|guardian|titan|coloss/.test(id)?'golem':/wraith|spirit|ghost|void|wisp/.test(id)?'spirit':/serpent|snake|hydra|hidra|verme|kraken/.test(id)?'serpent':/tree|ent|thorn|dryad|plant|shroom/.test(id)?'plant':/wolf|stag|hound|bear|boar|beast|hyena/.test(id)?'quad':'human');}
  function detailPass(g,e,p,c,id,arch,now){
    const pulse=.5+.5*Math.sin(now*3.4+(e.bob||0));
    g.save();
    if(arch==='human'||arch==='golem'){
      stroke(g,shade(c.base,'#000000',.35),.8);g.beginPath();g.moveTo(-9,-5);g.lineTo(-6,5);g.moveTo(9,-5);g.lineTo(6,5);g.moveTo(-6,-3);g.lineTo(6,-3);g.stroke();
      for(const s of [-1,1]){g.fillStyle=c.accent;g.beginPath();g.arc(s*8,-1,1.05,0,TAU);g.fill();}
    } else if(arch==='quad'){
      stroke(g,c.accent,.9);g.beginPath();g.moveTo(-8,-4);g.quadraticCurveTo(0,-1,9,-5);g.stroke();
      if(id==='hyena'){g.fillStyle=c.accent;for(let i=0;i<4;i++){g.beginPath();g.moveTo(-5+i*3,-9);g.lineTo(-4+i*3,-14-(i%2)*2);g.lineTo(-2+i*3,-9);g.fill();}}
    } else if(arch==='bug'){
      stroke(c.accent,1);for(const s of [-1,1]){g.beginPath();g.moveTo(s*5,-5);g.lineTo(s*12,-9);g.moveTo(s*5,0);g.lineTo(s*13,1);g.moveTo(s*4,5);g.lineTo(s*11,8);g.stroke();}
      if(id==='ironbeetle'){g.strokeStyle='#e7f4ff';g.lineWidth=1.2;g.beginPath();g.moveTo(0,-10);g.lineTo(0,8);g.stroke();}
    } else if(arch==='spirit'||arch==='elemental'){
      g.globalCompositeOperation='lighter';g.globalAlpha=.35+.3*pulse;g.strokeStyle=c.accent;g.lineWidth=1;g.beginPath();g.arc(0,-8,12+pulse*2,p.frame*.8,p.frame*.8+2.4);g.stroke();g.globalAlpha=1;g.globalCompositeOperation='source-over';
    }
    if(e.elite){g.strokeStyle='#ffe39a';g.lineWidth=1.3;g.beginPath();g.moveTo(-8,-16);g.lineTo(0,-20);g.lineTo(8,-16);g.stroke();}
    g.restore();
  }
  function inferArchOld(id,t){return t.arch||catalog()[id]?.arch||ARCH[id]||(/slime|blob|gosma/.test(id)?'blob':/bat|harpy|hawk/.test(id)?'flyer':/spider|scorpion|scarab|crab/.test(id)?'bug':/golem|guardian|titan|coloss/.test(id)?'golem':/wraith|spirit|ghost|void/.test(id)?'spirit':/serpent|snake|hydra|hidra|verme|kraken/.test(id)?'serpent':/tree|ent|thorn|dryad|plant|shroom/.test(id)?'plant':/wolf|stag|hound|bear|boar|beast/.test(id)?'quad':'human');}
  function drawEnemy(ctx,e,now){
    if(!ctx||!e||!e.t)return;
    const t=e.t,id=e.type,p=pose(e,now),c=palette(id,t),r=t.r||14,arch=inferArch(id,t),boss=t.boss;
    if(id==='oni'&&typeof window.__abismoLegacyOni==='function'){window.__abismoLegacyOni(e);return;}
    ctx.save();ctx.translate(e.x,e.y);
    ctx.fillStyle='rgba(7,12,18,.46)';ctx.beginPath();ctx.ellipse(0,r*.52,r*1.2,r*.43,0,0,TAU);ctx.fill();
    const emergence=e.finalBoss?Math.max(0,Math.min(1,(e.emerging||0)/4)):0;
    if(e.finalBoss){
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.78-emergence*.25;
      const pulse=1+.08*Math.sin(now*5);ctx.fillStyle='#160d23';ctx.beginPath();ctx.ellipse(0,r*.28,r*1.55*pulse,r*.48*pulse,0,0,TAU);ctx.fill();
      ctx.strokeStyle='#b961f0';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,r*.28,r*1.42*pulse,r*.39*pulse,0,0,TAU);ctx.stroke();
      for(let i=0;i<8;i++){const a=i/8*TAU+now*.3;ctx.strokeStyle=i%2?'#9d54d8':'#e08aff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.55,r*.28+Math.sin(a)*r*.18);ctx.lineTo(Math.cos(a)*r*(1.45+emergence*.25),r*.28+Math.sin(a)*r*.42);ctx.stroke();}
      ctx.restore();
    }
    if(boss){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.18+.07*Math.sin(now*3+(e.bob||0));ctx.fillStyle=c.base;ctx.beginPath();ctx.ellipse(0,-3,r*1.8,r*1.35,0,0,TAU);ctx.fill();ctx.restore();}
    if(e.state==='windup'){ctx.strokeStyle=`rgba(255,91,83,${.22+.34*Math.sin(now*18)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*(1.2+p.wind*.5),0,TAU);ctx.stroke();}
    const flipX=Math.cos(e.face||0)<-.01;
    ctx.scale((flipX?-1:1)*r/16,r/16);ctx.translate(0,p.bob+emergence*34);ctx.globalAlpha=1-emergence*.65;
    if(boss)drawBoss(ctx,e,p,c,id,now);
    else if(arch==='blob')drawBlob(ctx,e,p,c);
    else if(arch==='quad')drawQuad(ctx,e,p,c,id);
    else if(arch==='human')drawHumanoid(ctx,e,p,c,id);
    else if(arch==='flyer')drawFlyer(ctx,e,p,c,id);
    else if(arch==='bug')drawBug(ctx,e,p,c,id);
    else if(arch==='plant')drawPlant(ctx,e,p,c,id);
    else if(arch==='golem')drawGolem(ctx,e,p,c,id);
    else if(arch==='elemental')drawElemental(ctx,e,p,c,id);
    else if(arch==='dragon')drawDragon(ctx,e,p,c,id);
    else if(arch==='serpent')drawSerpent(ctx,e,p,c,id);
    else if(arch==='spirit')drawSpirit(ctx,e,p,c,id);
    else if(arch==='mimic')drawMimic(ctx,e,p,c);
    else if(arch==='dummy')drawDummy(ctx,e,p,c);
    detailPass(ctx,e,p,c,id,arch,now);
    if(p.hit>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,246,208,${Math.min(.6,p.hit*3)})`;ctx.beginPath();ctx.arc(0,-3,19,0,TAU);ctx.fill();}
    ctx.restore();
    if(e.elite){ctx.strokeStyle='#ffdc89';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y-3,r*1.5,r*1.18,0,0,TAU);ctx.stroke();}
    if(e.hp<e.maxHp&&!boss&&e.hp>0){const w=34,x=e.x-w/2,y=e.y-r-26;ctx.fillStyle='rgba(10,18,14,.78)';ctx.fillRect(x-1,y-1,w+2,6);ctx.fillStyle='#e66562';ctx.fillRect(x,y,w*e.hp/e.maxHp,4);}
    if(e.speechT>0&&e.speech){ctx.textAlign='center';ctx.font='700 10px system-ui';ctx.lineWidth=2.5;ctx.strokeStyle='rgba(7,10,16,.85)';ctx.strokeText(e.speech,e.x,e.y-r-32);ctx.fillStyle='#fff4cf';ctx.fillText(e.speech,e.x,e.y-r-32);}
  }
  function drawDummy(g,e,p,c){
    g.fillStyle='#5d4229';g.fillRect(-3,-10,6,27);g.strokeStyle='#291c16';g.lineWidth=1.4;g.strokeRect(-3,-10,6,27);
    g.fillStyle='#a47743';g.beginPath();g.ellipse(0,-16,7,8,0,0,TAU);g.fill();g.stroke();
    g.strokeStyle='#6c462b';g.lineWidth=4;g.beginPath();g.moveTo(-3,-4);g.lineTo(-13,3+p.gait*2);g.moveTo(3,-4);g.lineTo(13,3-p.gait*2);g.stroke();
    g.strokeStyle='#ddbd7d';g.lineWidth=1;g.beginPath();g.arc(0,-15,4,0,TAU);g.moveTo(-3,-15);g.lineTo(3,-15);g.moveTo(0,-18);g.lineTo(0,-12);g.stroke();
  }
  window.ABISMO_ENEMY_ART={draw:drawEnemy,archFor:(id,t)=>inferArch(id,t),bossIds:['ent_anc','forest_lord','lorde','hidra','matriarca','thorn_queen','devorador_astral','astral_devourer','prisma','mae_cinzas','kraken','verme','rei_sombras','raijin','lightning_lord','dragao','soberana','ice_archon','colosso','red_guardian','celestial_vulture','arquimago','titan','guardian','mimic_boss','oni']};
})();
