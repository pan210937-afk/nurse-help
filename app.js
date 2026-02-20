let MODULES=[];
const state={q:"",system:"全部",tier:"all",unlocked:false};

function uniq(arr){return [...new Set(arr)].filter(Boolean);}
function escapeHtml(s){return (s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1200);}
async function copyText(text){try{await navigator.clipboard.writeText(text||"");toast("已复制");}catch(e){toast("复制失败：请手动选中复制");}}

function loadUnlock(){state.unlocked=localStorage.getItem("ndss_unlocked")==="1";}
function setUnlocked(v){state.unlocked=v;localStorage.setItem("ndss_unlocked",v?"1":"0");document.getElementById("unlockBadge").textContent=v?"已解锁 Pro":"未解锁";renderList();}

function matches(m){
  const q=state.q.trim().toLowerCase();
  if(state.system!=="全部" && m["所属系统"]!==state.system) return false;
  if(state.tier==="free" && m._tier!=="free") return false;
  if(state.tier==="pro" && m._tier!=="pro") return false;
  if(!q) return true;
  const hay=[
    m["模块名称"],m["所属系统"],m["模块类型"],
    m["机制与病理基础"],m["危险信号（升级标准）"],m["护理评估要点"],
    m["护理措施"],m["健康教育要点"],m["护理记录模板"],m["SBAR模板"],m["参考依据"]
  ].join(" ").toLowerCase();
  return hay.includes(q);
}

function fmtRow(label,text){
  return `<div class="row"><div class="k">${label}</div><div class="v">${escapeHtml(text||"")}</div><button class="copyBtn" data-copy="${label}">复制</button></div>`;
}

function renderList(){
  const list=document.getElementById("list");
  const items=MODULES.filter(matches);
  document.getElementById("count").textContent=`找到 ${items.length} 条`;

  list.innerHTML=items.map(m=>{
    const locked=(m._tier==="pro" && !state.unlocked);
    const preview=(m["护理措施"]||"");
    return `<div class="card ${locked?"locked":""}" data-id="${m["模块编号"]}">
      <div class="cardTop">
        <div class="title">${escapeHtml(m["模块名称"])}</div>
        <div class="meta">
          <span class="tag">${escapeHtml(m["所属系统"])}</span>
          <span class="tag2">${m._tier==="free"?"免费":"Pro"}</span>
        </div>
      </div>
      <div class="preview">${escapeHtml(preview.slice(0,70))}${preview.length>70?"…":""}</div>
      <div class="cardActions">
        <button class="openBtn">打开</button>
        ${locked?`<button class="unlockBtn">解锁查看</button>`:`<button class="copyQuickBtn">复制护理措施</button>`}
      </div>
    </div>`;
  }).join("");

  list.querySelectorAll(".card").forEach(card=>{
    const id=Number(card.getAttribute("data-id"));
    const m=MODULES.find(x=>x["模块编号"]===id);
    card.querySelector(".openBtn").addEventListener("click",()=>openDetail(m));
    const quick=card.querySelector(".copyQuickBtn");
    if(quick) quick.addEventListener("click",()=>copyText(m["护理措施"]||""));
    const ub=card.querySelector(".unlockBtn");
    if(ub) ub.addEventListener("click",openUnlock);
  });
}

