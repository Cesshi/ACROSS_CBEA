const TIMES=["7:00–8:00 AM","8:00–9:00 AM","9:00–10:00 AM","10:00–11:00 AM","11:00 AM–12:00 PM","12:00–1:00 PM","1:00–2:00 PM","2:00–3:00 PM","3:00–4:00 PM","4:00–5:00 PM","5:00–6:00 PM","6:00–7:00 PM"];
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat"];
const PALETTE_L=[
  {bg:"#FEF0E0",border:"#F47920",text:"#C05010"},
  {bg:"#E6F0EA",border:"#1A5C2A",text:"#1A5C2A"},
  {bg:"#FEF8E0",border:"#C8980A",text:"#8A6408"},
  {bg:"#E8EEF8",border:"#1A3C6C",text:"#1A3C6C"},
  {bg:"#FDE8E8",border:"#C02828",text:"#8A1A1A"},
  {bg:"#E8F4F0",border:"#1A7060",text:"#0E4A3A"},
  {bg:"#F8EAF8",border:"#8C3A8C",text:"#5A205A"},
  {bg:"#FFF0D8",border:"#D4780A",text:"#8A4A08"},
];
const PALETTE_D=[
  {bg:"#3A1E08",border:"#F4922A",text:"#F4B870"},
  {bg:"#0E2818",border:"#4CAF68",text:"#70D890"},
  {bg:"#302008",border:"#F5D048",text:"#F5E080"},
  {bg:"#0E1828",border:"#6B98E8",text:"#90B8F8"},
  {bg:"#300E0E",border:"#E85050",text:"#F07878"},
  {bg:"#0E2820",border:"#40A888",text:"#60C8A8"},
  {bg:"#280E28",border:"#B870B8",text:"#D898D8"},
  {bg:"#281808",border:"#D88828",text:"#F0A848"},
];

