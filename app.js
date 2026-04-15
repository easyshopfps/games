const SUPA_URL='https://djecjoubwtngjvijchlf.supabase.co';
const SUPA_KEY='sb_publishable_kctF_x9IB4vFIUoAEDM9SA_jt-Bs1PN';
const sb=supabase.createClient(SUPA_URL,SUPA_KEY);

const S={g:k=>{try{return JSON.parse(localStorage.getItem('es_'+k));}catch{return null;}},s:(k,v)=>localStorage.setItem('es_'+k,JSON.stringify(v)),d:k=>localStorage.removeItem('es_'+k)};
async function h256(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}

async function initDB(){
  // โหลดจาก Supabase เสมอ — ไม่มี fallback default data
  // ข้อมูลต้องอยู่ใน Supabase แล้ว (รัน seed-data.sql ก่อน)
  try{
    const [gRes,pkRes,banRes,pupRes,ctRes,cpRes] = await Promise.all([
      sb.from('games').select('*').order('id'),
      sb.from('packages').select('*').order('id'),
      sb.from('banners').select('*').order('id'),
      sb.from('popups').select('*').order('order'),
      sb.from('settings').select('*').eq('key','contacts').maybeSingle(),
      sb.from('coupons').select('*').eq('active',true),
    ]);
    // Games — เขียนทับ localStorage เสมอ
    S.s('games', gRes.data||[]);
    // Packages — แปลงเป็น {game_id: [...]}
    const pkMap={};(pkRes.data||[]).forEach(p=>{if(!pkMap[p.game_id])pkMap[p.game_id]=[];pkMap[p.game_id].push(p);});
    S.s('pkgs',pkMap);
    // Banners
    S.s('bans', banRes.data||[]);
    // Popups
    S.s('popups', pupRes.data||[]);
    // Contacts
    if(ctRes.data)S.s('contacts',ctRes.data.value);else S.s('contacts',{fb:'',tt:'',wa:''});
    // Coupons
    S.s('coupons', cpRes.data||[]);
    // Admin credential
    if(!S.g('ac'))S.s('ac',{u:'kk',p:'8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'});
    if(!S.g('orders'))S.s('orders',[]);
  }catch(err){
    console.error('Supabase connection error:',err);
    // แสดง error แต่ไม่ใส่ข้อมูลปลอม
    toast('ບໍ່ສາມາດເຊື່ອມຕໍ່ Database ໄດ້','err');
  }
}

let CU=null;
const PID={home:'pH',games:'pG',detail:'pD',receipt:'pR',auth:'pA',profile:'pP',history:'pHist',help:'pHelp',pWallet:'pWallet',confirm:'pCof'};
function loadSess(){CU=S.g('sess');updNav();}
function updNav(){
  const r1=document.getElementById('nR1'),r2=document.getElementById('nR2');
  const dc=document.getElementById('duc'),dn=document.getElementById('dun'),de=document.getElementById('due'),da=document.getElementById('dua');
  const ami=document.getElementById('admmi');
  const daw=document.getElementById('dadmWrap'),dlw=document.getElementById('dloginWrap');
  if(CU){
    const walletHtml=`<div class="nav-wallet" onclick="needAuth(()=>{go('pWallet');})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8L4 7h16l-4-4z"/><circle cx="17" cy="14" r="1.5" fill="currentColor" stroke="none"/></svg><span>${(CU.wallet||0).toLocaleString()} ກີບ</span></div><div class="av" onclick="go('profile')">${CU.name[0].toUpperCase()}</div>`;
    if(r1)r1.innerHTML=walletHtml;if(r2)r2.innerHTML=walletHtml;
    dc.classList.add('on');dn.textContent=CU.name;de.textContent=CU.email;if(da)da.textContent=CU.name[0].toUpperCase();
    if(ami)ami.style.display=CU.isAdmin?'flex':'none';
    if(daw)daw.style.display=CU.isAdmin?'block':'none';
    if(dlw)dlw.style.display='none';
  }else{
    const b=`<button class="nav-login" onclick="go('auth')">ເຂົ້າສູ່ລະບົບ</button>`;
    if(r1)r1.innerHTML=b;if(r2)r2.innerHTML=b;
    dc.classList.remove('on');if(ami)ami.style.display='none';
    if(daw)daw.style.display='none';if(dlw)dlw.style.display='block';
  }
}
function needAuth(cb){if(CU){cb();return;}toast('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ','warn');setTimeout(()=>go('auth'),1600);}
function go(v,dir='enter'){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on','back'));
  document.getElementById('vAdm').style.display='none';
  document.getElementById('botN').style.display='flex';
  const id=PID[v];if(!id)return;
  const el=document.getElementById(id);el.classList.add('on');if(dir==='back')el.classList.add('back');
  window.scrollTo(0,0);
  if(v==='home')rHome();if(v==='games')rGrid('agG');if(v==='history')rHist();
  if(v==='profile')rProf();if(v==='help')rHelp();if(v==='pWallet')rWallet();
}
function bn(el){document.querySelectorAll('.bni').forEach(i=>i.classList.remove('on'));el.classList.add('on');}
function oD(){document.getElementById('drw').classList.add('on');document.getElementById('dov').classList.add('on');document.getElementById('hamB')&&document.getElementById('hamB').classList.add('x');}
function cD(){document.getElementById('drw').classList.remove('on');document.getElementById('dov').classList.remove('on');document.getElementById('hamB')&&document.getElementById('hamB').classList.remove('x');}

