import { useState, useEffect, useRef } from "react";

// ── THEME ────────────────────────────────────────────────────────
const C = {
  bg:"#F0F4FF", white:"#FFFFFF", navy:"#0D1B4B",
  blue:"#1A56DB", blueSoft:"#EEF2FF",
  green:"#059669", greenSoft:"#ECFDF5",
  red:"#DC2626", redSoft:"#FEF2F2",
  yellow:"#D97706", yellowSoft:"#FFFBEB",
  purple:"#7C3AED", purpleSoft:"#F5F3FF",
  muted:"#6B7280", border:"#E5E7EB",
  shadow:"0 2px 12px rgba(26,86,219,.08)",
  shadowMd:"0 4px 24px rgba(26,86,219,.13)",
};

// ── STORAGE ──────────────────────────────────────────────────────
const NS = "chief2_";
const persist = (k,v) => { try { localStorage.setItem(NS+k, JSON.stringify(v)); } catch {} };
const hydrate  = (k,d) => { try { const r = localStorage.getItem(NS+k); return r ? JSON.parse(r) : d; } catch { return d; } };

// ── DEFAULTS ─────────────────────────────────────────────────────
const DEF_CUTOFFS = {
  "15th":{ label:"15th Cutoff", income:25778.06,
    items:[
      {id:"a1",name:"Food",          budget:5000,   cat:"expense"},
      {id:"a2",name:"Commute",       budget:2000,   cat:"expense"},
      {id:"a3",name:"Date / Personal",budget:10000, cat:"expense"},
      {id:"a4",name:"Internet",      budget:1600,   cat:"bill"},
      {id:"a5",name:"Electricity",   budget:3200,   cat:"bill"},
      {id:"a6",name:"Gas",           budget:1000,   cat:"bill"},
      {id:"a7",name:"Subscription",  budget:179,    cat:"bill"},
    ]},
  "30th":{ label:"30th Cutoff", income:28838,
    items:[
      {id:"b1",name:"Car Loan — Geely",budget:15600,  cat:"loan"},
      {id:"b2",name:"BPI Loan",        budget:1965.33,cat:"loan"},
      {id:"b3",name:"Netflix",         budget:620,    cat:"bill"},
      {id:"b4",name:"Credit Card BPI", budget:5000,   cat:"bill"},
      {id:"b5",name:"Savings",         budget:5000,   cat:"savings"},
    ]},
};
const DEF_PAY = {"15th":{},"30th":{}};
const DEF_LOANS = [
  {id:"l1",name:"Car Loan — Geely",total:936000,monthly:15600,paid:468000,color:C.blue, notes:"Geely Azkarra"},
  {id:"l2",name:"BPI Personal Loan",total:70752,monthly:1965.33,paid:21618.63,color:C.purple,notes:""},
];
const DEF_GOALS = [
  {id:"g1",name:"Emergency Fund",target:100000,current:18000,color:C.green,icon:"🛡️"},
  {id:"g2",name:"Vacation — Japan",target:80000,current:12000,color:C.blue,icon:"✈️"},
  {id:"g3",name:"New Laptop",      target:60000,current:5000, color:C.purple,icon:"💻"},
];
const DEF_TASKS = [
  {id:"t1",title:"Review Q1 budget report",priority:"urgent",due:"Overdue",done:false},
  {id:"t2",title:"Reply to Sarah's email",  priority:"high",  due:"Today",  done:false},
  {id:"t3",title:"Buy flight tickets",      priority:"high",  due:"Tomorrow",done:false},
  {id:"t4",title:"Call dentist",            priority:"normal",due:null,      done:false},
  {id:"t5",title:"Gym — leg day",           priority:"low",   due:"Today",   done:true},
];
const DEF_JOURNAL = [];

// ── HELPERS ──────────────────────────────────────────────────────
const pCol = p => ({urgent:C.red,high:C.yellow,normal:C.blue,low:C.muted}[p]||C.muted);
const pBg  = p => ({urgent:C.redSoft,high:C.yellowSoft,normal:C.blueSoft,low:"#F9FAFB"}[p]||"#F9FAFB");
const catIco = c => ({loan:"🏦",bill:"📄",expense:"💳",savings:"💰"}[c]||"📋");
const fmt = n => Number(n).toLocaleString("en-PH",{minimumFractionDigits:0,maximumFractionDigits:2});
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);

// ── SMALL UI ─────────────────────────────────────────────────────
const Card = ({children,style={}}) => (
  <div style={{background:C.white,borderRadius:18,padding:"16px",boxShadow:C.shadow,...style}}>{children}</div>
);
const Row = ({label,children,mb=14}) => (
  <div style={{marginBottom:mb}}>
    <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
    {children}
  </div>
);
const Inp = ({label,...p}) => (
  <Row label={label} mb={p.mb||14}>
    <input {...p} style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,
      padding:"12px 14px",color:C.navy,fontSize:14,outline:"none",...p.style}}/>
  </Row>
);
const ProgressBar = ({pct,color=C.blue,h=8}) => (
  <div style={{background:C.border,borderRadius:99,height:h,overflow:"hidden"}}>
    <div style={{background:color,height:"100%",width:`${Math.min(pct*100,100)}%`,borderRadius:99,transition:"width .5s"}}/>
  </div>
);
const Pill = ({label,color,bg}) => (
  <span style={{fontSize:10,background:bg,color,padding:"3px 10px",borderRadius:20,fontWeight:700,
    textTransform:"uppercase",letterSpacing:.3,flexShrink:0}}>{label}</span>
);