let rooms=[
  {id:1,name:"CBEA 101",type:"Lecture Room",cap:45,floor:"Ground Floor"},
  {id:2,name:"CBEA 102",type:"Lecture Room",cap:45,floor:"Ground Floor"},
  {id:3,name:"CBEA 103",type:"Lecture Room",cap:45,floor:"Ground Floor"},
  {id:4,name:"CBEA 104",type:"Lecture Room",cap:45,floor:"Ground Floor"},
  {id:5,name:"CBEA 105",type:"Lecture Room",cap:40,floor:"Ground Floor"},
  {id:6,name:"CBEA 106",type:"Lecture Room",cap:40,floor:"Ground Floor"},
  {id:7,name:"CBEA 107",type:"Lecture Room",cap:40,floor:"Ground Floor"},
  {id:8,name:"CBEA 108",type:"Lecture Room",cap:40,floor:"Ground Floor"},
  {id:9,name:"CBEA 201",type:"Lecture Room",cap:50,floor:"2nd Floor"},
  {id:10,name:"CBEA 202",type:"Lecture Room",cap:50,floor:"2nd Floor"},
  {id:11,name:"CBEA 203",type:"Lecture Room",cap:50,floor:"2nd Floor"},
  {id:12,name:"CBEA 204",type:"Lecture Room",cap:50,floor:"2nd Floor"},
  {id:13,name:"CBEA 205",type:"Lecture Room",cap:45,floor:"2nd Floor"},
  {id:14,name:"CBEA 206",type:"Lecture Room",cap:45,floor:"2nd Floor"},
  {id:15,name:"CBEA 207",type:"Lecture Room",cap:45,floor:"2nd Floor"},
  {id:16,name:"CBEA 208",type:"Lecture Room",cap:45,floor:"2nd Floor"},
  {id:17,name:"CBEA 301",type:"Lecture Room",cap:60,floor:"3rd Floor"},
  {id:18,name:"CBEA 302",type:"Lecture Room",cap:60,floor:"3rd Floor"},
  {id:19,name:"CBEA 303",type:"Lecture Room",cap:55,floor:"3rd Floor"},
  {id:20,name:"CBEA 304",type:"Lecture Room",cap:55,floor:"3rd Floor"},
  {id:21,name:"CBEA 305",type:"Lecture Room",cap:50,floor:"3rd Floor"},
  {id:22,name:"CBEA 306",type:"Lecture Room",cap:50,floor:"3rd Floor"},
  {id:23,name:"Computer Lab A",type:"Computer Lab",cap:35,floor:"Ground Floor"},
  {id:24,name:"Computer Lab B",type:"Computer Lab",cap:35,floor:"Ground Floor"},
  {id:25,name:"Computer Lab C",type:"Computer Lab",cap:35,floor:"Ground Floor"},
  {id:26,name:"Computer Lab D",type:"Computer Lab",cap:35,floor:"Ground Floor"},
  {id:27,name:"Computer Lab E",type:"Computer Lab",cap:30,floor:"2nd Floor"},
  {id:28,name:"Computer Lab F",type:"Computer Lab",cap:30,floor:"2nd Floor"},
  {id:29,name:"Accounting Lab 1",type:"Computer Lab",cap:40,floor:"2nd Floor"},
  {id:30,name:"Accounting Lab 2",type:"Computer Lab",cap:40,floor:"2nd Floor"},
  {id:31,name:"Finance Lab",type:"Computer Lab",cap:38,floor:"3rd Floor"},
  {id:32,name:"Economics Lab",type:"Computer Lab",cap:38,floor:"3rd Floor"},
  {id:33,name:"Conference Room A",type:"Conference Room",cap:20,floor:"Ground Floor"},
  {id:34,name:"Conference Room B",type:"Conference Room",cap:20,floor:"Ground Floor"},
  {id:35,name:"Conference Room C",type:"Conference Room",cap:15,floor:"2nd Floor"},
  {id:36,name:"Conference Room D",type:"Conference Room",cap:15,floor:"2nd Floor"},
  {id:37,name:"Conference Room E",type:"Conference Room",cap:12,floor:"3rd Floor"},
  {id:38,name:"Board Room",type:"Conference Room",cap:25,floor:"3rd Floor"},
  {id:39,name:"Faculty Lounge",type:"Conference Room",cap:30,floor:"2nd Floor"},
  {id:40,name:"Dean's Conference Room",type:"Conference Room",cap:18,floor:"3rd Floor"},
  {id:41,name:"Auditorium A",type:"Function Hall",cap:200,floor:"Ground Floor"},
  {id:42,name:"Auditorium B",type:"Function Hall",cap:150,floor:"Ground Floor"},
  {id:43,name:"AVR 1",type:"Function Hall",cap:80,floor:"Ground Floor"},
  {id:44,name:"AVR 2",type:"Function Hall",cap:80,floor:"Ground Floor"},
  {id:45,name:"AVR 3",type:"Function Hall",cap:60,floor:"2nd Floor"},
  {id:46,name:"AVR 4",type:"Function Hall",cap:60,floor:"2nd Floor"},
  {id:47,name:"Seminar Hall A",type:"Function Hall",cap:100,floor:"3rd Floor"},
  {id:48,name:"Seminar Hall B",type:"Function Hall",cap:100,floor:"3rd Floor"},
  {id:49,name:"Mini Theater",type:"Function Hall",cap:120,floor:"Ground Floor"},
  {id:50,name:"Multi-Purpose Hall",type:"Function Hall",cap:250,floor:"Ground Floor"},
];
let bookings=(()=>{
  const B=[];let id=1;
  const profs=["Prof. Reyes","Prof. Cruz","Prof. Lim","Prof. Santos","Prof. Dela Cruz","Prof. Tan","Prof. Garcia","Prof. Flores","Prof. Mendoza","Prof. Bautista","Prof. Ramos","Prof. Villanueva","Prof. Castillo","Prof. Torres","Prof. Aquino","Prof. Navarro","Prof. Lopez","Prof. Hernandez","Prof. Gonzales","Prof. Perez"];
  const subjs=["Business Finance","Accounting 101","Macroeconomics","Marketing Mgmt","Human Resources","Quantitative Methods","Microeconomics","Business Law","Operations Mgmt","Financial Accounting","Auditing","Business Ethics","Statistics","Management Accounting","Cost Accounting","Taxation","Business Math","Economics","Entrepreneurship","Strategic Mgmt","Business Communication","Principles of Mgmt","Organizational Behavior","International Business","Business Research"];
  const groups=["BSA 1-A","BSA 1-B","BSA 2-A","BSA 2-B","BSA 3-A","BSA 3-B","BSA 4-A","BSA 4-B","BSBA 1-A","BSBA 1-B","BSBA 2-A","BSBA 2-B","BSBA 3-A","BSBA 3-B","BSBA 4-A","BS Econ 1","BS Econ 2","BS Econ 3","BSM 1-A","BSM 2-A","BSM 3-A","BSM 4-A","BSAIS 1","BSAIS 2","BSAIS 3"];
  const times=["7:00–8:00 AM","8:00–9:00 AM","9:00–10:00 AM","10:00–11:00 AM","11:00 AM–12:00 PM","1:00–2:00 PM","2:00–3:00 PM","3:00–4:00 PM","4:00–5:00 PM","5:00–6:00 PM"];
  const days=["Mon","Tue","Wed","Thu","Fri","Sat"];
  // Track used slots to avoid conflicts
  const used={};
  function tryAdd(roomName,day,time,prof,subj,group,notes=''){
    const key=roomName+'|'+day+'|'+time;
    if(used[key])return false;
    used[key]=true;
    B.push({id:id++,prof,subj,group,room:roomName,day,time,status:'approved',actionAt:null,notes});
    return true;
  }
  // Lecture rooms: heavy schedule Mon-Sat 7AM-5PM
  const lectureRooms=rooms.filter(r=>r.type==='Lecture Room');
  lectureRooms.forEach((room,ri)=>{
    days.forEach((day,di)=>{
      const slotsForDay=day==='Sat'?5:8;
      let filled=0;
      for(let ti=0;ti<times.length&&filled<slotsForDay;ti++){
        const seed=(ri*7+di*3+ti)%3;
        if(seed===0&&filled<slotsForDay-1){ti++;continue;}
        const pi=(ri+di+ti)%profs.length;
        const si=(ri*3+di+ti)%subjs.length;
        const gi=(ri+di*2+ti)%groups.length;
        if(tryAdd(room.name,day,times[ti],profs[pi],subjs[si],groups[gi])){filled++;}
      }
    });
  });
  // Computer labs: mostly Mon-Fri 8AM-5PM
  const labRooms=rooms.filter(r=>r.type==='Computer Lab');
  labRooms.forEach((room,ri)=>{
    ['Mon','Tue','Wed','Thu','Fri'].forEach((day,di)=>{
      let filled=0;
      for(let ti=1;ti<times.length&&filled<6;ti++){
        const seed=(ri+di+ti)%4;
        if(seed===0)continue;
        const pi=(ri*2+di+ti+5)%profs.length;
        const si=(ri+di*2+ti+10)%subjs.length;
        const gi=(ri*3+di+ti)%groups.length;
        if(tryAdd(room.name,day,times[ti],profs[pi],subjs[si],groups[gi])){filled++;}
      }
    });
    // Saturday half day
    ['Sat'].forEach(day=>{
      for(let ti=1;ti<5;ti++){
        const pi=(ri+ti+15)%profs.length;
        const si=(ri+ti+8)%subjs.length;
        const gi=(ri+ti+12)%groups.length;
        tryAdd(room.name,day,times[ti],profs[pi],subjs[si],groups[gi]);
      }
    });
  });
  // Conference rooms: meetings and faculty events
  const confRooms=rooms.filter(r=>r.type==='Conference Room');
  const meetingSubjs=["Faculty Meeting","Department Planning","Curriculum Review","Research Meeting","Advisory Board","Budget Review","Academic Council","Faculty Development","Thesis Defense","Capstone Defense","Program Review","Audit Committee"];
  const meetingGroups=["Finance Dept","Accounting Dept","Management Dept","Economics Dept","Dean's Office","College Council","Faculty Senate","Research Committee","Quality Assurance","Student Affairs"];
  confRooms.forEach((room,ri)=>{
    days.forEach((day,di)=>{
      const slots=day==='Sat'?1:3;
      let filled=0;
      for(let ti=0;ti<times.length&&filled<slots;ti++){
        const seed=(ri+di+ti)%3;
        if(seed===1)continue;
        const pi=(ri+di+ti)%profs.length;
        const si=ti%meetingSubjs.length;
        const gi=(ri+di)%meetingGroups.length;
        if(tryAdd(room.name,day,times[ti],profs[pi],meetingSubjs[si],meetingGroups[gi])){filled++;}
      }
    });
  });
  // Function halls: sporadic org events and seminars
  const hallRooms=rooms.filter(r=>r.type==='Function Hall');
  const orgSubjs=["General Assembly","JS Prom Planning","Financial Literacy Seminar","Leadership Training","Business Summit","Case Competition","Awards Night Rehearsal","Orientation","Enrollment Drive","Career Fair","Intramurals Briefing","Recognition Ceremony"];
  const orgGroups=["CBEA Student Council","Junior Finance Society","Accounting Students Org","Economics Society","Marketing Club","Entrepreneurship Circle","Business Management Society","Student Gov't","CBEA Faculty","SSG CBEA","Alumni Affairs","Dean's Office"];
  hallRooms.forEach((room,ri)=>{
    days.forEach((day,di)=>{
      const slots=1+(ri+di)%2;
      let filled=0;
      for(let ti=0;ti<times.length&&filled<slots;ti++){
        const seed=(ri*2+di+ti)%4;
        if(seed===0||seed===2)continue;
        const pi=(ri+di+ti+3)%profs.length;
        const si=(ri+di+ti)%orgSubjs.length;
        const gi=(ri*2+di)%orgGroups.length;
        if(tryAdd(room.name,day,times[ti],profs[pi],orgSubjs[si],orgGroups[gi])){filled++;}
      }
    });
  });
  // Add some pending requests
  B.push({id:id++,prof:"Prof. Aquino",subj:"Research Methods",group:"BSBA 4-A",room:"CBEA 101",day:"Mon",time:"6:00–7:00 PM",status:"pending",actionAt:null,notes:"Requesting late slot for working students."});
  B.push({id:id++,prof:"SSG President",subj:"General Assembly",group:"SSG CBEA",room:"Auditorium A",day:"Fri",time:"4:00–5:00 PM",status:"pending",actionAt:null,notes:"Annual General Assembly, need room for at least 150 students."});
  B.push({id:id++,prof:"Prof. Torres",subj:"Thesis Defense",group:"BSA 4-B",room:"Conference Room A",day:"Sat",time:"9:00–10:00 AM",status:"pending",actionAt:null,notes:""});
  return B;
})();
let editRoomId=null,editBookingId=null;
let selectedSlot={day:null,time:null};