/* WALLET PAGE */
function rWallet(){
  if(!CU)return;
  document.getElementById('wPageAmt').textContent=(CU.wallet||0).toLocaleString();
  const ub=document.getElementById('wUserBox');ub.style.display='flex';
  document.getElementById('wUAv').textContent=CU.name[0].toUpperCase();
  document.getElementById('wUNm').textContent=CU.name;
  document.getElementById('wUID').textContent='ID: '+(CU.user_id||CU.id||'-');
}
function selWopt(id){document.querySelectorAll('.wopt').forEach(o=>o.classList.remove('on'));document.getElementById(id).classList.add('on');document.querySelectorAll('.wopt .wopt-ck').forEach(c=>c.innerHTML='');document.querySelector('#'+id+' .wopt-ck').innerHTML=`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;}

/* NOTIFICATIONS */
const _NTF_DUR=3200;
const _ICONS={ok:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline class="ntf-ck" points="20 6 9 17 4 12"/></svg>`,err:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,warn:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,info:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>`};
const _TTL={ok:'ສຳເລັດ!',err:'ຜິດພາດ!',warn:'ແຈ້ງເຕືອນ',info:'ແຈ້ງ'};
function closeNtf(el){el.classList.add('out');clearTimeout(el._nt);setTimeout(()=>el.remove(),280);}
function toast(msg,type){
  const t=type||'info';const wrap=document.getElementById('ntfWrap');
  const all=wrap.querySelectorAll('.ntf');if(all.length>=3)closeNtf(all[0]);
  const el=document.createElement('div');el.className='ntf '+t;el.style.setProperty('--nd',_NTF_DUR+'ms');
  el.innerHTML=`<div class="ntf-ico">${_ICONS[t]||_ICONS.info}</div><div class="ntf-body"><div class="ntf-ttl">${_TTL[t]}</div>${msg&&msg!==_TTL[t]?`<div class="ntf-sub">${msg}</div>`:''}</div><div class="ntf-prog-wrap"><div class="ntf-prog"></div></div>`;
  wrap.appendChild(el);requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('in')));
  el._nt=setTimeout(()=>closeNtf(el),_NTF_DUR+200);
}
function showSuccess(title,sub,cb){
  const ov=document.getElementById('spov');
  document.getElementById('spt').textContent=title;document.getElementById('sps').textContent=sub;
  const box=ov.querySelector('.spbox'),prog=box.querySelector('.spprog');
  box.style.animation='none';prog.style.animation='none';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{box.style.animation='';prog.style.animation='';}));
  ov.classList.add('on');clearTimeout(ov._t);ov._t=setTimeout(()=>{ov.classList.remove('on');if(cb)cb();},2300);
}

/* POPUP */
function showPopups(){
  const pups=(S.g('popups')||[]).filter(p=>p.url).sort((a,b)=>a.order-b.order);if(!pups.length)return;
  let idx=0;function showNext(){if(idx>=pups.length)return;const p=pups[idx++];const box=document.getElementById('pupbox');
  box.innerHTML=`<div style="width:280px;height:280px;display:flex;align-items:center;justify-content:center;border-radius:16px;background:var(--bg3)"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2" style="animation:spin .9s linear infinite"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-opacity=".2"/><path d="M21 12a9 9 0 00-9-9"/></svg></div>`;
  const img=new Image();img.onload=()=>{box.innerHTML=`<img src="${p.url}" style="width:100%;display:block;border-radius:16px;object-fit:cover;max-height:75vw;">`;if(p.link){box.style.cursor='pointer';box.onclick=()=>{window.open(p.link,'_blank');closePup();}}};img.onerror=()=>{box.innerHTML='';};img.src=p.url;
  document.getElementById('pupov').classList.add('on');if(pups[idx]){setTimeout(()=>{closePup();setTimeout(showNext,600);},5000);}}
  setTimeout(showNext,600);
}
function closePup(){const ov=document.getElementById('pupov');ov.classList.add('closing');setTimeout(()=>ov.classList.remove('on','closing'),500);}

/* SLIDER */
let SI=0,slTm=null,isDg=false,sX=0,cX=0;
function rBanner(){
  const bans=S.g('bans')||[];const tr=document.getElementById('sltr'),dt=document.getElementById('sldots');if(!tr)return;tr.innerHTML='';dt.innerHTML='';
  bans.forEach((b,i)=>{const s=document.createElement('div');s.className='slide';s.innerHTML=b.url&&b.url.startsWith('http')?`<img src="${b.url}" alt="" onerror="this.parentNode.innerHTML='<div class=slph style=background:${b.col}><div class=slt>${b.title}</div></div>'">`:`<div class="slph" style="background:${b.col}"><div class="slt">${b.title}</div><div class="sls">${b.sub||''}</div></div>`;tr.appendChild(s);const d=document.createElement('div');d.className='dot'+(i===0?' on':'');d.onclick=()=>gSlide(i);dt.appendChild(d);});
  SI=0;clearInterval(slTm);slTm=setInterval(()=>gSlide(SI+1),4500);
  const w=document.getElementById('slw');if(!w)return;const gX=e=>e.touches?e.touches[0].clientX:e.clientX;
  w.onmousedown=e=>{isDg=true;sX=gX(e);cX=sX;};w.ontouchstart=e=>{isDg=true;sX=gX(e);cX=sX;};
  w.onmousemove=e=>{if(isDg)cX=gX(e);};w.ontouchmove=e=>{if(isDg)cX=gX(e);};
  const end=()=>{if(isDg){isDg=false;if(Math.abs(sX-cX)>42)gSlide(SI+(sX-cX>0?1:-1));}};
  w.onmouseup=end;w.ontouchend=end;
}
function gSlide(n){const t=S.g('bans')||[];SI=((n%t.length)+t.length)%t.length;const tr=document.getElementById('sltr');if(tr)tr.style.transform=`translateX(-${SI*100}%)`;document.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('on',i===SI));}
function slBy(d){gSlide(SI+d);}
function TH(g,full){return g.img?`<img src="${g.img}" style="width:100%;height:100%;object-fit:cover">`:`<div style="width:100%;height:100%;background:${g.col};display:flex;align-items:center;justify-content:center;font-size:${full?'36px':'32px'}">${g.e||''}</div>`;}
function rHome(){rBanner();rPop();rGrid('agH');}
function rPop(){const gm=S.g('games')||[];const gr=document.getElementById('pgH');if(!gr)return;gr.innerHTML=gm.filter(g=>g.pop).slice(0,6).map(g=>`<div class="pc" onclick="openGame(${g.id})"><div class="pth">${TH(g,true)}<span class="bhot">HOT</span></div><div class="pname">${g.name}</div></div>`).join('');}
function rGrid(id){const gm=S.g('games')||[];const gr=document.getElementById(id);if(!gr)return;gr.innerHTML=gm.map(g=>`<div class="ac" onclick="openGame(${g.id})">${TH(g,true)}<div class="alab">${g.name}</div></div>`).join('');}
function fg(gid,iid){const q=document.getElementById(iid).value.toLowerCase();const gm=S.g('games')||[];document.querySelectorAll('#'+gid+' .ac').forEach((c,i)=>{c.style.display=gm[i]&&gm[i].name.toLowerCase().includes(q)?'':'none';});}