function openDetail(m){
  const locked=(m._tier==="pro" && !state.unlocked);
  const panel=document.getElementById("detail");
  panel.innerHTML="";
  panel.insertAdjacentHTML("beforeend",`
    <div class="detailHeader">
      <div>
        <div class="detailTitle">${escapeHtml(m["模块名称"])} <span class="pill">${escapeHtml(m["所属系统"])}</span></div>
        <div class="detailSub">模块 #${m["模块编号"]} · ${m._tier==="free"?"免费":"Pro"}</div>
      </div>
      <div class="detailBtns">
        <button id="copyRecord" class="primary">复制护理记录模板</button>
        <button id="copySBAR">复制SBAR</button>
        <button id="copyMeasures">只复制护理措施</button>
      </div>
    </div>
  `);

  if(locked){
    panel.insertAdjacentHTML("beforeend",`
      <div class="lockedPanel">
        <h3>此模块为 Pro 内容</h3>
        <p>解锁后可查看：机制/危险信号/评估/措施/复评/宣教/模板/参考依据。</p>
        <button class="primary" id="goUnlock">输入解锁码</button>
        <p class="hint">演示解锁码：NDSS19（上线后你可以换成你自己的兑换码）。</p>
      </div>
    `);
    panel.querySelector("#goUnlock").addEventListener("click",openUnlock);
    return;
  }

  const blocks=document.createElement("div");blocks.className="blocks";
  blocks.innerHTML=[
    fmtRow("机制/病理基础",m["机制与病理基础"]),
    fmtRow("危险信号（升级标准）",m["危险信号（升级标准）"]),
    fmtRow("护理评估要点",m["护理评估要点"]),
    fmtRow("护理措施",m["护理措施"]),
    fmtRow("复评时间",m["复评时间"]),
    fmtRow("效果评价",m["效果评价"]),
    fmtRow("健康教育要点",m["健康教育要点"]),
    `<div class="sep"></div>`,
    fmtRow("护理记录模板",m["护理记录模板"]),
    fmtRow("SBAR模板",m["SBAR模板"]),
    fmtRow("参考依据",m["参考依据"])
  ].join("");
  panel.appendChild(blocks);

  const map={
    "机制/病理基础":m["机制与病理基础"],
    "危险信号（升级标准）":m["危险信号（升级标准）"],
    "护理评估要点":m["护理评估要点"],
    "护理措施":m["护理措施"],
    "复评时间":m["复评时间"],
    "效果评价":m["效果评价"],
    "健康教育要点":m["健康教育要点"],
    "护理记录模板":m["护理记录模板"],
    "SBAR模板":m["SBAR模板"],
    "参考依据":m["参考依据"]
  };
  panel.querySelectorAll(".copyBtn").forEach(btn=>{
    btn.addEventListener("click",()=>copyText(map[btn.getAttribute("data-copy")]||""));
  });
  document.getElementById("copyRecord").addEventListener("click",()=>copyText(m["护理记录模板"]||""));
  document.getElementById("copySBAR").addEventListener("click",()=>copyText(m["SBAR模板"]||""));
  document.getElementById("copyMeasures").addEventListener("click",()=>copyText(m["护理措施"]||""));
}

function openUnlock(){document.getElementById("unlockModal").classList.add("show");document.getElementById("unlockInput").focus();}
function closeUnlock(){document.getElementById("unlockModal").classList.remove("show");}

async function init(){
  MODULES = (Array.isArray(window.NDSS_DATA) && window.NDSS_DATA.length) ? window.NDSS_DATA : await fetch("./data.json").then(r=>r.json()).catch(()=> (Array.isArray(window.NDSS_DATA)? window.NDSS_DATA: []));
  loadUnlock();
  document.getElementById("unlockBadge").textContent=state.unlocked?"已解锁 Pro":"未解锁";

  const systems=["全部",...uniq(MODULES.map(m=>m["所属系统"]))];
  const sel=document.getElementById("systemSelect");
  sel.innerHTML=systems.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  sel.addEventListener("change",(e)=>{state.system=e.target.value;renderList();});
  document.getElementById("q").addEventListener("input",(e)=>{state.q=e.target.value;renderList();});
  document.querySelectorAll("[data-tier]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll("[data-tier]").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      state.tier=btn.getAttribute("data-tier");
      renderList();
    });
  });

  document.getElementById("unlockClose").addEventListener("click",closeUnlock);
  document.getElementById("unlockBtn").addEventListener("click",()=>{
    const code=(document.getElementById("unlockInput").value||"").trim();
    if(code==="NDSS19" || code==="NDSSPRO"){setUnlocked(true);closeUnlock();toast("解锁成功");}
    else toast("解锁码不正确");
  });
  document.getElementById("lockBtn").addEventListener("click",()=>setUnlocked(false));

  openDetail(MODULES[0]);
  renderList();

  if("serviceWorker" in navigator){navigator.serviceWorker.register("./sw.js").catch(()=>{});}
}
document.addEventListener("DOMContentLoaded",init);