// ── UTILS ──
const isDark=()=>document.documentElement.getAttribute('data-theme')==='dark';
const palette=()=>isDark()?PALETTE_D:PALETTE_L;
const getColor=i=>{const p=palette();return p[i%p.length]};
function fmtDate(iso){if(!iso)return'—';const d=new Date(iso);return d.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})+' '+d.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'});}
function showAlert(id,show){const el=document.getElementById(id);if(el){el.style.display=show?'':'none';el.classList.toggle('show',show);}}
function clearErr(id){const el=document.getElementById(id);if(el)el.classList.remove('err')}
function setErr(id){const el=document.getElementById(id);if(el)el.classList.add('err')}

// ── THEME ──
function toggleTheme(){
  const h=document.documentElement;
  h.setAttribute('data-theme',h.getAttribute('data-theme')==='dark'?'light':'dark');
  renderPubSched();renderVacantGrid();
  if(document.getElementById('screen-admin').classList.contains('active')){
    const ap=document.querySelector('.pg.active');
    if(ap&&ap.id==='apg-schedule')renderAdminSched();
  }
  if(document.getElementById('pub-room').value)renderRoomMiniCal();
}

// ── SCREENS ──
function goScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+id).classList.add('active');
  if(id==='landing'){populatePubSelects();renderPubSched();renderVacantGrid();}
  if(id==='admin'){initAdmin();}
}
function smoothScrollTo(id){const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
function scrollTo(id){smoothScrollTo(id);}

// ── TOOLTIP ──
const tip=document.getElementById('tooltip');
function showTip(e,b){
  document.getElementById('tt-subj').textContent=b.subj;
  document.getElementById('tt-room').textContent=b.room;
  document.getElementById('tt-prof').textContent=b.prof;
  document.getElementById('tt-group').textContent=b.group||'—';
  document.getElementById('tt-day').textContent=b.day;
  document.getElementById('tt-time').textContent=b.time;
  tip.classList.add('show');moveTip(e);
}
function moveTip(e){
  const tw=tip.offsetWidth||220,th=tip.offsetHeight||150;
  const vw=window.innerWidth,vh=window.innerHeight;
  let lx=e.clientX+14,ly=e.clientY+14;
  if(lx+tw>vw-10)lx=e.clientX-tw-10;
  if(ly+th>vh-10)ly=e.clientY-th-10;
  tip.style.left=lx+'px';tip.style.top=ly+'px';
}
function hideTip(){tip.classList.remove('show')}
document.addEventListener('mousemove',e=>{if(tip.classList.contains('show'))moveTip(e)});

// ── SCHEDULE BUILDER ──
const MAX_VISIBLE=4;

function buildChip(b,colorIdx){
  const c=getColor(colorIdx);
  const chip=document.createElement('div');
  chip.className='slot-chip'+(b.status==='pending'?' pending':'');
  chip.style.cssText=`background:${c.bg};border-left-color:${c.border};color:${c.text}`;
  chip.innerHTML=`<div class="chip-s">${b.subj}</div><div class="chip-r">${b.room}</div>`;
  chip.addEventListener('mouseenter',e=>showTip(e,b));
  chip.addEventListener('mouseleave',hideTip);
  return chip;
}
function buildSchedTable(headEl,bodyEl,roomFilter){
  headEl.innerHTML=`<th class="time-th">Time</th>`+DAYS.map(d=>`<th>${d}</th>`).join('');
  bodyEl.innerHTML='';
  TIMES.forEach(t=>{
    const tr=document.createElement('tr');
    const tc=document.createElement('td');
    tc.className='time-col';tc.textContent=t;
    tr.appendChild(tc);
    DAYS.forEach(d=>{
      const bks=bookings.filter(b=>b.time===t&&b.day===d&&(!roomFilter||b.room===roomFilter)&&b.status!=='rejected');
      const td=document.createElement('td');
      td.className='day-cell';
      const inner=document.createElement('div');
      inner.className='cell-inner';
      const visible=bks.slice(0,MAX_VISIBLE);
      const overflow=bks.slice(MAX_VISIBLE);
      visible.forEach((b,i)=>inner.appendChild(buildChip(b,i)));
      if(overflow.length>0){
        const more=document.createElement('div');
        more.className='slot-more';
        more.textContent=`+${overflow.length}`;
        more.title=`${overflow.length} more — click to view all`;
        more.addEventListener('click',e=>{e.stopPropagation();openSlotPopup(bks,t,d,e);});
        inner.appendChild(more);
      }
      td.appendChild(inner);
      tr.appendChild(td);
    });
    bodyEl.appendChild(tr);
  });
}

// ── PUBLIC SCHEDULE ──
function renderPubSched(){
  buildSchedTable(
    document.getElementById('pub-sched-hd'),
    document.getElementById('pub-sched-bd'),
    document.getElementById('pub-room-f').value
  );
}

// ── VACANT ──
let vacantTypeFilter='';
let vacantAvailFilter='all';
function setVacantType(type,btn){
  vacantTypeFilter=type;
  document.querySelectorAll('[data-type]').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderVacantGrid();
}
function setVacantAvail(avail,btn){
  vacantAvailFilter=avail;
  document.querySelectorAll('[data-avail]').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderVacantGrid();
}
function renderVacantGrid(){
  const grid=document.getElementById('vacant-grid');
  const searchEl=document.getElementById('vacant-search');
  const countEl=document.getElementById('vacant-count');
  const floorEl=document.getElementById('vacant-floor-filter');
  const search=(searchEl?searchEl.value:'').toLowerCase().trim();
  const floorFilter=floorEl?floorEl.value:'';
  // Populate floor dropdown
  if(floorEl){
    const floors=[...new Set(rooms.map(r=>r.floor))].sort();
    const cur=floorEl.value;
    floorEl.innerHTML='<option value="">All Locations</option>'+floors.map(f=>`<option value="${f}"${f===cur?' selected':''}>${f}</option>`).join('');
  }
  const approvedRooms=new Set(bookings.filter(b=>b.status==='approved').map(b=>b.room));
  let filtered=rooms.filter(r=>{
    if(search&&!r.name.toLowerCase().includes(search))return false;
    if(vacantTypeFilter&&r.type!==vacantTypeFilter)return false;
    if(floorFilter&&r.floor!==floorFilter)return false;
    if(vacantAvailFilter==='vacant'&&approvedRooms.has(r.name))return false;
    if(vacantAvailFilter==='reserved'&&!approvedRooms.has(r.name))return false;
    return true;
  });
  if(countEl)countEl.textContent=`Showing ${filtered.length} of ${rooms.length} rooms`;
  grid.innerHTML=filtered.length?filtered.map(r=>{
    const hasB=approvedRooms.has(r.name);
    const clickable=!hasB;
    return`<div class="v-room" style="${clickable?'cursor:pointer':''}"
      ${clickable?`onclick="_doSelectVacantRoom('${r.name.replace(/'/g,"\\'")}')"`:''}
      ${clickable?`onmouseover="this.style.borderColor='var(--green)';this.style.background='var(--gl)'" onmouseout="this.style.borderColor='';this.style.background=''"`:''}
      title="${clickable?'Click to request this room':''}">
      <div class="v-room-name">${r.name}</div>
      <div class="v-room-type">${r.type} · Cap. ${r.cap}</div>
      <div style="font-size:11px;color:var(--t3);margin-bottom:8px">${r.floor}</div>
      <span class="v-badge" style="${hasB?'background:var(--al);color:var(--amber)':''}">
        ${hasB?'Has Reservations':clickable?'Vacant — click to request':'Vacant'}
      </span>
    </div>`;
  }).join(''):`<p style="color:var(--t3);font-size:13px;padding:8px 0;grid-column:1/-1">No rooms match your filters.</p>`;
}
function toggleVacant(btn){
  const s=document.getElementById('vacant-section');
  const open=s.classList.toggle('open');
  btn.innerHTML=`<span class="dot"></span> ${open?'Hide':'Show'} Vacant Rooms`;
  if(open)renderVacantGrid();
}

// ── PUBLIC SELECTS ──
function populatePubSelects(){
  const pr=document.getElementById('pub-room');
  pr.innerHTML='<option value="">Select a room</option>'+rooms.map(r=>`<option>${r.name}</option>`).join('');
  const pf=document.getElementById('pub-room-f');
  pf.innerHTML='<option value="">All Rooms</option>'+rooms.map(r=>`<option>${r.name}</option>`).join('');
}

// ── MINI CALENDAR ──
// changeFromSlot: {day,time} of the existing reservation the user wants to change FROM
let changeFromSlot={day:null,time:null};

function renderRoomMiniCal(keepSlot=false){
  const room=document.getElementById('pub-room').value;
  const reqtype=document.getElementById('pub-reqtype').value;
  const cal=document.getElementById('room-mini-cal');
  const info=document.getElementById('pub-room-info');
  const summary=document.getElementById('change-summary');
  const prompt=document.getElementById('rmc-prompt');
  const legend=document.getElementById('rmc-legend');

  if(!keepSlot){
    selectedSlot={day:null,time:null};
    changeFromSlot={day:null,time:null};
    document.getElementById('pub-day').value='';
    document.getElementById('pub-time').value='';
    summary.classList.remove('show');
    showAlert('pub-conflict',false);
    showAlert('pub-warn',false);
  }

  if(!room){cal.classList.remove('show');showAlert('pub-room-info',true);return;}
  cal.classList.add('show');
  showAlert('pub-room-info',false);
  document.getElementById('rmc-head').textContent=`${room} — Weekly Availability`;

  // Prompt text and legend vary by mode
  if(reqtype==='change'){
    prompt.textContent='Step 1: Click your current reserved slot (highlighted in orange). Step 2: Click a vacant slot as your new preferred time.';
    prompt.classList.add('show');
    legend.innerHTML=`
      <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:var(--gl);border:1px solid var(--green);display:inline-block"></span>Vacant — select as new time</span>
      <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:var(--al);border:1.5px dashed var(--amber);display:inline-block"></span>Reserved — click to mark as "from"</span>
      <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:var(--red);display:inline-block"></span>Others' reservation — unavailable</span>
      <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:var(--green);display:inline-block"></span>Selected new slot</span>`;
  } else {
    prompt.classList.remove('show');
    legend.innerHTML=`
      <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:var(--gl);border:1px solid var(--green);display:inline-block"></span>Vacant — click to select</span>
      <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:var(--rl);border:1px solid var(--red);display:inline-block"></span>Reserved — unavailable</span>
      <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:var(--green);display:inline-block"></span>Selected</span>`;
  }

  const hd=document.getElementById('rmc-hd');
  const bd=document.getElementById('rmc-bd');
  hd.innerHTML=`<th class="rmc-time-th">Time</th>`+DAYS.map(d=>`<th>${d}</th>`).join('');
  bd.innerHTML='';

  TIMES.forEach(t=>{
    const tr=document.createElement('tr');
    const tc=document.createElement('td');
    tc.className='rmc-time';tc.textContent=t;
    tr.appendChild(tc);
    DAYS.forEach(d=>{
      const bk=bookings.find(b=>b.room===room&&b.day===d&&b.time===t&&b.status==='approved');
      const td=document.createElement('td');
      td.style.padding='0';

      if(bk){
        const div=document.createElement('div');
        const isFrom=changeFromSlot.day===d&&changeFromSlot.time===t;
        if(reqtype==='change'){
          div.className='rmc-cell-reserved own';
          div.textContent=isFrom?'◉ From':'Change?';
          div.title=`${bk.subj} — ${bk.prof} (click to mark as slot to change)`;
          div.style.background=isFrom?'#f5c842':null;
          div.style.color=isFrom?'#5a3a00':null;
          div.addEventListener('mouseenter',e=>showTip(e,bk));
          div.addEventListener('mouseleave',hideTip);
          div.addEventListener('click',()=>selectFromSlot(d,t,bk));
        } else {
          div.className='rmc-cell-reserved';
          div.textContent='Reserved';
          div.title=`${bk.subj} — ${bk.prof}`;
          div.addEventListener('mouseenter',e=>showTip(e,bk));
          div.addEventListener('mouseleave',hideTip);
        }
        td.appendChild(div);
      } else {
        const div=document.createElement('div');
        const isSelected=selectedSlot.day===d&&selectedSlot.time===t;
        // In change mode, vacant cells only become clickable after a "from" slot is picked
        if(reqtype==='change'&&!changeFromSlot.day){
          div.className='rmc-cell-vacant disabled-change';
          div.textContent='Vacant';
        } else {
          div.className='rmc-cell-vacant'+(isSelected?' selected':'');
          div.textContent=isSelected?'✓ Selected':'Vacant';
          div.addEventListener('click',()=>selectToSlot(d,t,room));
        }
        td.appendChild(div);
      }
      tr.appendChild(td);
    });
    bd.appendChild(tr);
  });

  // Update change summary
  if(reqtype==='change'){
    const hasfrom=changeFromSlot.day&&changeFromSlot.time;
    const hasto=selectedSlot.day&&selectedSlot.time;
    if(hasfrom||hasto){
      summary.classList.add('show');
      document.getElementById('cs-from').textContent=hasfrom
        ?`${room} · ${changeFromSlot.day} · ${changeFromSlot.time}`
        :'Not yet selected';
      document.getElementById('cs-to').textContent=hasto
        ?`${room} · ${selectedSlot.day} · ${selectedSlot.time}`
        :'Not yet selected — pick a vacant slot above';
    } else {
      summary.classList.remove('show');
    }
  } else {
    summary.classList.remove('show');
  }
}

function selectFromSlot(day,time,bk){
  // Mark this as the slot being changed FROM
  changeFromSlot={day,time};
  // Clear the TO slot when from changes
  selectedSlot={day:null,time:null};
  document.getElementById('pub-day').value='';
  document.getElementById('pub-time').value='';
  showAlert('pub-conflict',false);showAlert('pub-warn',false);
  renderRoomMiniCal(true);
  // show prompt update
  document.getElementById('rmc-prompt').textContent=`From slot selected: ${day} · ${time}. Now click a vacant slot below as your new preferred time.`;
}

function selectSlot(day,time,room){
  // New reservation mode
  selectedSlot={day,time};
  document.getElementById('pub-day').value=day;
  document.getElementById('pub-time').value=time;
  showAlert('pub-conflict',false);showAlert('pub-warn',false);
  renderRoomMiniCal(true);
}

function selectToSlot(day,time,room){
  const reqtype=document.getElementById('pub-reqtype').value;
  if(reqtype==='change'){
    selectedSlot={day,time};
    document.getElementById('pub-day').value=day;
    document.getElementById('pub-time').value=time;
  } else {
    selectSlot(day,time,room);
    return;
  }
  showAlert('pub-conflict',false);showAlert('pub-warn',false);
  renderRoomMiniCal(true);
}

// ── PUBLIC SUBMIT ──
function submitPubRequest(){
  const name=document.getElementById('pub-name').value.trim();
  const subj=document.getElementById('pub-subj').value.trim();
  const group=document.getElementById('pub-group').value.trim();
  const email=document.getElementById('pub-email').value.trim();
  const room=document.getElementById('pub-room').value;
  const day=document.getElementById('pub-day').value;
  const time=document.getElementById('pub-time').value;
  const notes=document.getElementById('pub-notes').value.trim();
  const reqtype=document.getElementById('pub-reqtype').value;
  let hasErr=false;
  ['pub-name','pub-subj','pub-group'].forEach(clearErr);
  showAlert('pub-conflict',false);showAlert('pub-warn',false);
  if(!name){setErr('pub-name');hasErr=true;}
  if(!subj){setErr('pub-subj');hasErr=true;}
  if(!group){setErr('pub-group');hasErr=true;}
  if(!room){document.getElementById('pub-warn-msg').textContent='Please select a room.';showAlert('pub-warn',true);hasErr=true;}
  if(!day||!time){document.getElementById('pub-warn-msg').textContent='Please select a time slot from the room calendar above.';showAlert('pub-warn',true);hasErr=true;}
  if(reqtype==='change'&&(!changeFromSlot.day||!changeFromSlot.time)){
    document.getElementById('pub-warn-msg').textContent='For a change request: first click your current reserved slot (orange) on the calendar, then select your new preferred vacant slot.';
    showAlert('pub-warn',true);hasErr=true;
  }
  if(hasErr)return;
  const conflict=bookings.find(b=>b.room===room&&b.day===day&&b.time===time&&b.status==='approved');
  if(conflict){
    document.getElementById('pub-conflict-msg').textContent=`${room} is already reserved on ${day} at ${time}. Please choose a different vacant slot.`;
    showAlert('pub-conflict',true);return;
  }
  const fromInfo=reqtype==='change'&&changeFromSlot.day?`\n[Change request — from: ${changeFromSlot.day} ${changeFromSlot.time}]`:'';
  bookings.push({id:Date.now(),prof:name,subj,group,email,room,day,time,notes:notes+fromInfo,status:'pending',actionAt:null});
  ['pub-name','pub-subj','pub-group','pub-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('pub-email').value='';
  document.getElementById('pub-room').selectedIndex=0;
  document.getElementById('pub-reqtype').selectedIndex=0;
  document.getElementById('pub-day').value='';
  document.getElementById('pub-time').value='';
  selectedSlot={day:null,time:null};
  changeFromSlot={day:null,time:null};
  document.getElementById('room-mini-cal').classList.remove('show');
  document.getElementById('change-summary').classList.remove('show');
  showAlert('pub-room-info',true);
  updateBadge();
  toast('✅ Request submitted. The scheduling head will review it.');
}

// ── LOGIN ──
function doLogin(){
  const u=document.getElementById('l-user').value.trim();
  const p=document.getElementById('l-pass').value;
  if(u==='admin'&&p==='admin123'){showAlert('l-err',false);goScreen('admin');}
  else showAlert('l-err',true);
}

// ── ADMIN INIT ──
function initAdmin(){
  populateAdminSelects();
  renderDashboard();renderAdminSched();renderRoomsTbl();renderBookingsTbl();renderReqTbl();
  updateBadge();
}
function showAdminPg(id,el){
  document.querySelectorAll('.pg').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.a-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('apg-'+id).classList.add('active');
  if(el)el.classList.add('active');
  if(id==='schedule')renderAdminSched();
  if(id==='rooms')renderRoomsTbl();
  if(id==='reservations')renderBookingsTbl();
  if(id==='requests')renderReqTbl();
  if(id==='dashboard')renderDashboard();
}
function populateAdminSelects(){
  const rNames=rooms.map(r=>r.name);
  document.getElementById('a-room-f').innerHTML='<option value="">All Rooms</option>'+rNames.map(n=>`<option>${n}</option>`).join('');
  document.getElementById('bk-room').innerHTML='<option value="">Select room</option>'+rNames.map(n=>`<option>${n}</option>`).join('');
  document.getElementById('bk-time').innerHTML='<option value="">Select time</option>'+TIMES.map(t=>`<option>${t}</option>`).join('');
}
function updateBadge(){
  const n=bookings.filter(b=>b.status==='pending').length;
  const b=document.getElementById('req-badge');
  if(b){b.textContent=n;b.style.display=n>0?'inline':'none';}
}
function renderDashboard(){
  const approved=bookings.filter(b=>b.status==='approved');
  const pending=bookings.filter(b=>b.status==='pending');
  const vacant=rooms.filter(r=>!approved.some(b=>b.room===r.name)).length;
  document.getElementById('ds-rooms').textContent=rooms.length;
  document.getElementById('ds-approved').textContent=approved.length;
  document.getElementById('ds-pending').textContent=pending.length;
  document.getElementById('ds-vacant').textContent=vacant;
  document.getElementById('dash-pending').innerHTML=pending.length
    ?pending.map(b=>`<tr><td>${b.prof}</td><td>${b.subj}</td><td>${b.room}</td><td>${b.day} · ${b.time}</td><td><span class="tag amber">pending</span></td><td><div class="acts"><button class="btn-a ok" onclick="approveB(${b.id})">Approve</button><button class="btn-a rej" onclick="rejectB(${b.id})">Reject</button></div></td></tr>`).join('')
    :`<tr><td colspan="6" class="empty">No pending requests.</td></tr>`;
}
function renderAdminSched(){
  buildSchedTable(document.getElementById('a-sched-hd'),document.getElementById('a-sched-bd'),document.getElementById('a-room-f').value);
}
function renderRoomsTbl(){
  document.getElementById('rooms-tbl').innerHTML=rooms.map(r=>{
    const hasB=bookings.some(b=>b.room===r.name&&b.status==='approved');
    return`<tr><td><strong>${r.name}</strong></td><td>${r.type}</td><td>${r.cap}</td><td>${r.floor}</td>
    <td><span class="tag ${hasB?'amber':'green'}">${hasB?'Has reservations':'Vacant'}</span></td>
    <td><div class="acts">
      <button class="btn-a ed" onclick="openRoomModal(${r.id})">Edit</button>
      <button class="btn-a dl" onclick="deleteRoom(${r.id})">Delete</button>
    </div></td></tr>`;
  }).join('');
}
function renderBookingsTbl(){
  const approved=bookings.filter(b=>b.status==='approved');
  document.getElementById('reservations-tbl').innerHTML=approved.length
    ?approved.map(b=>`<tr><td>${b.prof}</td><td>${b.subj}</td><td>${b.group||'—'}</td><td>${b.room}</td><td>${b.day}</td><td>${b.time}</td>
    <td><div class="acts">
      <button class="btn-a ed" onclick="openBookingModal(${b.id})">Edit</button>
      <button class="btn-a dl" onclick="deleteBooking(${b.id})">Delete</button>
    </div></td></tr>`).join('')
    :`<tr><td colspan="7" class="empty">No approved reservations.</td></tr>`;
}
// ── SLOT OVERFLOW POPUP ──
let slotPopupOpen=false;
function openSlotPopup(bks,time,day,e){
  hideTip();
  const popup=document.getElementById('slot-popup');
  document.getElementById('sp-title').textContent=`${day} · ${time}`;
  document.getElementById('sp-count').textContent=`${bks.length} reservation${bks.length>1?'s':''}`;
  const p=palette();
  document.getElementById('sp-list').innerHTML=bks.map((b,i)=>{
    const c=p[i%p.length];
    const statusColor=b.status==='approved'?'var(--green)':b.status==='pending'?'var(--amber)':'var(--red)';
    const statusBg=b.status==='approved'?'var(--gl)':b.status==='pending'?'var(--al)':'var(--rl)';
    return`<div class="slot-popup-item">
      <div class="slot-popup-dot" style="background:${c.border}"></div>
      <div class="slot-popup-info">
        <div class="pi-subj">${b.subj}</div>
        <div class="pi-meta">${b.prof} · ${b.room}</div>
        <div class="pi-group">${b.group||'—'}</div>
        <span class="slot-popup-badge" style="background:${statusBg};color:${statusColor}">${b.status}</span>
      </div>
    </div>`;
  }).join('');
  // Position popup near the click
  popup.classList.add('open');
  const pw=popup.offsetWidth||300,ph=popup.offsetHeight||300;
  const vw=window.innerWidth,vh=window.innerHeight;
  let lx=e.clientX+12,ly=e.clientY+12;
  if(lx+pw>vw-12)lx=e.clientX-pw-12;
  if(ly+ph>vh-12)ly=e.clientY-ph-12;
  if(ly<12)ly=12;
  popup.style.left=lx+'px';popup.style.top=ly+'px';
  slotPopupOpen=true;
}
function closeSlotPopup(){
  document.getElementById('slot-popup').classList.remove('open');
  slotPopupOpen=false;
}
document.addEventListener('click',e=>{
  const popup=document.getElementById('slot-popup');
  if(slotPopupOpen&&!popup.contains(e.target))closeSlotPopup();
});

// ── REQUESTS SEARCH ──
function clearReqSearch(){
  const el=document.getElementById('req-search');
  if(el)el.value='';
  renderReqTbl();
}
function renderReqTbl(){
  const searchEl=document.getElementById('req-search');
  const q=(searchEl?searchEl.value:'').toLowerCase().trim();
  const sorted=[...bookings].sort((a,b)=>{
    if(a.status==='pending'&&b.status!=='pending')return -1;
    if(a.status!=='pending'&&b.status==='pending')return 1;
    if(a.actionAt&&b.actionAt)return new Date(b.actionAt)-new Date(a.actionAt);
    return 0;
  });
  const filtered=q?sorted.filter(b=>
    b.prof.toLowerCase().includes(q)||
    b.subj.toLowerCase().includes(q)||
    (b.group||'').toLowerCase().includes(q)||
    b.room.toLowerCase().includes(q)||
    b.day.toLowerCase().includes(q)||
    b.status.toLowerCase().includes(q)||
    (b.notes||'').toLowerCase().includes(q)
  ):sorted;
  const countEl=document.getElementById('req-result-count');
  if(countEl)countEl.textContent=q?`${filtered.length} result${filtered.length!==1?'s':''} for "${q}"`:filtered.length+` request${filtered.length!==1?'s':''}`;
  // Highlight match
  function hl(str){
    if(!q||!str)return str||'—';
    const re=new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    return String(str).replace(re,'<mark style="background:var(--al);color:var(--amber);border-radius:2px;padding:0 2px">$1</mark>');
  }
  document.getElementById('req-tbl').innerHTML=filtered.length?filtered.map(b=>`<tr>
    <td>${hl(b.prof)}</td><td>${hl(b.subj)}</td><td>${hl(b.group||'—')}</td><td>${hl(b.room)}</td>
    <td>${hl(b.day)} · ${b.time}</td>
    <td>${b.notes
      ?`<button class="btn-a view-notes" onclick="viewNotes(${b.id})" style="font-size:11px">View Notes</button>`
      :`<span title="No notes were added for this request." style="font-size:11px;color:var(--t3);cursor:default;padding:5px 0;display:inline-block">No Notes</span>`
    }</td>
    <td><span class="tag ${b.status==='approved'?'green':b.status==='pending'?'amber':'red'}">${b.status}</span></td>
    <td style="font-size:11px;color:var(--t3)">${fmtDate(b.actionAt)}</td>
    <td><div class="acts">${b.status==='pending'
      ?`<button class="btn-a ok" onclick="approveB(${b.id})">Approve</button><button class="btn-a rej" onclick="rejectB(${b.id})">Reject</button>`
      :''}</div></td>
  </tr>`).join(''):`<tr><td colspan="9" class="empty">No results${q?` for "${q}"`:''}.</td></tr>`;
}
function viewNotes(id){
  const b=bookings.find(x=>x.id===id);
  if(!b)return;
  const content=document.getElementById('notes-view-content');
  if(b.notes){
    content.className='notes-view';
    content.textContent=b.notes;
  } else {
    content.className='notes-empty';
    content.innerHTML='<span>📭</span><span>No notes were added for this request.</span>';
  }
  openModal('notes-modal');
}
function buildEmailBody(b,status){
  const actionWord=status==='approved'?'APPROVED':'REJECTED';
  const body=`Dear ${b.prof},\n\nWe would like to inform you that your room reservation request has been ${actionWord}.\n\nREQUEST DETAILS\n───────────────────────────\nName: ${b.prof}\nSubject / Purpose: ${b.subj}\nGroup / Section / Org: ${b.group||'—'}\nRoom: ${b.room}\nDay: ${b.day}\nTime Slot: ${b.time}\nRequest Type: ${b.notes&&b.notes.includes('Change request')?'Change Existing Schedule':'New Schedule'}\nDate of Action: ${new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}\n───────────────────────────\n${status==='approved'?'Your reservation has been confirmed and is now reflected on the CBEA schedule. Please make sure to use the room only during your assigned time slot.':'Your request has not been approved at this time. If you have questions or would like to submit a new request, please visit the ACROSS CBEA scheduling portal.'}\n\nFor concerns, please contact the CBEA Scheduling Head.\n\nRegards,\nAcademic ClassRoom Occupancy Scheduling System (ACROSS)\nCollege of Business Economics and Accountancy`;
  return body;
}
function sendEmailNotif(b,status){
  if(!b.email)return;
  const subject=encodeURIComponent(`[ACROSS CBEA] Room Reservation ${status==='approved'?'Approved ✅':'Rejected ❌'} — ${b.subj}`);
  const body=encodeURIComponent(buildEmailBody(b,status));
  window.open(`mailto:${b.email}?subject=${subject}&body=${body}`,'_blank');
}
function approveB(id){
  const b=bookings.find(x=>x.id===id);
  if(!b)return;
  const conflict=bookings.find(x=>x.id!==id&&x.room===b.room&&x.day===b.day&&x.time===b.time&&x.status==='approved');
  if(conflict){toast('⚠️ Cannot approve — conflicts with existing reservation.');return;}
  b.status='approved';b.actionAt=new Date().toISOString();
  updateBadge();renderDashboard();renderReqTbl();renderBookingsTbl();renderAdminSched();
  if(b.email){sendEmailNotif(b,'approved');toast('✅ Approved. Email notification opened.');}
  else toast('✅ Request approved.');
}
function rejectB(id){
  const b=bookings.find(x=>x.id===id);
  if(!b)return;
  b.status='rejected';b.actionAt=new Date().toISOString();
  updateBadge();renderDashboard();renderReqTbl();
  if(b.email){sendEmailNotif(b,'rejected');toast('Request rejected. Email notification opened.');}
  else toast('Request rejected.');
}

// ── ROOM CRUD ──
function openRoomModal(id=null){
  editRoomId=id;
  const r=id?rooms.find(x=>x.id===id):null;
  document.getElementById('rm-title').textContent=id?'Edit Room':'Add Room';
  document.getElementById('rm-name').value=r?r.name:'';
  document.getElementById('rm-type').value=r?r.type:'Lecture Room';
  document.getElementById('rm-cap').value=r?r.cap:'';
  document.getElementById('rm-floor').value=r?r.floor:'';
  clearErr('rm-name');showAlert('rm-err',false);
  openModal('room-modal');
}
function saveRoom(){
  const name=document.getElementById('rm-name').value.trim();
  const type=document.getElementById('rm-type').value;
  const cap=parseInt(document.getElementById('rm-cap').value)||0;
  const floor=document.getElementById('rm-floor').value.trim();
  clearErr('rm-name');showAlert('rm-err',false);
  if(!name){setErr('rm-name');document.getElementById('rm-err-msg').textContent='Room name is required.';showAlert('rm-err',true);return;}
  // duplicate check — strict, regardless of type, excluding self
  const duplicate=rooms.find(r=>r.name.trim().toLowerCase()===name.toLowerCase()&&r.id!==editRoomId);
  if(duplicate){
    setErr('rm-name');
    document.getElementById('rm-err-msg').textContent=`A room named "${name}" already exists. Room names must be unique.`;
    showAlert('rm-err',true);return;
  }
  if(editRoomId){
    const r=rooms.find(x=>x.id===editRoomId);
    if(r){
      const oldName=r.name;
      r.name=name;r.type=type;r.cap=cap;r.floor=floor;
      // CASCADE rename to all reservations
      bookings.forEach(b=>{if(b.room===oldName)b.room=name;});
      toast('Room updated. All reservations updated.');
    }
  } else {
    rooms.push({id:Date.now(),name,type,cap,floor});
    toast('Room added.');
  }
  closeModal('room-modal');
  populateAdminSelects();populatePubSelects();
  renderRoomsTbl();renderBookingsTbl();renderAdminSched();renderDashboard();
  editRoomId=null;
}
function deleteRoom(id){
  const r=rooms.find(x=>x.id===id);
  if(!r)return;
  if(!confirm(`Delete "${r.name}"? All reservations for this room will also be deleted.`))return;
  reservations=bookings.filter(b=>b.room!==r.name);
  rooms=rooms.filter(x=>x.id!==id);
  populateAdminSelects();populatePubSelects();
  renderRoomsTbl();renderBookingsTbl();renderAdminSched();renderDashboard();
  toast(`"${r.name}" and its reservations deleted.`);
}

// ── BOOKING CRUD ──
function checkBkConflict(){
  const room=document.getElementById('bk-room').value;
  const day=document.getElementById('bk-day').value;
  const time=document.getElementById('bk-time').value;
  const conflictEl=document.getElementById('bk-conflict');
  if(room&&day&&time){
    const c=bookings.find(b=>b.room===room&&b.day===day&&b.time===time&&b.status==='approved'&&b.id!==editBookingId);
    conflictEl.style.display=c?'':'none';
    conflictEl.style.display=c?'flex':'none';
  } else {
    conflictEl.style.display='none';
  }
}
function openBookingModal(id=null){
  editBookingId=id;
  populateAdminSelects();
  const b=id?bookings.find(x=>x.id===id):null;
  document.getElementById('bk-title').textContent=id?'Edit Reservation':'Add Reservation';
  document.getElementById('bk-prof').value=b?b.prof:'';
  document.getElementById('bk-subj').value=b?b.subj:'';
  document.getElementById('bk-group').value=b?(b.group||''):'';
  document.getElementById('bk-room').value=b?b.room:'';
  document.getElementById('bk-day').value=b?b.day:'';
  document.getElementById('bk-time').value=b?b.time:'';
  document.getElementById('bk-conflict').style.display='none';
  openModal('reservation-modal');
}
function saveBooking(){
  const prof=document.getElementById('bk-prof').value.trim();
  const subj=document.getElementById('bk-subj').value.trim();
  const group=document.getElementById('bk-group').value.trim();
  const room=document.getElementById('bk-room').value;
  const day=document.getElementById('bk-day').value;
  const time=document.getElementById('bk-time').value;
  if(!prof||!subj||!room||!day||!time){toast('Please fill all required fields.');return;}
  const conflict=bookings.find(b=>b.room===room&&b.day===day&&b.time===time&&b.status==='approved'&&b.id!==editBookingId);
  if(conflict){toast('🚫 Conflict: this room is already reserved at that time.');return;}
  if(editBookingId){
    const b=bookings.find(x=>x.id===editBookingId);
    if(b)Object.assign(b,{prof,subj,group,room,day,time});
    toast('Reservation updated.');
  } else {
    bookings.push({id:Date.now(),prof,subj,group,room,day,time,status:'approved',actionAt:new Date().toISOString(),notes:''});
    toast('Reservation added.');
  }
  closeModal('reservation-modal');
  renderBookingsTbl();renderAdminSched();renderDashboard();
  editBookingId=null;
}
function deleteBooking(id){
  if(!confirm('Delete this reservation?'))return;
  reservations=bookings.filter(b=>b.id!==id);
  renderBookingsTbl();renderAdminSched();renderDashboard();
  toast('Reservation deleted.');
}

// ── MODAL ──
function openModal(id){document.getElementById(id).classList.add('open')}
function closeModal(id){document.getElementById(id).classList.remove('open')}
document.querySelectorAll('.modal-ov').forEach(ov=>ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.remove('open')}));