/* DISCOUNT */
let discAmt=0,discLabel='';
function numParse(s){return parseFloat((s||'0').replace(/,/g,''))||0;}
function applyDisc(){
  const code=document.getElementById('discIn').value.trim().toUpperCase();
  const tag=document.getElementById('discTag'),err=document.getElementById('discErr');
  tag.style.display='none';err.style.display='none';discAmt=0;discLabel='';
  if(!code){updateSummary();return;}
  const coupons=S.g('coupons')||[];const c=coupons.find(x=>x.code===code&&x.active);
  if(!c){err.textContent='ໂຄ້ດນີ້ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸ';err.style.display='block';updateSummary();return;}
  const pkgs=(S.g('pkgs')||{})[cGid]||[];const p=pkgs.find(x=>x.id===cPkg);
  if(!p){err.textContent='ກະລຸນາເລືອກ Package ກ່ອນ';err.style.display='block';return;}
  const basePrice=numParse(p.price);
  if(c.type==='percent'){discAmt=Math.round(basePrice*c.value/100);discLabel=`-${c.value}% (-${discAmt.toLocaleString()} ກີບ)`;}
  else{discAmt=Math.min(c.value,basePrice);discLabel=`-${discAmt.toLocaleString()} ກີບ`;}
  tag.textContent='✓ ໃຊ້ໂຄ້ດ: '+code+' '+discLabel;tag.style.display='block';
  updateSummary();toast('ໃຊ້ໂຄ້ດສຳເລັດ','ok');
}
function updateSummary(){
  const pkgs=(S.g('pkgs')||{})[cGid]||[];const p=pkgs.find(x=>x.id===cPkg);
  if(!p){['sumPkg','sumPrice','sumTotal'].forEach(id=>{document.getElementById(id).textContent='-';});document.getElementById('sumDiscRow').style.display='none';return;}
  const base=numParse(p.price);const total=Math.max(0,base-discAmt);
  document.getElementById('sumPkg').textContent=p.name;
  document.getElementById('sumPrice').textContent=p.price+' ກີບ';
  document.getElementById('sumDiscRow').style.display='flex';document.getElementById('sumDisc').textContent=discAmt>0?('-'+discAmt.toLocaleString()+' ກີບ'):'-ø ກີບ';
  document.getElementById('sumTotal').textContent=total.toLocaleString()+' ກີບ';
}

