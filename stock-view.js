let STOCKS=null,stockFailed=false,stockLoading=false;
let STOCK_CANDLES=null,stockChartFailed=false,stockChartLoading=false,stockSymbol='SOXLUSDT';
const STOCK_SYMBOLS=['SILVERUSDT','GOLDUSDT','SKHYNIXUSDT','SKHYUSDT','SOXLUSDT','SOXSUSDT','MUSTOCKUSDT','MSTRUSDT','QQQUSDT','CRCLUSDT','NVDAUSDT'];
const stockStamp=t=>new Date(t*1000).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
const stockName=s=>s.replace(/USDT$/,'');
const stockTable=(head,body)=>`<div class="stock-scroll"><table class="stock-table"><thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
function validateStocks(d){
  const keys=(v,w)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...w].sort().join(',');
  const finite=v=>typeof v==='number'&&Number.isFinite(v),positive=v=>finite(v)&&v>0;
  if(!keys(d,['visibility','updated','healthy','account','markets','fills'])||d.visibility!=='public-stock-summary'||!positive(d.updated)||typeof d.healthy!=='boolean'||!Array.isArray(d.markets)||!Array.isArray(d.fills))throw Error('invalid stock summary');
  if(d.account===null){if(d.healthy||d.markets.length||d.fills.length)throw Error('invalid unavailable stock data');return;}
  const a=d.account,money=['baseline_equity','cash','equity','realized','unrealized','total_pnl','total_pct','gross_realized','fees','funding'];
  if(!keys(a,[...money,'created','updated','active','positions'])||!money.every(k=>finite(a[k]))||a.baseline_equity<=0||a.fees<0||!positive(a.created)||!positive(a.updated)||typeof a.active!=='boolean'||!Array.isArray(a.positions)||Math.abs(a.equity-a.baseline_equity-a.total_pnl)>.001||Math.abs(a.realized+a.unrealized-a.total_pnl)>.001||Math.abs(a.cash-a.baseline_equity-a.realized)>.001||Math.abs(a.baseline_equity+a.gross_realized-a.fees+a.funding-a.cash)>.001)throw Error('invalid stock account');
  for(const p of a.positions){
    if(!keys(p,['symbol','side','size','entry','mark','pnl','pnl_pct','updated','opened_at'])||!STOCK_SYMBOLS.includes(p.symbol)||!['long','short'].includes(p.side)||!['size','entry','mark','updated','opened_at'].every(k=>positive(p[k]))||!finite(p.pnl)||!finite(p.pnl_pct)||Math.abs((p.side==='long'?1:-1)*p.size*(p.mark-p.entry)-p.pnl)>.001)throw Error('invalid stock position');
  }
  if(new Set(a.positions.map(p=>p.symbol)).size!==a.positions.length||Math.abs(a.positions.reduce((n,p)=>n+p.pnl,0)-a.unrealized)>.001)throw Error('invalid stock position totals');
  if(d.markets.length>STOCK_SYMBOLS.length||new Set(d.markets.map(r=>r.symbol)).size!==d.markets.length)throw Error('duplicate stock markets');
  for(const r of d.markets)if(!keys(r,['symbol','mark','last','underlying','funding_rate','turnover','updated'])||!STOCK_SYMBOLS.includes(r.symbol)||!['mark','last','underlying','updated'].every(k=>positive(r[k]))||!finite(r.funding_rate)||!finite(r.turnover)||r.turnover<0)throw Error('invalid stock quote');
  if(d.fills.length>30)throw Error('too many stock fills');
  for(const r of d.fills)if(!keys(r,['symbol','time','side','size','price','fee','realized'])||!STOCK_SYMBOLS.includes(r.symbol)||!['buy','sell'].includes(r.side)||!['time','size','price'].every(k=>positive(r[k]))||!finite(r.fee)||r.fee<0||!finite(r.realized))throw Error('invalid stock fill');
}
function stockStatus(){
  if(!stockVisible)return;
  const ok=!!(STOCKS?.account&&STOCKS.healthy&&!stockFailed&&Date.now()/1000-STOCKS.updated<600);
  el('live').textContent=ok?'정상 운영':'상태 확인 중';el('live').parentElement.classList.toggle('failed',!ok);
  el('stale').hidden=ok||(!STOCKS&&!stockFailed);el('stale').textContent='주식 토큰 자료 갱신을 확인하고 있습니다';
}
function renderStocks(preserve=true){
  if(!stockVisible)return;
  const a=STOCKS?.account;
  el('stock-updated').textContent=a?`모의 계좌 · ${stockStamp(a.updated)} 갱신 · UTC+9`:(stockFailed||STOCKS?'자료를 불러올 수 없습니다':'자료 불러오는 중');
  if(!a){for(const id of ['stock-pnl','stock-positions','stock-markets','stock-fills'])el(id).textContent='자료 갱신을 기다리고 있습니다';el('stock-fill-count').textContent='';renderStockChart(preserve);stockStatus();return;}
  el('stock-pnl').innerHTML=`<div><div class="pos-id"><strong>주식 토큰 계좌 전체 PnL</strong></div><div class="pnl-row"><div class="pnl ${cls(a.total_pnl)}">${sgn(a.total_pnl)}<small>USDT</small></div><div class="pct ${cls(a.total_pct)}">${sgn(a.total_pct)}%</div></div><p class="stock-pnl-note">원금 ${num(a.baseline_equity)} USDT · ${stockStamp(a.created)} 시작</p></div><dl class="facts"><div><dt>실현·정산 손익</dt><dd class="${cls(a.realized)}">${sgn(a.realized)}<span>USDT</span></dd></div><div><dt>미실현 손익</dt><dd class="${cls(a.unrealized)}">${sgn(a.unrealized)}<span>USDT</span></dd></div><div><dt>현재 평가액</dt><dd>${num(a.equity)}<span>USDT</span></dd></div></dl><details class="stock-costs"><summary>손익 내역</summary>매매 실현 ${sgn(a.gross_realized)} · 수수료 ${num(a.fees)} · 펀딩 ${sgn(a.funding)} USDT</details>`;
  el('stock-positions').innerHTML=a.positions.length?stockTable(['종목','포지션','수량','평균 진입가','현재가','평가 손익'],a.positions.map(p=>`<tr><td><button data-stock-symbol="${p.symbol}"><strong>${stockName(p.symbol)}</strong></button></td><td><span class="side ${p.side}">${p.side.toUpperCase()}</span></td><td>${num(p.size,4)}</td><td>${num(p.entry,4)}</td><td>${num(p.mark,4)}</td><td class="${cls(p.pnl)}">${sgn(p.pnl)} USDT</td></tr>`).join('')):'<div class="none">보유 포지션이 없습니다</div>';
  el('stock-markets').innerHTML=stockTable(['종목','표시가격','기초자산 가격','펀딩 비율','24시간 거래대금','갱신'],STOCKS.markets.map(r=>`<tr><td><button data-stock-symbol="${r.symbol}"><strong>${stockName(r.symbol)}</strong></button></td><td>${num(r.mark,4)}</td><td>${num(r.underlying,4)}</td><td>${sgn(r.funding_rate*100,4)}%</td><td>${num(r.turnover,0)}</td><td>${stockStamp(r.updated)}</td></tr>`).join(''));
  el('stock-fill-count').textContent=STOCKS.fills.length+'건';
  el('stock-fills').innerHTML=STOCKS.fills.length?stockTable(['체결 시각','종목','거래','수량','체결가','실현 손익'],STOCKS.fills.map(r=>`<tr><td>${stockStamp(r.time)}</td><td><button data-stock-symbol="${r.symbol}"><strong>${stockName(r.symbol)}</strong></button></td><td class="${r.side==='buy'?'up':'down'}">${r.side==='buy'?'매수':'매도'}</td><td>${num(r.size,4)}</td><td>${num(r.price,4)}</td><td class="${cls(r.realized)}">${sgn(r.realized)} USDT</td></tr>`).join('')):'<div class="none">체결 기록이 없습니다</div>';
  renderStockChart(preserve);stockStatus();
}
async function refreshStocks(){
  if(stockLoading)return;stockLoading=true;
  try{const r=await fetch('stocks.json?v='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('stock fetch failed');const d=await r.json();validateStocks(d);STOCKS=d;stockFailed=false;}
  catch{stockFailed=true;}finally{stockLoading=false;renderStocks();}
}
function showStocks(show){
  stockVisible=show;
  el(show?'stock-category':'crypto-category').open=true;
  for(const id of ['symbols','total-pnl','pos','trades-panel'])el(id).hidden=show;
  if(show)el('stock-panel').insertBefore(el('chart-panel'),el('stock-positions').closest('section'));
  else el('trades-panel').before(el('chart-panel'));
  el('chart-panel').hidden=false;
  el('stock-panel').hidden=!show;el('stock-shortcut').hidden=show;
  markStockSelection();
  document.querySelectorAll('[data-asset]').forEach(b=>b.classList.toggle('active',!show&&b.dataset.asset===sym));
  document.querySelector('.breadcrumbs strong').textContent=show?'주식 토큰':VERSION.toUpperCase()+' 운영 현황';
  document.querySelector('.intro-copy').textContent=show?'주식·상품 토큰의 시세와 계좌 현황을 확인하세요.':'BTC, ETH, SOL의 시세와 계좌 현황을 확인하세요.';
  if(show){firstBar=null;renderStocks(false);refreshStocks();refreshStockCandles();}else{el('lw').style.visibility='';el('ov').style.visibility='';document.querySelectorAll('#intervals button,#ranges button,#indicators button,#reset-view').forEach(b=>b.disabled=false);firstBar=null;status();}
}
el('stock-shortcut').onclick=()=>showStocks(true);
el('stock-back').onclick=()=>{showStocks(false);if(D&&C)render();};
document.querySelectorAll('.side-nav a').forEach(a=>a.addEventListener('click',e=>{if(!stockVisible)return;e.preventDefault();const target=a.dataset.section==='#chart-panel'?el('chart-panel'):a.dataset.section==='#trades-panel'?el('stock-fills').closest('section'):el('overview');target.scrollIntoView({block:'start'});}));
setInterval(()=>{if(stockVisible)refreshStocks();},10000);
setInterval(stockStatus,10000);

function stockChartPosition(){
  const p=STOCKS?.account?.positions.find(p=>p.symbol===stockSymbol);
  return p?{...p,symbol:stockName(p.symbol),notional:p.size*p.entry,target:0,stop:0,pending:[],fills:[]}:null;
}
function stockChartFills(){
  const balances=Object.fromEntries((STOCKS?.account?.positions||[]).map(p=>[p.symbol,p.size*(p.side==='long'?1:-1)]));
  // Reverse the actual fills from current quantities so a short cover is never a new long.
  return (STOCKS?.fills||[]).map((r,index)=>({...r,index})).sort((a,b)=>b.time-a.time||b.index-a.index).map(r=>{
    const after=balances[r.symbol]||0,delta=r.size*(r.side==='buy'?1:-1),raw=after-delta,before=Math.abs(raw)*r.price<.01?0:raw;
    balances[r.symbol]=before;
    const kind=!before?'entry':Math.abs(after)*r.price<.01?'close':before*after<0?'reverse':Math.abs(after)>Math.abs(before)?'add':'reduce';
    const side=(kind==='close'||kind==='reduce'?before:after)>0?'long':'short';
    return {...r,kind,positionSide:side};
  });
}
function stockChartMarkers(rows,bucket){
  const times=new Set(rows.map(r=>r[0]+KST));
  return stockChartFills().filter(r=>r.symbol===stockSymbol&&times.has(bucket(r.time))&&bucket(r.time)>=rows[0][0]+KST&&bucket(r.time)<=rows.at(-1)[0]+KST).map(r=>{
    const entry=['entry','add','reverse'].includes(r.kind),long=r.positionSide==='long',word={entry:'진입',add:'추가',reduce:'축소',close:'청산',reverse:'반전 진입'}[r.kind];
    return {time:bucket(r.time),position:r.side==='buy'?'belowBar':'aboveBar',shape:entry?(long?'arrowUp':'arrowDown'):'circle',color:css(entry?(long?'--up':'--down'):r.realized>=0?'--up':'--down'),text:`${long?'롱':'숏'} ${word} (${r.side==='buy'?'매수':'매도'}) ${hm(r.time)} · ${num(r.price,4)}${r.realized?` · 실현 ${sgn(r.realized)}`:''}`};
  }).sort((a,b)=>a.time-b.time);
}
function stockPositionOverlay(p,W,x,y,zone,out){
  const H=chart.panes()[0].getHeight(),entry=y(p.entry),up=p.side==='long',left=Math.max(0,x(p.opened_at)??0);
  if(!Number.isFinite(entry))return;
  const boundary=Math.max(0,Math.min(H,entry));
  zone('tp',left,W,boundary,up?0:H);zone('sl',left,W,boundary,up?H:0);
  const region=(gain,a,b)=>{if(Math.abs(a-b)>32)out.push(`<div class="ztext ${gain?'up':'down'}" data-stock-region style="right:${el('ov').clientWidth-W+10}px;top:${Math.max(a,b)-22}px">${gain?'수익':'손실'} 구간 · 평균 진입가 ${gain===up?'위':'아래'}</div>`);};
  if(left<W){region(true,boundary,up?0:H);region(false,boundary,up?H:0);}
  out.push(`<div class="tag ${up?'gain':'loss'}" data-stock-entry style="left:10px;top:8px;max-width:${W-20}px;white-space:normal;line-height:1.4">${esc(p.side.toUpperCase())} ${num(p.size)} ${chartAsset()} · ${stockStamp(p.opened_at)} 진입<br>평균 진입 ${num(p.entry,4)}${entry<0?' · ↑ 화면 밖':entry>H?' · ↓ 화면 밖':''}</div>`);
  const mark=y(p.mark),top=W<520?88:Math.max(88,Math.min(H-54,(mark??H/2)-30)),right=el('ov').clientWidth-W+10;
  out.push(`<div class="tag ${p.pnl>=0?'gain':'loss'}" data-stock-pnl style="right:${right}px;top:${top}px;max-width:${W-20}px;white-space:normal;line-height:1.4">${sgn(p.pnl)} USDT · ${sgn(p.pnl_pct)}%</div>`);
}
function renderStockChart(preserve=true){
  if(!stockVisible)return;
  markStockSelection();
  el('stock-symbols').innerHTML=STOCK_SYMBOLS.map(s=>`<button data-stock-symbol="${s}" class="${s===stockSymbol?'on':''}" aria-pressed="${s===stockSymbol}">${stockName(s)}</button>`).join('');
  const rows=STOCK_CANDLES?.[stockSymbol],ready=!!rows?.length;
  document.querySelectorAll('#intervals button,#ranges button,#indicators button,#reset-view').forEach(b=>b.disabled=!ready);
  el('lw').style.visibility=ready?'':'hidden';el('ov').style.visibility=ready?'':'hidden';
  if(!ready){if(chart){candles.setData([]);markers.setMarkers([]);}el('ov').innerHTML='';el('ttl').textContent=stockName(stockSymbol)+'/USDT';el('ohlc').textContent='';el('stock-chart-status').textContent=stockChartFailed?'캔들 데이터를 불러올 수 없습니다':STOCK_CANDLES?'이 종목의 캔들 데이터를 확인하고 있습니다':'캔들 데이터 불러오는 중';return;}
  const latest=rows.at(-1)[0],stale=Date.now()/1000-latest>180;
  el('stock-chart-status').textContent=`마지막 봉 ${stockStamp(latest)} · UTC+9${stockChartFailed||stale?' · 갱신 확인 중':''}`;
  if(!chart)buildChart();chartData(preserve);requestAnimationFrame(overlay);
}
async function refreshStockCandles(){
  if(stockChartLoading)return;stockChartLoading=true;
  try{
    const r=await fetch('stock-candles.json?v='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('candle fetch failed');const d=await r.json();
    if(d.visibility!=='public-stock-candles'||Object.keys(d).sort().join(',')!=='candles,updated,visibility'||!Number.isFinite(d.updated)||Object.keys(d.candles).sort().join(',')!==[...STOCK_SYMBOLS].sort().join(','))throw Error('invalid stock candles');
    for(const s of STOCK_SYMBOLS){const rows=d.candles[s];if(!Array.isArray(rows)||rows.length>1440)throw Error('invalid stock candle length');aggregateCandles(rows,1,true);if(rows.some(r=>r[0]<=0||Math.min(...r.slice(1,5))<=0))throw Error('invalid stock price');}
    STOCK_CANDLES=d.candles;stockChartFailed=false;
  }catch{stockChartFailed=true;}finally{stockChartLoading=false;renderStockChart(true);}
}
el('stock-panel').addEventListener('click',e=>{const b=e.target.closest('[data-stock-symbol]');if(!b||!STOCK_SYMBOLS.includes(b.dataset.stockSymbol))return;selectStock(b.dataset.stockSymbol);});
setInterval(()=>{if(stockVisible)refreshStockCandles();},60000);

function markStockSelection(){
  document.querySelectorAll('[data-stock-asset]').forEach(b=>{const on=stockVisible&&b.dataset.stockAsset===stockSymbol;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
}
function selectStock(symbol){
  if(!STOCK_SYMBOLS.includes(symbol))return;
  stockSymbol=symbol;firstBar=null;el('stock-category').open=true;
  if(!stockVisible)showStocks(true);else renderStocks(false);
  markStockSelection();
  const selected=document.querySelector('.asset-nav [data-stock-asset="'+symbol+'"]');if(selected?.offsetParent)selected.scrollIntoView({block:'nearest'});
}
document.querySelector('.asset-nav').addEventListener('click',e=>{const b=e.target.closest('[data-stock-asset]');if(b)selectStock(b.dataset.stockAsset);});