// ── TOAST ──
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200)}

// ── BACK TO TOP ──
function getScrollEl(){
  // On admin screen, the scrollable container is .admin-main; elsewhere it's window/body
  const adminScreen=document.getElementById('screen-admin');
  if(adminScreen&&adminScreen.classList.contains('active')){
    return document.querySelector('.admin-main');
  }
  return null;
}
function backToTop(){
  const el=getScrollEl();
  if(el){el.scrollTo({top:0,behavior:'smooth'});}
  else{window.scrollTo({top:0,behavior:'smooth'});document.documentElement.scrollTo({top:0,behavior:'smooth'});}
}
function checkScrollPos(){
  const btn=document.getElementById('back-to-top');
  if(!btn)return;
  const el=getScrollEl();
  const scrolled=el?el.scrollTop:(window.scrollY||document.documentElement.scrollTop);
  btn.classList.toggle('show',scrolled>300);
}
window.addEventListener('scroll',checkScrollPos,{passive:true});
// Also listen on admin-main scroll
setTimeout(()=>{
  const am=document.querySelector('.admin-main');
  if(am)am.addEventListener('scroll',checkScrollPos,{passive:true});
},500);

// ── VACANT MODAL (dashboard) ──
function showVacantModal(){
  const approved=new Set(bookings.filter(b=>b.status==='approved').map(b=>b.room));
  const vacant=rooms.filter(r=>!approved.has(r.name));
  const list=document.getElementById('vacant-modal-list');
  if(!vacant.length){
    list.innerHTML='<p style="color:var(--t3);padding:12px">No fully vacant rooms at this time.</p>';
    openModal('vacant-modal');return;
  }
  list.innerHTML=`
    <p style="font-size:12px;color:var(--t2);margin-bottom:12px">Click a room to open its schedule in the request form.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:4px 0">`+
  vacant.map(r=>`
    <div onclick="selectVacantRoom('${r.name.replace(/'/g,"\\'")}');closeModal('vacant-modal')"
      style="background:var(--s2);border:1px solid var(--border);border-radius:var(--rsm);padding:12px;cursor:pointer;transition:all .15s"
      onmouseover="this.style.borderColor='var(--green)';this.style.background='var(--gl)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--s2)'">
      <div style="font-weight:700;font-size:13px;margin-bottom:2px">${r.name}</div>
      <div style="font-size:11px;color:var(--t3);margin-bottom:6px">${r.type} · ${r.floor}</div>
      <span class="tag green" style="font-size:10px">Vacant — click to use</span>
    </div>`).join('')+`</div>`;
  openModal('vacant-modal');
}
function selectVacantRoom(roomName){
  // Switch to landing screen if on admin
  const onAdmin=document.getElementById('screen-admin').classList.contains('active');
  if(onAdmin){
    goScreen('landing');
    // Wait for screen transition then set room
    setTimeout(()=>_doSelectVacantRoom(roomName),100);
  } else {
    _doSelectVacantRoom(roomName);
  }
}
function _doSelectVacantRoom(roomName){
  // Scroll to request section
  smoothScrollTo('req-anchor');
  // Set the room dropdown
  const sel=document.getElementById('pub-room');
  if(!sel)return;
  // Make sure options are populated
  populatePubSelects();
  sel.value=roomName;
  // Reset slots
  selectedSlot={day:null,time:null};
  changeFromSlot={day:null,time:null};
  document.getElementById('pub-day').value='';
  document.getElementById('pub-time').value='';
  showAlert('pub-conflict',false);
  showAlert('pub-warn',false);
  // Render mini calendar
  renderRoomMiniCal();
  // Brief highlight on the room dropdown
  sel.style.borderColor='var(--green)';
  sel.style.boxShadow='0 0 0 3px rgba(76,175,120,.2)';
  setTimeout(()=>{sel.style.borderColor='';sel.style.boxShadow='';},2000);
}