const Modal = ({onClose,title,children}) => (
  <div className="anim" onClick={e=>e.target===e.currentTarget&&onClose()}
    style={{position:"fixed",inset:0,background:"rgba(13,27,75,.45)",display:"flex",
      alignItems:"flex-end",justifyContent:"center",zIndex:300,backdropFilter:"blur(3px)"}}>
    <div className="modal-sheet" style={{width:"100%",maxWidth:430,background:C.white,
      borderRadius:"24px 24px 0 0",padding:"24px 20px 44px",maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{fontSize:18,fontWeight:800,color:C.navy,marginBottom:16}}>{title}</div>
      {children}
    </div>
  </div>
);
const BtnRow = ({onCancel,onConfirm,ok="Save",okCol=C.blue,danger,onDanger,dangerLabel}) => (
  <div>
    {danger&&<button onClick={onDanger} style={{width:"100%",padding:12,borderRadius:14,border:"none",
      background:C.redSoft,color:C.red,fontSize:13,fontWeight:700,marginBottom:10}}>{dangerLabel}</button>}
    <div style={{display:"flex",gap:10}}>
      <button onClick={onCancel} style={{flex:1,padding:13,borderRadius:14,border:`1.5px solid ${C.border}`,
        background:"transparent",color:C.muted,fontSize:14,fontWeight:600}}>Cancel</button>
      <button onClick={onConfirm} style={{flex:2,padding:13,borderRadius:14,border:"none",
        background:okCol,color:"#fff",fontSize:14,fontWeight:800}}>{ok}</button>
    </div>
  </div>
);
const ColorPicker = ({value,onChange}) => (
  <Row label="Color">
    <div style={{display:"flex",gap:10}}>
      {[C.blue,C.purple,C.green,C.red,C.yellow].map(c=>(
        <button key={c} onClick={()=>onChange(c)} style={{width:32,height:32,borderRadius:"50%",
          background:c,border:`3px solid ${value===c?C.navy:"transparent"}`}}/>
      ))}
    </div>
  </Row>
);

// ── PROMPT GENERATOR ─────────────────────────────────────────────
function buildPrompt(cutoffs, payments, loans, goals, tasks, journal) {
  const today = new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  const lines = [`📋 CHIEF BRIEFING — ${today}`, ""];

  // Tasks
  const open = tasks.filter(t=>!t.done);
  const done = tasks.filter(t=>t.done);
  lines.push("━━ TASKS ━━");
  if (open.length) open.forEach(t=>lines.push(`  [ ] ${t.title} — ${t.priority.toUpperCase()}${t.due?` (${t.due})`:""}`));
  else lines.push("  All tasks done! 🎉");
  if (done.length) lines.push(`  ✓ Completed: ${done.map(t=>t.title).join(", ")}`);
  lines.push("");

  // Cutoffs
  Object.entries(cutoffs).forEach(([key,c])=>{
    const p = payments[key]||{};
    const totalBudget = c.items.reduce((s,i)=>s+i.budget,0);
    const paidItems  = c.items.filter(i=>p[i.id]?.done);
    const unpaidItems= c.items.filter(i=>!p[i.id]?.done);
    const paidTotal  = paidItems.reduce((s,i)=>s+(p[i.id]?.amount||i.budget),0);
    lines.push(`━━ ${c.label.toUpperCase()} ━━`);
    lines.push(`  Income: ₱${fmt(c.income)} | Budget: ₱${fmt(totalBudget)} | Balance: ₱${fmt(c.income-totalBudget)}`);
    lines.push(`  Progress: ${paidItems.length}/${c.items.length} paid (₱${fmt(paidTotal)} of ₱${fmt(totalBudget)})`);
    if (unpaidItems.length) lines.push(`  🔴 Still unpaid: ${unpaidItems.map(i=>`${i.name} ₱${fmt(i.budget)}`).join(", ")}`);
    if (paidItems.length)   lines.push(`  ✅ Paid: ${paidItems.map(i=>`${i.name} ₱${fmt(p[i.id]?.amount||i.budget)}`).join(", ")}`);
    lines.push("");
  });

  // Loans
  lines.push("━━ LOANS ━━");
  loans.forEach(l=>{
    const pct = Math.round(l.paid/l.total*100);
    const mLeft = Math.max(0,Math.ceil((l.total-l.paid)/l.monthly));
    const fd = new Date(); fd.setMonth(fd.getMonth()+mLeft);
    const fdStr = fd.toLocaleDateString("en-PH",{month:"long",year:"numeric"});
    lines.push(`  ${l.name}: ${pct}% paid — ₱${fmt(l.paid)} of ₱${fmt(l.total)}`);
    lines.push(`    Monthly: ₱${fmt(l.monthly)} | Remaining: ₱${fmt(l.total-l.paid)} | Freedom: ${fdStr} (${mLeft} months)`);
  });
  lines.push("");

  // Savings Goals
  lines.push("━━ SAVINGS GOALS ━━");
  goals.forEach(g=>{
    const pct = Math.round(g.current/g.target*100);
    const left = g.target-g.current;
    lines.push(`  ${g.icon} ${g.name}: ₱${fmt(g.current)} / ₱${fmt(g.target)} (${pct}%) — ₱${fmt(left)} to go`);
  });
  lines.push("");

  // Journal
  if (journal.length) {
    lines.push("━━ RECENT NOTES / JOURNAL ━━");
    journal.slice(-5).forEach(j=>lines.push(`  [${j.date}] ${j.text}`));
    lines.push("");
  }

  // Financial summary
  const totalIncome   = Object.values(cutoffs).reduce((s,c)=>s+c.income,0);
  const totalExpenses = Object.values(cutoffs).reduce((s,c)=>s+c.items.reduce((ss,i)=>ss+i.budget,0),0);
  lines.push("━━ MONTHLY SUMMARY ━━");
  lines.push(`  Total Income:   ₱${fmt(totalIncome)}`);
  lines.push(`  Total Expenses: ₱${fmt(totalExpenses)}`);
  lines.push(`  Net:            ₱${fmt(totalIncome-totalExpenses)}`);
  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("Based on everything above, please:");
  lines.push("1. Give me a quick financial health check");
  lines.push("2. Tell me what I should prioritize right now");
  lines.push("3. Flag any concerns or things I might be missing");
  lines.push("4. Give me one concrete action I should do today");

  return lines.join("\n");
}

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]       = useState("home");
  const [co,setCo]         = useState(()=>hydrate("cutoffs",DEF_CUTOFFS));
  const [pay,setPay]       = useState(()=>hydrate("payments",DEF_PAY));
  const [loans,setLoans]   = useState(()=>hydrate("loans",DEF_LOANS));
  const [goals,setGoals]   = useState(()=>hydrate("goals",DEF_GOALS));
  const [tasks,setTasks]   = useState(()=>hydrate("tasks",DEF_TASKS));
  const [journal,setJournal]= useState(()=>hydrate("journal",DEF_JOURNAL));
  const [coTab,setCoTab]   = useState("15th");

  // modals
  const [paidModal,setPaidModal]     = useState(null);
  const [paidAmt,setPaidAmt]         = useState("");
  const [paidDate,setPaidDate]       = useState(new Date().toISOString().split("T")[0]);
  const [editIncome,setEditIncome]   = useState(null);
  const [incomeVal,setIncomeVal]     = useState("");
  const [billModal,setBillModal]     = useState(null);
  const [billForm,setBillForm]       = useState({});
  const [loanModal,setLoanModal]     = useState(null);
  const [loanForm,setLoanForm]       = useState({});
  const [goalModal,setGoalModal]     = useState(null);
  const [goalForm,setGoalForm]       = useState({});
  const [taskModal,setTaskModal]     = useState(false);
  const [taskForm,setTaskForm]       = useState({title:"",priority:"normal",due:""});
  const [briefingModal,setBriefingModal] = useState(false);
  const [copied,setCopied]           = useState(false);
  const [journalInput,setJournalInput] = useState("");
  const promptText = buildPrompt(co,pay,loans,goals,tasks,journal);

  // persist
  useEffect(()=>persist("cutoffs",co),[co]);
  useEffect(()=>persist("payments",pay),[pay]);
  useEffect(()=>persist("loans",loans),[loans]);
  useEffect(()=>persist("goals",goals),[goals]);
  useEffect(()=>persist("tasks",tasks),[tasks]);
  useEffect(()=>persist("journal",journal),[journal]);

  // cutoff stats
  const stats = key => {
    const c=co[key]; const p=pay[key]||{};
    const budget  = c.items.reduce((s,i)=>s+i.budget,0);
    const paidI   = c.items.filter(i=>p[i.id]?.done);
    const paidTot = paidI.reduce((s,i)=>s+(p[i.id]?.amount||i.budget),0);
    return {budget,paidTot,done:paidI.length,total:c.items.length,balance:c.income-budget};
  };
  const s15=stats("15th"), s30=stats("30th");
  const totalIncome   = co["15th"].income+co["30th"].income;
  const totalExpenses = s15.budget+s30.budget;

  const markPaid = () => {
    if(!paidModal) return;
    const {key,item} = paidModal;
    setPay(p=>({...p,[key]:{...p[key],[item.id]:{done:true,amount:parseFloat(paidAmt)||item.budget,date:paidDate}}}));
    setPaidModal(null);
  };
  const unmark = (key,id) => setPay(p=>({...p,[key]:{...p[key],[id]:{done:false}}}));

  const saveBill = () => {
    if(!billForm.name||!billForm.budget) return;
    const {mode,key} = billModal;
    const item = {...billForm,budget:parseFloat(billForm.budget)};
    if(mode==="edit") setCo(p=>({...p,[key]:{...p[key],items:p[key].items.map(i=>i.id===item.id?item:i)}}));
    else setCo(p=>({...p,[key]:{...p[key],items:[...p[key].items,{...item,id:uid()}]}}));
    setBillModal(null);
  };
  const deleteBill = (key,id) => {
    setCo(p=>({...p,[key]:{...p[key],items:p[key].items.filter(i=>i.id!==id)}}));
    setPay(p=>{ const np={...p[key]}; delete np[id]; return {...p,[key]:np}; });
  };

  const saveLoan = () => {
    if(!loanForm.name||!loanForm.total) return;
    const l={...loanForm,total:parseFloat(loanForm.total),monthly:parseFloat(loanForm.monthly),paid:parseFloat(loanForm.paid)||0};
    if(l.id) setLoans(p=>p.map(x=>x.id===l.id?l:x));
    else setLoans(p=>[...p,{...l,id:uid()}]);
    setLoanModal(null);
  };
  const saveGoal = () => {
    if(!goalForm.name||!goalForm.target) return;
    const g={...goalForm,target:parseFloat(goalForm.target),current:parseFloat(goalForm.current)||0};
    if(g.id) setGoals(p=>p.map(x=>x.id===g.id?g:x));
    else setGoals(p=>[...p,{...g,id:uid()}]);
    setGoalModal(null);
  };
  const addTask = () => {
    if(!taskForm.title.trim()) return;
    setTasks(p=>[...p,{id:uid(),title:taskForm.title,priority:taskForm.priority,due:taskForm.due||null,done:false}]);
    setTaskForm({title:"",priority:"normal",due:""}); setTaskModal(false);
  };
  const addJournal = () => {
    if(!journalInput.trim()) return;
    const entry={id:uid(),date:new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric"}),text:journalInput.trim()};
    setJournal(p=>[...p,entry].slice(-30));
    setJournalInput("");
  };
  const copyPrompt = () => {
    navigator.clipboard?.writeText(promptText).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  };

  const today = new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"});

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div style={{maxWidth:430,margin:"0 auto",height:"100vh",display:"flex",flexDirection:"column",
      background:C.white,overflow:"hidden",boxShadow:"0 0 60px rgba(26,86,219,.12)"}}>

      {/* Status bar */}
      <div style={{background:C.white,padding:"14px 24px 10px",display:"flex",
        justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <span style={{fontSize:14,fontWeight:700,color:C.navy}}>
          {new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"})}
        </span>
        <span style={{fontSize:15,fontWeight:800,color:C.blue,letterSpacing:-.5}}>⚡ chief</span>
        <span style={{fontSize:12,color:C.muted,fontWeight:600}}>
          {new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric"})}
        </span>
      </div>

      {/* Scroll area */}
      <div style={{flex:1,overflowY:"auto",background:C.bg}}>
        <div style={{padding:"0 16px 100px"}}>

          {/* ═══════════ HOME ═══════════ */}
          {tab==="home" && (
            <div className="anim">
              <div style={{paddingTop:20,marginBottom:16}}>
                <div style={{fontSize:12,color:C.muted,fontWeight:500}}>{today}</div>
                <div style={{fontSize:26,fontWeight:800,color:C.navy,marginTop:2}}>Good morning! 🌤</div>
              </div>

              {/* ASK CHIEF card */}
              <div style={{background:`linear-gradient(135deg,#0D1B4B,#1A56DB)`,borderRadius:22,padding:20,
                marginBottom:16,position:"relative",overflow:"hidden",cursor:"pointer"}}
                onClick={()=>setBriefingModal(true)}>
                <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,background:"#ffffff0f",borderRadius:"50%"}}/>
                <div style={{position:"absolute",bottom:-28,left:-10,width:80,height:80,background:"#ffffff08",borderRadius:"50%"}}/>
                <div style={{fontSize:11,color:"#ffffff77",fontWeight:700,letterSpacing:1.2,marginBottom:8,textTransform:"uppercase"}}>⚡ Ask Chief</div>
                <div style={{fontSize:16,fontWeight:700,color:"#fff",lineHeight:1.5,marginBottom:12}}>
                  Tap to generate your full briefing prompt — copy it and paste into Claude for a complete analysis.
                </div>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#ffffff22",
                  borderRadius:20,padding:"8px 18px"}}>
                  <span style={{fontSize:14,color:"#fff",fontWeight:700}}>Generate Briefing →</span>
                </div>
              </div>

              {/* Summary grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[
                  {label:"Monthly Income", value:`₱${fmt(totalIncome)}`,     icon:"💰",color:C.green, bg:C.greenSoft},
                  {label:"Monthly Bills",  value:`₱${fmt(totalExpenses)}`,   icon:"📋",color:C.blue,  bg:C.blueSoft},
                  {label:"Net Savings",    value:`₱${fmt(totalIncome-totalExpenses)}`,icon:"🏦",color:C.purple,bg:C.purpleSoft},
                  {label:"Tasks Open",     value:`${tasks.filter(t=>!t.done).length} items`,icon:"✅",color:C.yellow,bg:C.yellowSoft},
                ].map((s,i)=>(
                  <div key={i} style={{background:s.bg,borderRadius:16,padding:"14px 16px",border:`1px solid ${s.color}18`}}>
                    <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                    <div style={{fontSize:17,fontWeight:800,color:s.color}}>{s.value}</div>
                    <div style={{fontSize:11,color:C.muted,fontWeight:500,marginTop:2}}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Cutoff progress */}
              <div style={{fontSize:16,fontWeight:800,color:C.navy,marginBottom:10}}>📅 Cutoff Progress</div>
              {[{key:"15th",s:s15},{key:"30th",s:s30}].map(({key,s})=>(
                <Card key={key} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                    <span style={{fontWeight:700,color:C.navy}}>{co[key].label}</span>
                    <span style={{fontSize:12,color:C.green,fontWeight:700}}>{s.done}/{s.total} paid</span>
                  </div>
                  <ProgressBar pct={s.done/s.total}/>
                  <div style={{fontSize:12,color:C.muted,marginTop:8}}>
                    Budget ₱{fmt(s.budget)} · Balance <span style={{color:C.green,fontWeight:700}}>₱{fmt(s.balance)}</span>
                  </div>
                </Card>
              ))}

              {/* Top tasks */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"16px 0 10px"}}>
                <div style={{fontSize:16,fontWeight:800,color:C.navy}}>🔥 Priority Tasks</div>
                <button onClick={()=>setTab("tasks")} style={{fontSize:12,color:C.blue,background:"none",border:"none",fontWeight:700}}>See all →</button>
              </div>
              {tasks.filter(t=>!t.done).slice(0,3).map(t=>(
                <div key={t.id} onClick={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,done:true}:x))}
                  style={{background:C.white,borderRadius:14,padding:"12px 16px",marginBottom:8,
                    display:"flex",gap:12,alignItems:"center",boxShadow:C.shadow,cursor:"pointer"}}>
                  <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${pCol(t.priority)}`,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.navy}}>{t.title}</div>
                    {t.due&&<div style={{fontSize:11,color:t.due==="Overdue"?C.red:C.muted}}>{t.due}</div>}
                  </div>
                  <Pill label={t.priority} color={pCol(t.priority)} bg={pBg(t.priority)}/>
                </div>
              ))}
              {tasks.filter(t=>!t.done).length===0&&(
                <Card style={{textAlign:"center",color:C.green,fontWeight:700}}>🎉 All tasks done!</Card>
              )}

              {/* Loan snapshot */}
              <div style={{fontSize:16,fontWeight:800,color:C.navy,margin:"16px 0 10px"}}>📊 Loans Snapshot</div>
              {loans.map(l=>{
                const pct=l.paid/l.total;
                const mLeft=Math.max(0,Math.ceil((l.total-l.paid)/l.monthly));
                const fd=new Date(); fd.setMonth(fd.getMonth()+mLeft);
                return (
                  <Card key={l.id} style={{marginBottom:10,border:`1.5px solid ${l.color}22`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{l.name}</div>
                        <div style={{fontSize:11,color:C.muted}}>{mLeft} months left</div>
                      </div>
                      <div style={{background:l.color+"18",borderRadius:10,padding:"4px 10px",fontSize:14,fontWeight:800,color:l.color}}>
                        {Math.round(pct*100)}%
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={l.color} h={6}/>
                    <div style={{fontSize:11,color:C.muted,marginTop:6}}>
                      Freedom: <strong style={{color:C.navy}}>{fd.toLocaleDateString("en-PH",{month:"long",year:"numeric"})}</strong>
                    </div>
                  </Card>
                );
              })}

              {/* Savings goals snapshot */}
              <div style={{fontSize:16,fontWeight:800,color:C.navy,margin:"16px 0 10px"}}>💰 Savings Goals</div>
              {goals.map(g=>(
                <Card key={g.id} style={{marginBottom:10,border:`1.5px solid ${g.color}22`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:22}}>{g.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{g.name}</div>
                        <div style={{fontSize:11,color:C.muted}}>₱{fmt(g.current)} / ₱{fmt(g.target)}</div>
                      </div>
                    </div>
                    <div style={{background:g.color+"18",borderRadius:10,padding:"4px 10px",fontSize:14,fontWeight:800,color:g.color}}>
                      {Math.round(g.current/g.target*100)}%
                    </div>
                  </div>
                  <ProgressBar pct={g.current/g.target} color={g.color} h={6}/>
                </Card>
              ))}

              {/* Quick journal */}
              <div style={{fontSize:16,fontWeight:800,color:C.navy,margin:"16px 0 10px"}}>📓 Quick Note</div>
              <Card>
                <textarea value={journalInput} onChange={e=>setJournalInput(e.target.value)}
                  placeholder="Log something — a win, a stress, a thought. Chief will reference this in your briefing."
                  rows={3} style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,
                    padding:"12px 14px",color:C.navy,fontSize:13,outline:"none",resize:"none",lineHeight:1.6}}/>
                <button onClick={addJournal} style={{marginTop:10,width:"100%",padding:"11px",borderRadius:12,
                  border:"none",background:C.navy,color:"#fff",fontSize:13,fontWeight:700}}>
                  Save Note ↵
                </button>
                {journal.slice(-3).reverse().map(j=>(
                  <div key={j.id} style={{marginTop:8,fontSize:12,color:C.muted,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
                    <span style={{color:C.blue,fontWeight:600}}>{j.date}</span> — {j.text}
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ═══════════ TASKS ═══════════ */}
          {tab==="tasks" && (
            <div className="anim" style={{paddingTop:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:24,fontWeight:800,color:C.navy}}>Tasks</div>
                <button onClick={()=>setTaskModal(true)} style={{background:C.blue,border:"none",
                  borderRadius:20,padding:"8px 18px",color:"#fff",fontSize:13,fontWeight:700}}>+ Add</button>
              </div>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:.5,marginBottom:10}}>TAP TO COMPLETE · HOLD TO DELETE</div>
              {tasks.map(t=>(
                <div key={t.id} style={{background:C.white,borderRadius:16,padding:"14px 16px",marginBottom:10,
                  display:"flex",gap:12,alignItems:"center",boxShadow:C.shadow,opacity:t.done?.55:1,transition:"opacity .2s"}}>
                  <div onClick={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,done:!x.done}:x))}
                    style={{width:24,height:24,borderRadius:"50%",border:`2.5px solid ${t.done?C.green:pCol(t.priority)}`,
                      background:t.done?C.greenSoft:"transparent",display:"flex",alignItems:"center",
                      justifyContent:"center",flexShrink:0,cursor:"pointer"}}>
                    {t.done&&<span style={{fontSize:13,color:C.green,fontWeight:800}}>✓</span>}
                  </div>
                  <div style={{flex:1,cursor:"pointer"}} onClick={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,done:!x.done}:x))}>
                    <div style={{fontSize:14,fontWeight:600,color:C.navy,textDecoration:t.done?"line-through":"none"}}>{t.title}</div>
                    {t.due&&<div style={{fontSize:11,color:t.due==="Overdue"?C.red:C.muted,marginTop:2}}>{t.due}</div>}
                  </div>
                  {!t.done&&<Pill label={t.priority} color={pCol(t.priority)} bg={pBg(t.priority)}/>}
                  <button onClick={()=>setTasks(p=>p.filter(x=>x.id!==t.id))}
                    style={{width:28,height:28,borderRadius:8,background:C.redSoft,border:"none",
                      fontSize:12,color:C.red,flexShrink:0}}>✕</button>
                </div>
              ))}
              {tasks.length===0&&<Card style={{textAlign:"center",color:C.muted,padding:32}}>No tasks yet. Add one!</Card>}
            </div>
          )}

          {/* ═══════════ BILLS ═══════════ */}
          {tab==="bills" && (
            <div className="anim" style={{paddingTop:20}}>
              <div style={{fontSize:24,fontWeight:800,color:C.navy}}>Bills & Payments</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:16}}>Tap ✓ to mark paid · ✏️ to edit · ✕ to delete</div>

              {/* Toggle */}
              <div style={{display:"flex",background:C.white,borderRadius:16,padding:4,marginBottom:16,boxShadow:C.shadow}}>
                {["15th","30th"].map(k=>(
                  <button key={k} onClick={()=>setCoTab(k)} style={{flex:1,padding:"10px",borderRadius:12,border:"none",
                    background:coTab===k?C.blue:"transparent",color:coTab===k?"#fff":C.muted,
                    fontSize:14,fontWeight:700,transition:"all .2s"}}>{k} Cutoff</button>
                ))}
              </div>

              {(()=>{
                const c=co[coTab]; const p=pay[coTab]||{}; const s=stats(coTab);
                return(<>
                  {/* Income header */}
                  <div style={{background:`linear-gradient(135deg,${C.blue},#1E40AF)`,borderRadius:20,padding:20,
                    marginBottom:14,color:"#fff",position:"relative"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontSize:11,opacity:.75,textTransform:"uppercase",letterSpacing:1}}>Salary In</div>
                        <div style={{fontSize:30,fontWeight:800,marginTop:2}}>₱{fmt(c.income)}</div>
                      </div>
                      <button onClick={()=>{setEditIncome(coTab);setIncomeVal(c.income.toString());}}
                        style={{background:"#ffffff22",border:"none",borderRadius:20,padding:"7px 14px",
                          color:"#fff",fontSize:12,fontWeight:700}}>✏️ Edit</button>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>
                      <div><div style={{fontSize:10,opacity:.7}}>BUDGET</div><div style={{fontSize:15,fontWeight:700}}>₱{fmt(s.budget)}</div></div>
                      <div><div style={{fontSize:10,opacity:.7}}>PAID</div><div style={{fontSize:15,fontWeight:700}}>₱{fmt(s.paidTot)}</div></div>
                      <div><div style={{fontSize:10,opacity:.7}}>BALANCE</div><div style={{fontSize:15,fontWeight:700}}>₱{fmt(s.balance)}</div></div>
                    </div>
                    <div style={{background:"#ffffff33",borderRadius:99,height:8,marginTop:14,overflow:"hidden"}}>
                      <div style={{background:"#fff",height:"100%",width:`${(s.done/s.total)*100}%`,borderRadius:99,transition:"width .5s"}}/>
                    </div>
                    <div style={{fontSize:11,opacity:.8,marginTop:6}}>{s.done} of {s.total} items paid</div>
                  </div>

                  {/* Items */}
                  {c.items.map(item=>{
                    const pd=p[item.id];
                    return(
                      <div key={item.id} style={{background:C.white,borderRadius:16,padding:"14px 16px",marginBottom:10,
                        boxShadow:C.shadow,border:pd?.done?`1.5px solid ${C.green}44`:"1.5px solid transparent"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          {/* Checkmark */}
                          <div onClick={()=>{
                            if(pd?.done) unmark(coTab,item.id);
                            else{setPaidModal({key:coTab,item});setPaidAmt(item.budget.toString());setPaidDate(new Date().toISOString().split("T")[0]);}
                          }} style={{width:28,height:28,borderRadius:"50%",border:`2.5px solid ${pd?.done?C.green:C.border}`,
                            background:pd?.done?C.greenSoft:"transparent",display:"flex",alignItems:"center",
                            justifyContent:"center",flexShrink:0,cursor:"pointer"}}>
                            {pd?.done&&<span style={{fontSize:14,color:C.green,fontWeight:800}}>✓</span>}
                          </div>
                          <span style={{fontSize:18}}>{catIco(item.cat)}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:600,color:C.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                            {pd?.done&&<div style={{fontSize:11,color:C.green}}>Paid ₱{fmt(pd.amount)} on {pd.date}</div>}
                          </div>
                          <div style={{fontWeight:800,fontSize:15,color:pd?.done?C.green:C.navy,flexShrink:0}}>₱{fmt(item.budget)}</div>
                          <button onClick={()=>{setBillModal({mode:"edit",key:coTab});setBillForm({...item,budget:item.budget.toString()});}}
                            style={{background:C.bg,border:"none",borderRadius:10,width:30,height:30,fontSize:13,flexShrink:0}}>✏️</button>
                          <button onClick={()=>deleteBill(coTab,item.id)}
                            style={{background:C.redSoft,border:"none",borderRadius:10,width:30,height:30,fontSize:13,color:C.red,flexShrink:0}}>✕</button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add bill */}
                  <button onClick={()=>{setBillModal({mode:"add",key:coTab});setBillForm({name:"",budget:"",cat:"expense"});}}
                    style={{width:"100%",padding:14,borderRadius:16,border:`2px dashed ${C.border}`,
                      background:"transparent",color:C.blue,fontSize:14,fontWeight:700,marginBottom:16}}>
                    + Add Bill / Item
                  </button>

                  {/* Total */}
                  <div style={{background:C.navy,borderRadius:16,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{color:"#fff",fontWeight:800,fontSize:16}}>TOTAL</span>
                    <div style={{textAlign:"right"}}>
                      <div style={{color:"#fff",fontWeight:800,fontSize:20}}>₱{fmt(s.budget)}</div>
                      <div style={{color:"#ffffff55",fontSize:11}}>{s.done}/{s.total} done</div>
                    </div>
                  </div>

                  {/* Savings summary */}
                  <div style={{background:C.greenSoft,borderRadius:18,padding:18,marginTop:14,border:`1.5px solid ${C.green}22`}}>
                    <div style={{fontSize:14,fontWeight:800,color:C.green,marginBottom:12}}>💚 Cutoff Savings Summary</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[
                        {label:"15th Income",  val:`₱${fmt(co["15th"].income)}`},
                        {label:"15th Expenses",val:`₱${fmt(s15.budget)}`},
                        {label:"15th Balance", val:`₱${fmt(co["15th"].income-s15.budget)}`},
                        {label:"30th Income",  val:`₱${fmt(co["30th"].income)}`},
                        {label:"30th Expenses",val:`₱${fmt(s30.budget)}`},
                        {label:"30th Balance", val:`₱${fmt(co["30th"].income-s30.budget)}`},
                      ].map((r,i)=>(
                        <div key={i} style={{background:C.white,borderRadius:12,padding:"10px 12px"}}>
                          <div style={{fontSize:10,color:C.muted,fontWeight:600}}>{r.label}</div>
                          <div style={{fontSize:15,fontWeight:700,color:C.green,marginTop:2}}>{r.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:C.white,borderRadius:12,padding:"12px 14px",marginTop:10,
                      display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.navy}}>MONTHLY NET</div>
                      <div style={{fontSize:22,fontWeight:800,color:C.green}}>₱{fmt(totalIncome-totalExpenses)}</div>
                    </div>
                  </div>
                </>);
              })()}
            </div>
          )}

          {/* ═══════════ LOANS + GOALS ═══════════ */}
          {tab==="loans" && (
            <div className="anim" style={{paddingTop:20}}>
              {/* Loans */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontSize:24,fontWeight:800,color:C.navy}}>Loans</div>
                <button onClick={()=>{setLoanModal("new");setLoanForm({name:"",total:"",monthly:"",paid:"0",notes:"",color:C.blue});}}
                  style={{background:C.blue,border:"none",borderRadius:20,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700}}>+ Add</button>
              </div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Your freedom dates 🎉</div>

              {loans.map(l=>{
                const pct=l.paid/l.total;
                const rem=l.total-l.paid;
                const mLeft=Math.max(0,Math.ceil(rem/l.monthly));
                const fd=new Date(); fd.setMonth(fd.getMonth()+mLeft);
                const mTotal=Math.round(l.total/l.monthly);
                const mDone=mTotal-mLeft;
                return(
                  <Card key={l.id} style={{marginBottom:16,border:`1.5px solid ${l.color}22`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                      <div>
                        <div style={{fontSize:16,fontWeight:800,color:C.navy}}>{l.name}</div>
                        <div style={{fontSize:12,color:C.muted,marginTop:2}}>₱{fmt(l.monthly)}/month</div>
                        {l.notes&&<div style={{fontSize:11,color:C.muted}}>{l.notes}</div>}
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <div style={{background:l.color+"18",borderRadius:12,padding:"6px 12px",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:800,color:l.color}}>{Math.round(pct*100)}%</div>
                          <div style={{fontSize:9,color:l.color,fontWeight:700}}>PAID</div>
                        </div>
                        <button onClick={()=>{setLoanModal(l.id);setLoanForm({...l,total:l.total.toString(),monthly:l.monthly.toString(),paid:l.paid.toString()});}}
                          style={{background:C.bg,border:"none",borderRadius:10,width:32,height:32,fontSize:14}}>✏️</button>
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={l.color} h={12}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"12px 0"}}>
                      {[
                        {label:"Total",     val:`₱${(l.total/1000).toFixed(0)}K`},
                        {label:"Paid",      val:`₱${(l.paid/1000).toFixed(1)}K`,  color:C.green},
                        {label:"Remaining", val:`₱${(rem/1000).toFixed(1)}K`,     color:C.red},
                      ].map((s,i)=>(
                        <div key={i} style={{background:C.bg,borderRadius:12,padding:"10px 12px",textAlign:"center"}}>
                          <div style={{fontSize:15,fontWeight:800,color:s.color||C.navy}}>{s.val}</div>
                          <div style={{fontSize:10,color:C.muted}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:l.color+"0F",borderRadius:14,padding:"12px 16px",border:`1px solid ${l.color}22`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:11,color:C.muted}}>Months paid</div>
                          <div style={{fontSize:22,fontWeight:800,color:l.color}}>{mDone} <span style={{fontSize:13,color:C.muted}}>/ {mTotal}</span></div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:11,color:C.muted}}>Freedom Date 🎉</div>
                          <div style={{fontSize:15,fontWeight:800,color:C.navy}}>{fd.toLocaleDateString("en-PH",{month:"long",year:"numeric"})}</div>
                          <div style={{fontSize:11,color:C.muted}}>{mLeft} months left</div>
                        </div>
                      </div>
                    </div>
                    <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:4}}>
                      {Array.from({length:Math.min(mTotal,60)}).map((_,i)=>(
                        <div key={i} style={{width:9,height:9,borderRadius:"50%",background:i<mDone?l.color:C.border}}/>
                      ))}
                      {mTotal>60&&<span style={{fontSize:10,color:C.muted}}>+{mTotal-60}</span>}
                    </div>
                  </Card>
                );
              })}

              {/* Savings Goals */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"20px 0 12px"}}>
                <div style={{fontSize:20,fontWeight:800,color:C.navy}}>💰 Savings Goals</div>
                <button onClick={()=>{setGoalModal("new");setGoalForm({name:"",target:"",current:"0",icon:"🎯",color:C.green});}}
                  style={{background:C.green,border:"none",borderRadius:20,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700}}>+ Add</button>
              </div>
              {goals.map(g=>{
                const pct=Math.min(g.current/g.target,1);
                const left=g.target-g.current;
                const monthlySavings=co["30th"].items.find(i=>i.cat==="savings")?.budget||5000;
                const mToGoal=left>0?Math.ceil(left/monthlySavings):0;
                return(
                  <Card key={g.id} style={{marginBottom:12,border:`1.5px solid ${g.color}22`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{fontSize:26}}>{g.icon}</span>
                        <div>
                          <div style={{fontSize:15,fontWeight:700,color:C.navy}}>{g.name}</div>
                          <div style={{fontSize:12,color:C.muted}}>₱{fmt(g.current)} of ₱{fmt(g.target)}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <div style={{background:g.color+"18",borderRadius:10,padding:"5px 10px",fontSize:14,fontWeight:800,color:g.color}}>
                          {Math.round(pct*100)}%
                        </div>
                        <button onClick={()=>{setGoalModal(g.id);setGoalForm({...g,target:g.target.toString(),current:g.current.toString()});}}
                          style={{background:C.bg,border:"none",borderRadius:10,width:32,height:32,fontSize:14}}>✏️</button>
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={g.color} h={10}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
                      <div style={{fontSize:12,color:C.muted}}>₱{fmt(left)} to go</div>
                      {mToGoal>0&&<div style={{fontSize:12,color:g.color,fontWeight:700}}>~{mToGoal} months at current rate</div>}
                      {mToGoal===0&&<div style={{fontSize:12,color:C.green,fontWeight:700}}>🎉 Goal reached!</div>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ═══════════ JOURNAL ═══════════ */}
          {tab==="journal" && (
            <div className="anim" style={{paddingTop:20}}>
              <div style={{fontSize:24,fontWeight:800,color:C.navy,marginBottom:4}}>Journal & Notes</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:16}}>Chief includes your notes in the briefing prompt</div>
              <Card style={{marginBottom:16}}>
                <textarea value={journalInput} onChange={e=>setJournalInput(e.target.value)}
                  placeholder="What's on your mind? A win, a stress, a financial move, a goal update…"
                  rows={4} style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,
                    padding:"12px 14px",color:C.navy,fontSize:13,outline:"none",resize:"none",lineHeight:1.6}}/>
                <button onClick={addJournal} style={{marginTop:10,width:"100%",padding:12,borderRadius:12,
                  border:"none",background:C.navy,color:"#fff",fontSize:14,fontWeight:700}}>Save Note ↵</button>
              </Card>
              {journal.length===0&&<Card style={{textAlign:"center",color:C.muted,padding:32}}>No notes yet. Write something!</Card>}
              {[...journal].reverse().map(j=>(
                <Card key={j.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:C.blue,fontWeight:700,marginBottom:4}}>{j.date}</div>
                      <div style={{fontSize:14,color:C.navy,lineHeight:1.6}}>{j.text}</div>
                    </div>
                    <button onClick={()=>setJournal(p=>p.filter(x=>x.id!==j.id))}
                      style={{background:C.redSoft,border:"none",borderRadius:8,width:28,height:28,fontSize:12,color:C.red,flexShrink:0,marginLeft:10}}>✕</button>
                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{background:C.white,borderTop:`1px solid ${C.border}`,padding:"8px 0 20px",
        display:"flex",justifyContent:"space-around",flexShrink:0,boxShadow:"0 -4px 20px rgba(26,86,219,.06)"}}>
        {[
          {id:"home",    emoji:"🏠",label:"Home"},
          {id:"tasks",   emoji:"✅",label:"Tasks"},
          {id:"bills",   emoji:"📅",label:"Bills"},
          {id:"loans",   emoji:"📊",label:"Loans"},
          {id:"journal", emoji:"📓",label:"Journal"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",
            display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 0",position:"relative"}}>
            {tab===t.id&&<div style={{position:"absolute",top:-8,width:28,height:3,background:C.blue,borderRadius:3}}/>}
            <div style={{fontSize:20,filter:tab===t.id?"none":"grayscale(1)",opacity:tab===t.id?1:.45,transition:"all .2s"}}>{t.emoji}</div>
            <div style={{fontSize:10,color:tab===t.id?C.blue:C.muted,fontWeight:tab===t.id?800:500}}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* ══════════════════════════
          BRIEFING MODAL
      ══════════════════════════ */}
      {briefingModal&&(
        <Modal onClose={()=>setBriefingModal(false)} title="⚡ Chief Briefing Prompt">
          <div style={{fontSize:13,color:C.muted,marginBottom:12,lineHeight:1.6}}>
            Copy this prompt and paste it into <strong style={{color:C.navy}}>Claude.ai</strong> or any Chief chat to get a full financial analysis.
          </div>
          <div style={{background:C.bg,borderRadius:14,padding:14,marginBottom:14,maxHeight:320,overflowY:"auto",
            border:`1.5px solid ${C.border}`}}>
            <pre style={{fontSize:12,color:C.navy,lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"'DM Mono',monospace"}}>{promptText}</pre>
          </div>
          <button onClick={copyPrompt} style={{width:"100%",padding:16,borderRadius:16,border:"none",
            background:copied?C.green:C.blue,color:"#fff",fontSize:15,fontWeight:800,
            transition:"background .3s",marginBottom:10}}>
            {copied?"✅ Copied to Clipboard!":"📋 Copy Prompt"}
          </button>
          <div style={{fontSize:12,color:C.muted,textAlign:"center",lineHeight:1.6}}>
            Then paste it in <a href="https://claude.ai" target="_blank" rel="noreferrer" style={{color:C.blue,fontWeight:700}}>claude.ai</a> → new chat → ask Chief anything about your finances
          </div>
        </Modal>
      )}

      {/* ── MARK PAID ── */}
      {paidModal&&(
        <Modal onClose={()=>setPaidModal(null)} title={`💳 Mark Paid — ${paidModal.item.name}`}>
          <Inp label="Actual Amount Paid (₱)" type="number" value={paidAmt} onChange={e=>setPaidAmt(e.target.value)} style={{fontSize:20,fontWeight:700}}/>
          <Inp label="Date Paid" type="date" value={paidDate} onChange={e=>setPaidDate(e.target.value)}/>
          <BtnRow onCancel={()=>setPaidModal(null)} onConfirm={markPaid} ok="✓ Confirm Payment" okCol={C.green}/>
        </Modal>
      )}

      {/* ── EDIT INCOME ── */}
      {editIncome&&(
        <Modal onClose={()=>setEditIncome(null)} title={`✏️ Edit ${co[editIncome].label} Income`}>
          <Inp label="Income Amount (₱)" type="number" value={incomeVal} onChange={e=>setIncomeVal(e.target.value)} style={{fontSize:20,fontWeight:700}}/>
          <BtnRow onCancel={()=>setEditIncome(null)} onConfirm={()=>{
            setCo(p=>({...p,[editIncome]:{...p[editIncome],income:parseFloat(incomeVal)||p[editIncome].income}}));
            setEditIncome(null);
          }}/>
        </Modal>
      )}

      {/* ── BILL MODAL ── */}
      {billModal&&(
        <Modal onClose={()=>setBillModal(null)} title={billModal.mode==="edit"?"✏️ Edit Item":"➕ Add Bill / Item"}>
          <Inp label="Name" value={billForm.name||""} onChange={e=>setBillForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Electricity"/>
          <Inp label="Budget Amount (₱)" type="number" value={billForm.budget||""} onChange={e=>setBillForm(p=>({...p,budget:e.target.value}))}/>
          <Row label="Category">
            <div style={{display:"flex",gap:8}}>
              {["expense","bill","loan","savings"].map(cat=>(
                <button key={cat} onClick={()=>setBillForm(p=>({...p,cat}))} style={{flex:1,padding:"8px 4px",
                  borderRadius:12,border:`1.5px solid ${billForm.cat===cat?C.blue:C.border}`,
                  background:billForm.cat===cat?C.blueSoft:"transparent",
                  color:billForm.cat===cat?C.blue:C.muted,fontSize:11,fontWeight:700}}>
                  {catIco(cat)}<br/>{cat}
                </button>
              ))}
            </div>
          </Row>
          <BtnRow onCancel={()=>setBillModal(null)} onConfirm={saveBill}/>
        </Modal>
      )}

      {/* ── LOAN MODAL ── */}
      {loanModal&&(
        <Modal onClose={()=>setLoanModal(null)} title={loanModal==="new"?"➕ Add Loan":"✏️ Edit Loan"}>
          <Inp label="Loan Name" value={loanForm.name||""} onChange={e=>setLoanForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Car Loan"/>
          <Inp label="Total Loan Amount (₱)" type="number" value={loanForm.total||""} onChange={e=>setLoanForm(p=>({...p,total:e.target.value}))}/>
          <Inp label="Monthly Payment (₱)" type="number" value={loanForm.monthly||""} onChange={e=>setLoanForm(p=>({...p,monthly:e.target.value}))}/>
          <Inp label="Amount Already Paid (₱)" type="number" value={loanForm.paid||""} onChange={e=>setLoanForm(p=>({...p,paid:e.target.value}))}/>
          <Inp label="Notes (optional)" value={loanForm.notes||""} onChange={e=>setLoanForm(p=>({...p,notes:e.target.value}))} placeholder="e.g. BDO car loan"/>
          <ColorPicker value={loanForm.color||C.blue} onChange={v=>setLoanForm(p=>({...p,color:v}))}/>
          <BtnRow onCancel={()=>setLoanModal(null)} onConfirm={saveLoan}
            danger={loanModal!=="new"} onDanger={()=>{setLoans(p=>p.filter(l=>l.id!==loanModal));setLoanModal(null);}} dangerLabel="🗑 Delete Loan"/>
        </Modal>
      )}

      {/* ── GOAL MODAL ── */}
      {goalModal&&(
        <Modal onClose={()=>setGoalModal(null)} title={goalModal==="new"?"➕ Add Savings Goal":"✏️ Edit Goal"}>
          <Inp label="Goal Name" value={goalForm.name||""} onChange={e=>setGoalForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Emergency Fund"/>
          <Inp label="Target Amount (₱)" type="number" value={goalForm.target||""} onChange={e=>setGoalForm(p=>({...p,target:e.target.value}))}/>
          <Inp label="Current Savings (₱)" type="number" value={goalForm.current||""} onChange={e=>setGoalForm(p=>({...p,current:e.target.value}))}/>
          <Row label="Icon">
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["🎯","🛡️","✈️","💻","🏠","🚗","💍","🎓","🏖️","💊","📱","🎸"].map(ico=>(
                <button key={ico} onClick={()=>setGoalForm(p=>({...p,icon:ico}))} style={{width:40,height:40,
                  borderRadius:12,border:`2px solid ${goalForm.icon===ico?C.blue:C.border}`,
                  background:goalForm.icon===ico?C.blueSoft:C.white,fontSize:18}}>{ico}</button>
              ))}
            </div>
          </Row>
          <ColorPicker value={goalForm.color||C.green} onChange={v=>setGoalForm(p=>({...p,color:v}))}/>
          <BtnRow onCancel={()=>setGoalModal(null)} onConfirm={saveGoal}
            danger={goalModal!=="new"} onDanger={()=>{setGoals(p=>p.filter(g=>g.id!==goalModal));setGoalModal(null);}} dangerLabel="🗑 Delete Goal"/>
        </Modal>
      )}

      {/* ── ADD TASK ── */}
      {taskModal&&(
        <Modal onClose={()=>setTaskModal(false)} title="➕ Add Task">
          <Inp label="Task" value={taskForm.title} onChange={e=>setTaskForm(p=>({...p,title:e.target.value}))} placeholder="What needs to get done?"/>
          <Inp label="Due (optional)" value={taskForm.due||""} onChange={e=>setTaskForm(p=>({...p,due:e.target.value}))} placeholder="e.g. Today, Tomorrow, Friday"/>
          <Row label="Priority">
            <div style={{display:"flex",gap:8}}>
              {["urgent","high","normal","low"].map(pr=>(
                <button key={pr} onClick={()=>setTaskForm(p=>({...p,priority:pr}))} style={{flex:1,padding:"9px 0",
                  borderRadius:12,border:`1.5px solid ${taskForm.priority===pr?pCol(pr):C.border}`,
                  background:taskForm.priority===pr?pBg(pr):"transparent",
                  color:taskForm.priority===pr?pCol(pr):C.muted,fontSize:11,fontWeight:700,textTransform:"capitalize"}}>{pr}</button>
              ))}
            </div>
          </Row>
          <BtnRow onCancel={()=>setTaskModal(false)} onConfirm={addTask}/>
        </Modal>
      )}

    </div>
  );
}