let cGid=null,cPkg=null;
const ZONE_GAMES=[2,4,5,6];
function chkZone(){const zw=document.getElementById('zoneWrap');if(zw)zw.style.display=ZONE_GAMES.includes(cGid)?'block':'none';}
function openGame(id){
  if(!CU){toast('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນເຕີມເກມ','warn');setTimeout(()=>go('auth'),1400);return;}
  cGid=id;cPkg=null;discAmt=0;discLabel='';
  const gm=S.g('games')||[];const g=gm.find(x=>x.id===id);if(!g)return;
  document.getElementById('dnavnm').textContent=g.name;
  document.getElementById('gnm').textContent=g.name;
  document.getElementById('gds').textContent=g.desc||'';
  // bg_img if set, else col gradient
  const bgEl=document.getElementById('ghbg');
  if(g.bg_img&&g.bg_img.startsWith('http')){bgEl.style.cssText=`background:url(${g.bg_img}) center/cover no-repeat;position:absolute;inset:0;z-index:0;`;}
  else{bgEl.style.cssText=`background:${g.col};position:absolute;inset:0;z-index:0;`;}
  document.getElementById('gic').innerHTML=TH(g,true);
  document.getElementById('uIn').value='';
  document.getElementById('discIn').value='';
  document.getElementById('discTag').style.display='none';
  document.getElementById('discErr').style.display='none';
  const pkgs=(S.g('pkgs')||{})[id]||[];
  const gr=document.getElementById('pkgG');
  gr.innerHTML=pkgs.length?pkgs.map(p=>`<div class="pkc" id="pk-${p.id}" onclick="sPkg(${p.id})"><div class="pkiw">${p.img?`<img src="${p.img}">`:`<div class="pkph"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20M6 3l4 6m8-6l-4 6"/></svg></div>`}</div><div class="pknm">${p.name}</div><div class="pkpr">${p.price} ກີບ</div></div>`).join(''):`<div style="color:var(--t3);text-align:center;padding:20px;grid-column:span 2">ຍັງບໍ່ມີ Package</div>`;
  updateSummary();const pbl2=document.getElementById('payBalLbl');if(pbl2&&CU)pbl2.textContent='ຍອດເງິນຄົງເຫຼືອ: '+(CU.wallet||0).toLocaleString()+' ກີບ';sPay('py1');go('detail');chkZone();
}
function sPkg(id){cPkg=id;document.querySelectorAll('.pkc').forEach(c=>c.classList.remove('on'));const el=document.getElementById('pk-'+id);if(el)el.classList.add('on');updateSummary();}
function sPay(pid){document.querySelectorAll('.payo').forEach(p=>{p.classList.remove('on');p.querySelector('.payck').innerHTML='';});document.getElementById(pid).classList.add('on');document.getElementById(pid).querySelector('.payck').innerHTML=`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;}
function openCof(){
  const uid=document.getElementById('uIn').value.trim();
  if(!uid){toast('ກະລຸນາກອກ UID','warn');return;}
  const zw=document.getElementById('zoneWrap');const zone=document.getElementById('zoneIn')&&zw.style.display!=='none'?document.getElementById('zoneIn').value.trim():'';
  if(zw.style.display!=='none'&&!zone){toast('ກະລຸນາກອກ Zone','warn');return;}
  if(!cPkg){toast('ກະລຸນາເລືອກ Package','warn');return;}
  const gm=S.g('games')||[];const g=gm.find(x=>x.id===cGid);
  const pkgs=(S.g('pkgs')||{})[cGid]||[];const p=pkgs.find(x=>x.id===cPkg);
  const base=numParse(p.price);const total=Math.max(0,base-discAmt);
  document.getElementById('cf-g').textContent=g.name;document.getElementById('cf-p').textContent=p.name;
  document.getElementById('cf-u').textContent=uid;document.getElementById('cf-pr').textContent=p.price+' ກີບ';
  const zr=document.getElementById('cf-zone-row');if(zone){document.getElementById('cf-z').textContent=zone;zr.style.display='flex';}else{zr.style.display='none';}
  const dr=document.getElementById('cf-disc-row');dr.style.display='flex';document.getElementById('cf-disc').textContent=discAmt>0?('-'+discAmt.toLocaleString()+' ກີບ'):'-ø ກີບ';
  document.getElementById('cf-total').textContent=total.toLocaleString()+' ກີບ';
  const pbl=document.getElementById('payBalLbl');if(pbl&&CU)pbl.textContent='ຍອດເງິນຄົງເຫຼືອ: '+(CU.wallet||0).toLocaleString()+' ກີບ';
  go('confirm');
}
function cCof(){go('detail','back');}
async function doOrder(){
  const uid=document.getElementById('uIn').value.trim();
  const gm2=S.g('games')||[];const g2=gm2.find(x=>x.id===cGid);
  const pkgs2=(S.g('pkgs')||{})[cGid]||[];const p2=pkgs2.find(x=>x.id===cPkg);
  if(g2&&p2){const base2=numParse(p2.price);const total2=Math.max(0,base2-discAmt);if((CU.wallet||0)<total2){toast('ຍອດເງິນບໍ່ພໍ! ກະລຸນາເຕີມ '+total2.toLocaleString()+' ກີບ','err');return;}}
  const gm=S.g('games')||[];const g=gm.find(x=>x.id===cGid);
  const pkgs=(S.g('pkgs')||{})[cGid]||[];const p=pkgs.find(x=>x.id===cPkg);
  const payNm=document.querySelector('.payo.on .paynm')?.textContent||'';
  const base=numParse(p.price);const total=Math.max(0,base-discAmt);
  const now=new Date();
  const ord={id:'ES'+Date.now(),game:g.name,gid:cGid,pkg:p.name,price:p.price,discount:discAmt,total:total.toString(),uid,zone:(document.getElementById('zoneIn')&&document.getElementById('zoneIn').style.display!=='none'?document.getElementById('zoneIn').value.trim():''),pay:payNm,status:'pending',time:now.toLocaleString('lo-LA'),userId:CU?CU.email:'guest',discCode:document.getElementById('discIn').value.trim().toUpperCase()};
  try{await sb.from('orders').insert(ord);}catch(e){console.warn('order save err',e);}
  const orders=S.g('orders')||[];orders.unshift(ord);S.s('orders',orders);
  document.getElementById('roid').textContent=ord.id;
  document.getElementById('rgic').innerHTML=TH(g,true);
  document.getElementById('rgnm').textContent=g.name;document.getElementById('rgpk').textContent=p.name;
  document.getElementById('ruid').textContent=uid;document.getElementById('rpay').textContent=payNm;
  document.getElementById('rprice').textContent=p.price+' ກີບ';
  const rdr=document.getElementById('rdiscrow');if(discAmt>0){rdr.style.display='flex';document.getElementById('rdisc').textContent='-'+discAmt.toLocaleString()+' ກີບ';}else{rdr.style.display='none';}
  document.getElementById('rtotal').textContent=total.toLocaleString()+' ກີບ';
  document.getElementById('rtime').textContent=ord.time;
  document.getElementById('rstatEl').textContent='ລໍຖ້າ';document.getElementById('rstatEl').className='rval pend';
  go('receipt');setTimeout(()=>showSuccess('ສຳເລັດ!','ກະລຸນາຊຳລະ ແລ້ວສົ່ງ Slip'),300);
}

/* AUTH */
function aTab(t){
  document.getElementById('fL').style.display=t==='login'?'block':'none';
  document.getElementById('fR').style.display=t==='reg'?'block':'none';
  document.getElementById('tL').classList.toggle('on',t==='login');
  document.getElementById('tR').classList.toggle('on',t==='reg');
  const sl=document.getElementById('authSlider');
  if(sl)sl.style.transform=t==='login'?'translateX(0)':'translateX(100%)';
}
function togglePw(id,btn){const inp=document.getElementById(id);const isText=inp.type==='text';inp.type=isText?'password':'text';btn.style.opacity=isText?'0.45':'1';}
function fe(id,msg){const e=document.getElementById(id);if(e){e.textContent=msg;e.classList.toggle('on',!!msg);}}
async function doLogin(){
  const raw=document.getElementById('lE').value.trim();const pass=document.getElementById('lP').value;
  if(!raw||!pass){toast('ກະລຸນາຕື່ມ','warn');return;}const hash=await h256(pass);
  const ac=S.g('ac')||{};
  if((raw===ac.u||raw.toLowerCase()==='admin')&&hash===ac.p){CU={name:'Admin',email:'admin',isAdmin:true,role:'admin',wallet:0};S.s('sess',CU);updNav();showSuccess('ສຳເລັດ!','ສະບາຍດີ Admin',()=>{go('home');setTimeout(openAdm,400);});return;}
  try{
    const isEmail=raw.includes('@');
    const field=isEmail?'email':'name';
    const qval=isEmail?raw.toLowerCase():raw;
    const {data:users,error}=await sb.from('users').select('*').eq(field,qval).eq('ph',hash);
    if(error||!users||!users.length){toast('ຂໍ້ມູນບໍ່ຖືກຕ້ອງ','err');return;}
    const user=users[0];CU={name:user.name,email:user.email,role:user.role||'user',isAdmin:user.role==='admin',wallet:user.wallet||0,user_id:user.user_id||user.id||'-'};S.s('sess',CU);updNav();
    showSuccess('ສຳເລັດ!','ສະບາຍດີ '+user.name,()=>{go('home');if(CU.isAdmin)setTimeout(openAdm,400);});
  }catch(e){
    const users=S.g('users')||[];
    const isEmail=raw.includes('@');
    const user=isEmail?users.find(u=>u.email===raw.toLowerCase()&&u.ph===hash):users.find(u=>u.name===raw&&u.ph===hash);
    if(!user){toast('ຂໍ້ມູນບໍ່ຖືກຕ້ອງ','err');return;}
    CU={name:user.name,email:user.email,role:user.role||'user',isAdmin:user.role==='admin',wallet:user.wallet||0,user_id:user.user_id||user.id||'-'};S.s('sess',CU);updNav();showSuccess('ສຳເລັດ!','ສະບາຍດີ '+user.name,()=>go('home'));
  }
}
async function doReg(){
  const name=document.getElementById('rN').value.trim();const email=document.getElementById('rE').value.trim().toLowerCase();
  const pass=document.getElementById('rP').value;const pass2=document.getElementById('rP2').value;let ok=true;
  if(name.length<5){toast('ຊື່ 5 ຕົວຂຶ້ນໄປ','warn');ok=false;}
  if(!email.endsWith('@gmail.com')){fe('eE','@gmail.com ເທົ່ານັ້ນ');ok=false;}
  if(pass.length<6){fe('eP','6 ຕົວຂຶ້ນໄປ');ok=false;}
  if(pass!==pass2){fe('eP2','ບໍ່ກົງກັນ');ok=false;}
  if(!ok)return;const hash=await h256(pass);
  try{
    const {data:exist}=await sb.from('users').select('email').eq('email',email);
    if(exist&&exist.length){fe('eE','ຖືກໃຊ້ແລ້ວ');return;}
    // get next user_id
    let nextId=100;
    try{const {data:lastU}=await sb.from('users').select('user_id').order('user_id',{ascending:false}).limit(1);if(lastU&&lastU.length&&lastU[0].user_id)nextId=Math.max(100,lastU[0].user_id+1);}catch(e){}
    const nu={name,email,ph:hash,joined:new Date().toISOString(),role:'user',wallet:0,user_id:nextId};
    const {error}=await sb.from('users').insert(nu);if(error){toast('ລົ້ມເຫຼວ: '+error.message,'err');return;}
    const users=S.g('users')||[];users.push(nu);S.s('users',users);
    CU={name,email,role:'user',isAdmin:false,wallet:0,user_id:nextId};S.s('sess',CU);updNav();showSuccess('ສຳເລັດ!','ຍິນດີຕ້ອນຮັບ '+name,()=>go('home'));
  }catch(e){const users=S.g('users')||[];if(users.find(u=>u.email===email)){fe('eE','ຖືກໃຊ້ແລ້ວ');return;}users.push({name,email,ph:hash,joined:new Date().toISOString(),role:'user',wallet:0});S.s('users',users);CU={name,email,role:'user',isAdmin:false,wallet:0};S.s('sess',CU);updNav();showSuccess('ສຳເລັດ!','ຍິນດີຕ້ອນຮັບ '+name,()=>go('home'));}
}
function doLogout(){if(!confirm('ອອກ?'))return;CU=null;S.d('sess');updNav();go('home','back');toast('ອອກຈາກລະບົບແລ້ວ','ok');}

function rProf(){
  if(!CU)return;
  document.getElementById('pav').textContent=CU.name[0].toUpperCase();
  document.getElementById('pnm2').textContent=CU.name;document.getElementById('pem').textContent=CU.email;
  document.getElementById('puid').textContent='ID: '+(CU.user_id||'-');
  document.getElementById('pbdg').textContent=CU.isAdmin?'Admin':'User';
  document.getElementById('pwal').textContent=(CU.wallet||0).toLocaleString();
  document.getElementById('walletBal').textContent=(CU.wallet||0).toLocaleString()+' ກີບ';const pbl=document.getElementById('payBalLbl');if(pbl)pbl.textContent='ຍອດເງິນຄົງເຫຼືອ: '+(CU.wallet||0).toLocaleString()+' ກີບ';
  const ords=(S.g('orders')||[]).filter(o=>o.userId===CU.email);
  document.getElementById('poc').textContent=ords.length;document.getElementById('pos').textContent=ords.length+' Orders';
  const users=S.g('users')||[];const u=users.find(x=>x.email===CU.email);
  if(u){const m=Math.floor((Date.now()-new Date(u.joined))/(1000*60*60*24*30));document.getElementById('pjd').textContent=m||'<1';}
}
function rHist(){
  const gm=S.g('games')||[];let ords=S.g('orders')||[];
  if(CU&&!CU.isAdmin)ords=ords.filter(o=>o.userId===CU.email);
  const list=document.getElementById('histL');
  if(!ords.length){list.innerHTML='<div class="empty"><p>ຍັງບໍ່ມີ Order</p></div>';return;}
  list.innerHTML=ords.map(o=>{const g=gm.find(x=>x.name===o.game);const st=o.status==='done'?'<span class="st stdone">ສຳເລັດ</span>':o.status==='failed'?'<span class="st stfail">ລົ້ມ</span>':'<span class="st stpend">ລໍຖ້າ</span>';
  return `<div class="hitem" onclick="viewR('${o.id}')"><div class="hic">${g&&g.img?`<img src="${g.img}">`:`<div class="hph" style="background:${g?g.col:'#333'};font-size:22px">${g?g.e:''}</div>`}</div><div style="flex:1;min-width:0"><div class="hnm">${o.game}</div><div class="hpk">${o.pkg}</div><div class="htm2">${o.time}</div><div class="hid">${o.id}</div></div><div class="hr2"><div class="hpr">${o.total||o.price} ກີບ</div>${st}</div></div>`;}).join('');
}
function viewR(oid){
  const ords=S.g('orders')||[];const o=ords.find(x=>x.id===oid);if(!o)return;
  const gm=S.g('games')||[];const g=gm.find(x=>x.name===o.game);
  document.getElementById('roid').textContent=o.id;document.getElementById('rgic').innerHTML=g?TH(g,true):'';
  document.getElementById('rgnm').textContent=o.game;document.getElementById('rgpk').textContent=o.pkg;
  document.getElementById('ruid').textContent=o.uid;document.getElementById('rpay').textContent=o.pay;
  document.getElementById('rprice').textContent=o.price+' ກີບ';
  const rdr=document.getElementById('rdiscrow');const da=o.discount||0;
  if(da>0){rdr.style.display='flex';document.getElementById('rdisc').textContent='-'+parseInt(da).toLocaleString()+' ກີບ';}else{rdr.style.display='none';}
  document.getElementById('rtotal').textContent=(o.total||o.price)+' ກີບ';
  document.getElementById('rtime').textContent=o.time;
  const el=document.getElementById('rstatEl');el.textContent=o.status==='done'?'ສຳເລັດ':o.status==='failed'?'ລົ້ມ':'ລໍຖ້າ';el.className='rval '+(o.status==='done'?'done':'pend');go('receipt');
}
function rHelp(){
  const ct=S.g('contacts')||{};const card=document.getElementById('ctCard');const items=[];
  if(ct.fb)items.push({cls:'fb',ico:'<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>',name:'Facebook',url:ct.fb});
  if(ct.tt)items.push({cls:'tt',ico:'<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.83 1.55V6.79a4.85 4.85 0 01-1.06-.1z"/></svg>',name:'TikTok',url:ct.tt});
  if(ct.wa)items.push({cls:'wa',ico:'<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.99 2C6.472 2 2 6.473 2 12c0 1.99.588 3.84 1.596 5.4L2 22l4.74-1.577A9.966 9.966 0 0011.99 22c5.519 0 9.99-4.473 9.99-9.99C21.98 6.473 17.51 2 11.99 2z"/></svg>',name:'WhatsApp',url:ct.wa});
  if(!items.length){card.innerHTML='<div class="help-empty"><p>ຍັງບໍ່ມີຊ່ອງທາງຕິດຕໍ່</p><p class="sub">Admin ກະລຸນາໃສ່ຂໍ້ມູນໃນ Admin Panel</p></div>';return;}
  const subs={fb:'ຕິດຕໍ່ຜ່ານ Facebook',tt:'ຕິດຕໍ່ຜ່ານ TikTok',wa:'ສົ່ງຂໍ້ຄວາມ WhatsApp'};
  card.innerHTML=items.map(it=>`<a class="ct-item" href="${it.url}" target="_blank"><div class="ct-ico ${it.cls}">${it.ico}</div><div style="flex:1"><div class="ct-name">${it.name}</div><div class="ct-sub">${subs[it.cls]||''}</div></div><span class="ct-arr">&#8250;</span></a>`).join('');
}

/* ADMIN */
async function openAdm(){
  if(!CU||!CU.isAdmin){toast('Admin ເທົ່ານັ້ນ','err');return;}
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on','back'));
  document.getElementById('botN').style.display='none';document.getElementById('vAdm').style.display='block';
  await Promise.all([loadAllOrders(),loadAllUsers()]);rAdmD();
}
function exitAdm(){document.getElementById('vAdm').style.display='none';go('home','back');document.getElementById('botN').style.display='flex';}
function aT(n,el){document.querySelectorAll('.admt').forEach(t=>t.classList.remove('on'));el.classList.add('on');document.querySelectorAll('.asec').forEach(s=>s.classList.remove('on'));document.getElementById('as-'+n).classList.add('on');if(n==='ban')rBanA();if(n==='games')rGamA();if(n==='popup')rPupA();if(n==='coupon')rCouponA();if(n==='ord')rOrdA();if(n==='usr')rUsrA();if(n==='ct')rCtA();}
function rAdmD(){const gm=S.g('games')||[],bns=S.g('bans')||[],ords=S.g('orders')||[],users=S.g('users')||[],pk=S.g('pkgs')||{};let tp=0;Object.values(pk).forEach(a=>tp+=a.length);['sG','sB','sP','sO','sU'].forEach((id,i)=>{const v=[gm.length,bns.length,tp,ords.length,users.length];document.getElementById(id).textContent=v[i];});}
/* BANNER */
function rBanA(){const bans=S.g('bans')||[];document.getElementById('bA').innerHTML=bans.map((b,i)=>`<div class="irow"><div class="ric">${b.url?`<img src="${b.url}">`:`<div class="rph" style="background:${b.col}">${b.title[0]}</div>`}</div><div class="rinf"><div class="rnm">${b.title}</div><div class="rsb" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px">${b.url||'ບໍ່ມີຮູບ'}</div></div><div class="rack"><button class="bed" onclick="editBan(${i})">ແກ້ໄຂ</button><button class="bdl" onclick="delBan(${i})">ລຶບ</button></div></div>`).join('');}
function editBan(i){const bans=S.g('bans')||[];const b=bans[i];openEdit('Banner',`<label>ຫົວຂໍ້</label><input type="text" id="f-t" value="${b.title}"><label>URL ຮູບ</label><input type="text" id="f-u" value="${b.url||''}"><label>ຄຳອະທິບາຍ</label><input type="text" id="f-s" value="${b.sub||''}">`,async()=>{bans[i]={...b,title:V('f-t')||b.title,url:V('f-u'),sub:V('f-s')};S.s('bans',bans);rBanA();rBanner();try{await sb.from('banners').upsert(bans[i]);}catch(e){}toast('ອັບເດດ','ok');});}
function addBan(){const bans=S.g('bans')||[];openEdit('ເພີ່ມ Banner',`<label>ຫົວຂໍ້</label><input type="text" id="f-t" placeholder="ຊື່"><label>URL ຮູບ</label><input type="text" id="f-u" placeholder="https://..."><label>ຄຳອະທິບາຍ</label><input type="text" id="f-s" placeholder="ຄຳອະທິບາຍ">`,async()=>{const nm=V('f-t');if(!nm){toast('ໃສ່ຊື່','warn');return;}const nb={id:Date.now(),title:nm,url:V('f-u'),sub:V('f-s'),col:'linear-gradient(135deg,#e8192c,#ff6b35)'};bans.push(nb);S.s('bans',bans);rBanA();rBanner();try{await sb.from('banners').insert(nb);}catch(e){}toast('ເພີ່ມ','ok');});}
async function delBan(i){if((S.g('bans')||[]).length<=1){toast('ຕ້ອງ 1','warn');return;}const bans=S.g('bans')||[];const b=bans[i];bans.splice(i,1);S.s('bans',bans);rBanA();rBanner();try{await sb.from('banners').delete().eq('id',b.id);}catch(e){console.warn(e);}toast('ລຶບ Banner','ok');}
/* GAMES+PKG */
function rGamA(){
  const gm=S.g('games')||[];const pk=S.g('pkgs')||{};const el=document.getElementById('gA');
  el.innerHTML=gm.map((g,gi)=>{const pkgs=pk[g.id]||[];
    return `<div class="gitem"><div class="gitem-head" onclick="toggleGitem(${gi})"><div class="ric">${g.img?`<img src="${g.img}">`:`<div class="rph" style="background:${g.col}">${g.e}</div>`}</div><div class="rinf"><div class="rnm">${g.name}</div><div class="rsb">${g.pop?'⭐ ':''} ${pkgs.length} Pkgs${g.bg_img?' · 🖼BG':''}</div></div><div class="rack"><button class="bed" onclick="event.stopPropagation();editGame(${gi})">ແກ້ໄຂ</button><button class="bdl" onclick="event.stopPropagation();delGame(${gi})">ລຶບ</button></div></div><div class="gitem-body" id="gb-${gi}"><div class="pkg-sub"><div class="pkg-sub-title">Package (${pkgs.length})</div>${pkgs.map((p,pi)=>`<div class="pkg-row"><div class="${p.img?'':'prph'}">${p.img?`<img src="${p.img}" style="width:32px;height:32px;border-radius:8px;object-fit:cover">`:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20"/></svg>`}</div><div class="pri"><div class="prn" style="font-size:12px;font-weight:700;color:var(--t)">${p.name}</div><div class="prp">${p.price} ກີບ</div></div><div class="pract" style="display:flex;gap:4px"><button class="bed" style="font-size:11px;padding:4px 8px" onclick="editPkg(${g.id},${pi})">ແກ້</button><button class="bdl" style="font-size:11px;padding:4px 8px" onclick="delPkg(${g.id},${pi})">ລຶບ</button></div></div>`).join('')}<button class="bad" style="margin-top:6px;font-size:12px;padding:8px 14px" onclick="addPkg(${g.id})">+ Package</button></div></div></div>`;
  }).join('');
}
function toggleGitem(i){const el=document.getElementById('gb-'+i);if(el)el.classList.toggle('on');}
function editGame(i){
  const gm=S.g('games')||[];const g=gm[i];
  openEdit('ແກ້ໄຂ: '+g.name,`<label>ຊື່ເກມ</label><input type="text" id="f-n" value="${g.name}"><label>ຄຳອະທິບາຍ</label><input type="text" id="f-d" value="${g.desc||''}"><label>URL ໂລໂກ</label><input type="text" id="f-i" value="${g.img||''}" placeholder="https://..."><label>URL ພື້ນຫຼັງ (bg_img)</label><input type="text" id="f-bg" value="${g.bg_img||''}" placeholder="https://... (ຮູບພາບດ້ານຫຼັງ)"><label>Emoji</label><input type="text" id="f-e" value="${g.e||''}"><div class="swrow"><label class="sw"><input type="checkbox" id="f-p" ${g.pop?'checked':''}><span class="swsl"></span></label><span style="font-size:13px;font-weight:600">ຍອດນິຍົມ</span></div>`,async()=>{gm[i]={...g,name:V('f-n')||g.name,desc:V('f-d'),img:V('f-i'),bg_img:V('f-bg'),e:V('f-e')||g.e,pop:document.getElementById('f-p').checked};S.s('games',gm);rGamA();rHome();try{await sb.from('games').upsert(gm[i]);}catch(e){}toast('ອັບເດດ','ok');});}
function addGame(){const cols=['linear-gradient(135deg,#e8192c,#ff6b35)','linear-gradient(135deg,#1a6fc4,#00c4ff)','linear-gradient(135deg,#8e44ad,#3498db)','linear-gradient(135deg,#166534,#16a34a)'];openEdit('ເພີ່ມເກມ',`<label>ຊື່ເກມ</label><input type="text" id="f-n" placeholder="ຊື່ເກມ"><label>ຄຳອະທິບາຍ</label><input type="text" id="f-d" placeholder="ຄຳອະທິບາຍ"><label>URL ໂລໂກ</label><input type="text" id="f-i" placeholder="https://..."><label>URL ພື້ນຫຼັງ (bg_img)</label><input type="text" id="f-bg" placeholder="https://..."><label>Emoji</label><input type="text" id="f-e" placeholder="FF"><div class="swrow"><label class="sw"><input type="checkbox" id="f-p"><span class="swsl"></span></label><span style="font-size:13px;font-weight:600">ຍອດນິຍົມ</span></div>`,async()=>{const nm=V('f-n');if(!nm){toast('ໃສ່ຊື່','warn');return;}const gm=S.g('games')||[];const id=Date.now();const ng={id,name:nm,desc:V('f-d'),img:V('f-i'),bg_img:V('f-bg'),e:V('f-e')||'',col:cols[gm.length%cols.length],pop:document.getElementById('f-p').checked};gm.push(ng);S.s('games',gm);const pk=S.g('pkgs')||{};pk[id]=[];S.s('pkgs',pk);rGamA();rHome();try{await sb.from('games').insert(ng);}catch(e){}toast('ເພີ່ມ','ok');});}
async function delGame(i){if(!confirm('ລຶບ?'))return;const gm=S.g('games')||[];const g=gm[i];gm.splice(i,1);S.s('games',gm);rGamA();rHome();try{await sb.from('packages').delete().eq('game_id',g.id);await sb.from('games').delete().eq('id',g.id);}catch(e){console.warn(e);}toast('ລຶບເກມ','ok');}
function addPkg(gid){openEdit('ເພີ່ມ Package',`<label>ຊື່</label><input type="text" id="f-n" placeholder="100 Diamond"><label>ລາຄາ (ກີບ)</label><input type="text" id="f-p2" placeholder="20,000"><label>URL ຮູບ</label><input type="text" id="f-i" placeholder="https://...">`,async()=>{const nm=V('f-n');if(!nm){toast('ໃສ່ຊື່','warn');return;}const pk=S.g('pkgs')||{};if(!pk[gid])pk[gid]=[];const np={id:Date.now(),name:nm,price:V('f-p2'),img:V('f-i'),game_id:gid};pk[gid].push(np);S.s('pkgs',pk);rGamA();try{await sb.from('packages').insert(np);}catch(e){}toast('ເພີ່ມ Package','ok');});}
function editPkg(gid,i){const pk=S.g('pkgs')||{};const p=(pk[gid]||[])[i];openEdit('ແກ້ Package',`<label>ຊື່</label><input type="text" id="f-n" value="${p.name}"><label>ລາຄາ</label><input type="text" id="f-p2" value="${p.price}"><label>URL ຮູບ</label><input type="text" id="f-i" value="${p.img||''}">`,async()=>{pk[gid][i]={...p,name:V('f-n')||p.name,price:V('f-p2')||p.price,img:V('f-i')};S.s('pkgs',pk);rGamA();try{await sb.from('packages').upsert(pk[gid][i]);}catch(e){}toast('ອັບເດດ','ok');});}
async function delPkg(gid,i){const pk=S.g('pkgs')||{};const p=pk[gid][i];pk[gid].splice(i,1);S.s('pkgs',pk);rGamA();try{await sb.from('packages').delete().eq('id',p.id);}catch(e){console.warn(e);}toast('ລຶບ Package','ok');}
/* POPUP ADMIN */
function rPupA(){const pups=(S.g('popups')||[]).sort((a,b)=>a.order-b.order);const el=document.getElementById('pupAdm');el.innerHTML=pups.length?pups.map((p,i)=>`<div class="irow"><div class="ric">${p.url?`<img src="${p.url}" onerror="this.style.display='none'">`:`<div class="rph"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`}</div><div class="rinf"><div class="rnm">Popup #${p.order}</div><div class="rsb" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px">${p.url||'ບໍ່ມີຮູບ'}</div></div><div class="rack"><button class="bed" onclick="editPup(${i})">ແກ້ໄຂ</button><button class="bdl" onclick="delPup(${i})">ລຶບ</button></div></div>`).join(''):'<div class="empty" style="padding:20px"><p>ຍັງບໍ່ມີ Popup</p></div>';}
function addPup(){openEdit('ເພີ່ມ Popup',`<label>URL ຮູບ Popup *</label><input type="text" id="f-u" placeholder="https://..."><label>ລິງຄ໌ (optional)</label><input type="text" id="f-l" placeholder="https://..."><label>ລຳດັບ (1=ທຳອິດ)</label><input type="number" id="f-o" value="1" min="1">`,()=>{const url=V('f-u');if(!url){toast('ໃສ່ URL','warn');return;}const pups=S.g('popups')||[];pups.push({id:Date.now(),url,link:V('f-l'),order:parseInt(document.getElementById('f-o').value)||1});S.s('popups',pups);rPupA();toast('ເພີ່ມ Popup','ok');});}
function editPup(i){const pups=S.g('popups')||[];const p=pups[i];openEdit('ແກ້ Popup',`<label>URL ຮູບ</label><input type="text" id="f-u" value="${p.url||''}"><label>ລິງຄ໌</label><input type="text" id="f-l" value="${p.link||''}"><label>ລຳດັບ</label><input type="number" id="f-o" value="${p.order}" min="1">`,()=>{pups[i]={...p,url:V('f-u'),link:V('f-l'),order:parseInt(document.getElementById('f-o').value)||1};S.s('popups',pups);rPupA();toast('ອັບເດດ','ok');});}
function delPup(i){const pups=S.g('popups')||[];pups.splice(i,1);S.s('popups',pups);rPupA();toast('ລຶບ');}

/* COUPON ADMIN */
function rCouponA(){
  const coupons=S.g('coupons')||[];const el=document.getElementById('couponList');
  el.innerHTML=coupons.length?coupons.map((c,i)=>`<div class="irow"><div class="rinf"><div class="rnm" style="font-family:monospace">${c.code}</div><div class="rsb">${c.type==='percent'?`ຫຼຸດ ${c.value}%`:`ຫຼຸດ ${parseInt(c.value).toLocaleString()} ກີບ`} · ${c.active?'<span style="color:#16a34a">ໃຊ້ໄດ້</span>':'<span style="color:var(--R)">ປິດ</span>'}</div></div><div class="rack"><button class="bed" onclick="toggleCoupon(${i})">${c.active?'ປິດ':'ເປີດ'}</button><button class="bdl" onclick="delCoupon(${i})">ລຶບ</button></div></div>`).join(''):'<div class="empty" style="padding:16px"><p>ຍັງບໍ່ມີໂຄ້ດ</p></div>';
}
function addCoupon(){openEdit('ສ້າງໂຄ້ດສ່ວນລົດ',`<label>ໂຄ້ດ (ຕົວໃຫຍ່)</label><input type="text" id="f-code" placeholder="SAVE20" style="text-transform:uppercase"><label>ປະເພດ</label><select id="f-type"><option value="percent">ຫຼຸດເປີເຊັນ (%)</option><option value="fixed">ຫຼຸດລາຄາ (ກີບ)</option></select><label>ຄ່າ (ໃສ່ຕົວເລກ)</label><input type="number" id="f-val" placeholder="10 = 10% ຫຼື 5000 = 5,000 ກີບ" min="1">`,async()=>{const code=V('f-code').toUpperCase();if(!code){toast('ໃສ່ໂຄ້ດ','warn');return;}const val=parseFloat(document.getElementById('f-val').value)||0;if(val<=0){toast('ໃສ່ຄ່າ','warn');return;}const coupons=S.g('coupons')||[];if(coupons.find(c=>c.code===code)){toast('ໂຄ້ດນີ້ມີຢູ່ແລ້ວ','warn');return;}const nc={id:Date.now(),code,type:document.getElementById('f-type').value,value:val,active:true};coupons.push(nc);S.s('coupons',coupons);rCouponA();try{await sb.from('coupons').insert(nc);}catch(e){}toast('ສ້າງໂຄ້ດ','ok');});}
async function toggleCoupon(i){const c=S.g('coupons')||[];c[i].active=!c[i].active;S.s('coupons',c);rCouponA();try{await sb.from('coupons').update({active:c[i].active}).eq('id',c[i].id);}catch(e){}toast(c[i].active?'ເປີດໂຄ້ດ':'ປິດໂຄ້ດ','ok');}
async function delCoupon(i){if(!confirm('ລຶບ?'))return;const c=S.g('coupons')||[];c.splice(i,1);S.s('coupons',c);rCouponA();}

/* ORDERS */
function rOrdA(){const ords=S.g('orders')||[];const list=document.getElementById('oA');if(!ords.length){list.innerHTML='<div class="empty"><p>ຍັງບໍ່ມີ</p></div>';return;}list.innerHTML=ords.map((o,i)=>`<div class="irow" style="flex-wrap:wrap;gap:8px"><div class="rinf" style="width:100%"><div class="rnm">${o.id}</div><div class="rsb">${o.game} · ${o.pkg} · ${o.price}${o.discount&&o.discount>0?' → '+o.total:''} ກີບ</div><div class="rsb">UID: ${o.uid} · ${o.userId} · ${o.time}</div></div><div style="display:flex;gap:6px"><select onchange="upOS(${i},this.value)" style="border:1.5px solid var(--br);border-radius:8px;padding:6px 10px;font-size:12px;background:var(--bg3);color:var(--t)"><option value="pending" ${o.status==='pending'?'selected':''}>ລໍຖ້າ</option><option value="done" ${o.status==='done'?'selected':''}>ສຳເລັດ</option><option value="failed" ${o.status==='failed'?'selected':''}>ລົ້ມ</option></select><button class="bdl" onclick="delOrd(${i})">ລຶບ</button></div></div>`).join('');}
async function upOS(i,v){const o=S.g('orders')||[];o[i].status=v;S.s('orders',o);try{await sb.from('orders').update({status:v}).eq('id',o[i].id);}catch(e){}rOrdA();toast('ອັບເດດ','ok');}
async function delOrd(i){if(!confirm('ລຶບ?'))return;const o=S.g('orders')||[];const ord=o[i];o.splice(i,1);S.s('orders',o);rOrdA();try{await sb.from('orders').delete().eq('id',ord.id);}catch(e){console.warn(e);}toast('ລຶບ Order','ok');}
/* USERS */
function rUsrA(){const users=S.g('users')||[];const ords=S.g('orders')||[];const list=document.getElementById('uA');if(!users.length){list.innerHTML='<div class="empty"><p>ຍັງບໍ່ມີ</p></div>';return;}list.innerHTML=users.map((u,i)=>{const cnt=ords.filter(o=>o.userId===u.email).length;const rl=u.role==='admin'?`<span class="role-admin">Admin</span>`:`<span class="role-user">User</span>`;return `<div class="adurow"><div class="aduav">${u.name[0].toUpperCase()}</div><div class="rinf"><div class="rnm">${u.name} ${rl}</div><div class="rsb">${u.email} · ${cnt} Orders · Wallet: ${u.wallet||0} ກີບ</div></div><div style="display:flex;gap:4px"><button class="bed" style="font-size:11px;padding:5px 9px" onclick="editUser(${i})">ແກ້</button></div></div>`;}).join('');}
function editUser(i){const users=S.g('users')||[];const u=users[i];openEdit('ຈັດການ: '+u.name,`<label>Wallet (ກີບ)</label><input type="number" id="f-w" value="${u.wallet||0}" min="0"><label>Role</label><select id="f-r"><option value="user" ${(u.role||'user')==='user'?'selected':''}>User</option><option value="admin" ${u.role==='admin'?'selected':''}>Admin</option></select>`,async()=>{users[i]={...u,wallet:parseInt(document.getElementById('f-w').value)||0,role:document.getElementById('f-r').value};S.s('users',users);rUsrA();try{await sb.from('users').update({wallet:users[i].wallet,role:users[i].role}).eq('email',u.email);}catch(e){}toast('ອັບເດດ','ok');});}
/* CONTACTS */
function rCtA(){const ct=S.g('contacts')||{};document.getElementById('ctFB').value=ct.fb||'';document.getElementById('ctTT').value=ct.tt||'';document.getElementById('ctWA').value=ct.wa||'';}
async function saveContacts(){const ct={fb:document.getElementById('ctFB').value,tt:document.getElementById('ctTT').value,wa:document.getElementById('ctWA').value};S.s('contacts',ct);try{await sb.from('settings').upsert({key:'contacts',value:ct});}catch(e){}toast('ບັນທຶກແລ້ວ','ok');}
/* EDIT SHEET */
let eSvFn=null;
function V(id){return(document.getElementById(id)&&document.getElementById(id).value||'').trim();}
function openEdit(title,html,fn){document.getElementById('etitle').textContent=title;document.getElementById('efields').innerHTML=html;eSvFn=fn;document.getElementById('esv').onclick=()=>{fn&&fn();cEdit();};document.getElementById('eov').classList.add('on');}
function cEdit(){document.getElementById('eov').classList.remove('on');}
/* Supabase helpers */
async function loadAllOrders(){try{const {data}=await sb.from('orders').select('*').order('time',{ascending:false});S.s('orders',data||[]);}catch(e){console.warn('orders load err',e);}}
async function loadAllUsers(){try{const {data}=await sb.from('users').select('*');S.s('users',data||[]);}catch(e){console.warn('users load err',e);}}

window.onload=async()=>{
  await initDB();loadSess();go('home');showPopups();
  setTimeout(()=>{const l=document.getElementById('loader');if(l)l.classList.add('hide');},600);
};