// ── CLEAR MODALS ──
function openClearModal(type){
  const isRooms=type==='rooms';
  document.getElementById('clear-modal-title').textContent=`⚠️ Clear All ${isRooms?'Rooms':'Reservations'}?`;
  document.getElementById('clear-modal-msg').textContent=isRooms
    ?'This will permanently delete ALL rooms and ALL reservations from the system. This cannot be undone.'
    :'This will permanently delete ALL reservations (approved, pending, and rejected). Rooms will remain intact.';
  document.getElementById('clear-modal-sub').textContent=isRooms
    ?`You are about to delete ${rooms.length} rooms and ${bookings.length} reservations.`
    :`You are about to delete ${bookings.length} reservations.`;
  const btn=document.getElementById('clear-modal-confirm');
  btn.onclick=()=>{
    if(isRooms){rooms=[];bookings=[];}
    else{bookings=[];}
    closeModal('clear-modal');
    populateAdminSelects();populatePubSelects();
    renderDashboard();renderRoomsTbl();renderBookingsTbl();renderAdminSched();renderReqTbl();updateBadge();
    toast(isRooms?'All rooms and reservations cleared.':'All reservations cleared.');
  };
  openModal('clear-modal');
}

// ── EXPORT ──
let exportType='rooms';
function initExport(){
  setExportType('rooms',document.querySelector('[data-export="rooms"]'));
  const sel=document.getElementById('export-room-select');
  sel.innerHTML='<option value="">Choose a room...</option>'+rooms.map(r=>`<option>${r.name}</option>`).join('');
}
function setExportType(type,btn){
  exportType=type;
  document.querySelectorAll('[data-export]').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  document.getElementById('export-room-picker').style.display=type==='room-sched'?'block':'none';
  if(type!=='room-sched')renderExportPreview();
}
function renderExportPreview(){
  const wrap=document.getElementById('export-preview');
  if(exportType==='rooms'){
    const rows=rooms.slice(0,10);
    wrap.innerHTML=`<table><thead><tr><th>Room Name</th><th>Type</th><th>Capacity</th><th>Location</th><th>Status</th></tr></thead><tbody>`+
    rows.map(r=>{const hasB=bookings.some(b=>b.room===r.name&&b.status==='approved');
      return`<tr><td>${r.name}</td><td>${r.type}</td><td>${r.cap}</td><td>${r.floor}</td><td>${hasB?'Has Reservations':'Vacant'}</td></tr>`;
    }).join('')+`</tbody></table>`+(rooms.length>10?`<p style="color:var(--t3);font-size:11px;padding:8px 0">... and ${rooms.length-10} more rows</p>`:'');
  } else if(exportType==='all'){
    const approved=bookings.filter(b=>b.status==='approved').slice(0,10);
    wrap.innerHTML=`<table><thead><tr><th>Name</th><th>Subject</th><th>Group</th><th>Room</th><th>Day</th><th>Time</th><th>Status</th></tr></thead><tbody>`+
    approved.map(b=>`<tr><td>${b.prof}</td><td>${b.subj}</td><td>${b.group||'—'}</td><td>${b.room}</td><td>${b.day}</td><td>${b.time}</td><td>${b.status}</td></tr>`).join('')+
    `</tbody></table>`+(bookings.filter(b=>b.status==='approved').length>10?`<p style="color:var(--t3);font-size:11px;padding:8px 0">... and ${bookings.filter(b=>b.status==='approved').length-10} more rows</p>`:'');
  } else if(exportType==='room-sched'){
    const room=document.getElementById('export-room-select').value;
    if(!room){wrap.innerHTML='<p style="color:var(--t3);font-size:12px">Select a room to preview its schedule.</p>';return;}
    const rows=bookings.filter(b=>b.room===room&&b.status==='approved');
    if(!rows.length){wrap.innerHTML=`<p style="color:var(--t3);font-size:12px">No approved reservations for ${room}.</p>`;return;}
    wrap.innerHTML=`<p style="font-size:11px;font-weight:700;margin-bottom:6px;color:var(--t2)">${room} — ${rows.length} reservation${rows.length!==1?'s':''}</p><table><thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Name</th><th>Group</th></tr></thead><tbody>`+
    rows.map(b=>`<tr><td>${b.day}</td><td>${b.time}</td><td>${b.subj}</td><td>${b.prof}</td><td>${b.group||'—'}</td></tr>`).join('')+`</tbody></table>`;
  }
}
function doExport(fmt){
  let rows=[],headers=[],filename='';
  if(exportType==='rooms'){
    headers=['Room Name','Type','Capacity','Location','Status'];
    rows=rooms.map(r=>{const hasB=bookings.some(b=>b.room===r.name&&b.status==='approved');return[r.name,r.type,r.cap,r.floor,hasB?'Has Reservations':'Vacant'];});
    filename='ACROSS_CBEA_Rooms';
  } else if(exportType==='all'){
    headers=['Name','Subject','Group','Room','Day','Time','Status','Action Date'];
    rows=bookings.filter(b=>b.status==='approved').map(b=>[b.prof,b.subj,b.group||'',b.room,b.day,b.time,b.status,fmtDate(b.actionAt)]);
    filename='ACROSS_CBEA_All_Reservations';
  } else if(exportType==='room-sched'){
    const room=document.getElementById('export-room-select').value;
    if(!room){toast('Please select a room first.');return;}
    headers=['Day','Time','Subject','Name','Group'];
    rows=bookings.filter(b=>b.room===room&&b.status==='approved').map(b=>[b.day,b.time,b.subj,b.prof,b.group||'']);
    filename=`ACROSS_CBEA_${room.replace(/\s+/g,'_')}`;
  }
  if(fmt==='csv'){
    const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename+'.csv';a.click();
    toast('CSV exported.');
  } else {
    // Simple HTML table download as .xls (opens in Excel)
    const table='<table><tr>'+headers.map(h=>`<th>${h}</th>`).join('')+'</tr>'+rows.map(r=>'<tr>'+r.map(v=>`<td>${v}</td>`).join('')+'</tr>').join('')+'</table>';
    const html=`<html><head><meta charset="UTF-8"><style>th{background:#1C5C38;color:#fff;padding:6px 10px;font-size:12px}td{padding:5px 10px;font-size:12px;border:1px solid #ccc}tr:nth-child(even)td{background:#f5f5f5}</style></head><body>${table}</body></html>`;
    const blob=new Blob([html],{type:'application/vnd.ms-excel'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename+'.xls';a.click();
    toast('Excel file exported.');
  }
}

// ── INIT ──
populatePubSelects();
renderPubSched();
renderVacantGrid();
showAlert('pub-room-info',true);