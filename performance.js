const PerformanceReport = (() => {
  const coins = ['BTC', 'ETH', 'SOL'];
  const dayMs = 86400000;
  const get = id => document.getElementById(id);
  const usd = new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const money = n => usd.format(Math.abs(n) < 0.005 ? 0 : n);
  const signed = n => (n >= 0.005 ? '+' : '') + money(n);
  const color = n => Math.abs(n) < 0.005 ? '' : n > 0 ? 'up' : 'down';
  const localDateTime = ts => new Date(ts * 1000 + 9 * 3600000).toISOString().slice(0, 16).replace('T', ' ');
  const shiftDay = (date, days) => new Date(Date.parse(date + 'T00:00:00Z') + days * dayMs).toISOString().slice(0, 10);
  let latest, history, historyDay, loading = false, retryAt = 0, mode = 'all';
  const from = get('report-from'), to = get('report-to');
  function message(text) {
    get('report-result').textContent = text;
  }
  const rate = (pnl, base) => base > 0 ? signed(100 * pnl / base) + '%' : '—';
  const shortDate = iso => new Intl.DateTimeFormat(DashboardLanguage.locale, {year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(iso+'T00:00:00Z'));
  const sumAccounts = (accounts, key) => coins.reduce((n, s) => n + accounts[s][key], 0);
  function card(id, period, pnl, base) {
    const root = get(id);
    root.querySelector('.card-period').textContent = period;
    const value = root.querySelector('.card-value');
    value.className = 'card-value ' + (pnl == null ? '' : color(pnl));
    value.querySelector('strong').textContent = pnl == null ? '—' : signed(pnl) + ' USDT';
    value.querySelector('b').textContent = pnl == null ? '' : rate(pnl, base);
  }
  function render() {
    if (!latest) return;
    const through = localDateTime(latest.updated);
    const today = through.slice(0, 10);
    const first = history?.first_trade ? localDateTime(history.first_trade).slice(0, 10) : '';
    const dates = Object.keys(history?.days || {}).sort();
    const dayOpen = history?.days[shiftDay(today, -1)];
    const principal = sumAccounts(latest.accounts, 'baseline_equity');
    const dayBase = dayOpen ? sumAccounts(dayOpen.accounts, 'equity') : null;
    const dayPnl = dayOpen ? sumAccounts(latest.accounts, 'equity') - dayBase : null;
    const isStale = !latest.healthy || Date.now() / 1000 - latest.updated > 900;
    get('report-asof').textContent = uiText('모의 계좌') + ' · ' + uiText('{time} 기준',{time:through+' KST'}) + (isStale ? ' · '+uiText('갱신 지연') : '');
    card('report-lifetime', (first ? shortDate(first) : uiText('첫 거래일')) + ' ~ ' + shortDate(today),
      sumAccounts(latest.accounts, 'total_pnl'), principal);
    card('report-today', shortDate(today) + (dayOpen ? '' : loading ? ' · '+uiText('조회 중') : ' · '+uiText('전일 마감 기록 없음')), dayPnl, dayBase);
    from.max = to.max = today;
    from.min = to.min = first || (dates.length ? shiftDay(dates[0], 1) : '');
    if (mode !== 'custom') {
      from.value = mode === 'all' ? first : mode === 'week' ? shiftDay(today, -6) : today;
      to.value = today;
    }
    const start = from.value, end = to.value;
    const usePrincipal = mode === 'all' || (first && first === start);
    let before, after = latest.accounts;
    let basis = uiText('원금'), ending = uiText('현재 평가액'), note = uiText('세 계좌의 합산 원금 대비 수익률');
    const period = get('report-period');
    period.textContent = '';
    if (mode !== 'all') {
      if (!start || !end || start > end || end > today || (first && start < first)) return message(uiText('시작일과 종료일을 확인해 주세요.'));
      if (!history && loading) return message(uiText('날짜별 평가액을 불러오는 중입니다.'));
      const opening = history?.days[shiftDay(start, -1)];
      const closing = end === today ? latest : history?.days[end];
      if ((!usePrincipal && !opening) || !closing) return message(uiText('이 기간의 시작 또는 종료 평가액 기록이 없습니다.'));
      before = usePrincipal ? undefined : opening.accounts;
      after = closing.accounts;
      basis = usePrincipal ? uiText('원금') : uiText('시작 평가액');
      ending = end === today ? uiText('현재 평가액') : uiText('종료 평가액');
      const since = usePrincipal ? uiText('첫 거래일 원금') : localDateTime(opening.at);
      note = uiText('평가 기준')+' ' + since + ' → ' + localDateTime(end === today ? latest.updated : closing.at) + ' KST';
    }
    const rows = coins.map(s => {
      const base = before ? before[s].equity : latest.accounts[s].baseline_equity;
      const equity = after[s].equity;
      const pnl = !before && after === latest.accounts ? after[s].total_pnl : equity - base;
      const realized = after[s].realized - (before ? before[s].realized : 0);
      const floating = !before && after === latest.accounts ? after[s].unrealized : pnl - realized;
      return {s, base, equity, pnl, realized, floating};
    });
    const sum = key => rows.reduce((total, row) => total + row[key], 0);
    const pnl = sum('pnl');
    const detail = (label, value) => '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>';
    const coinRow = r => '<tr><th scope="row"><span class="report-coin"><img class="coin-icon" alt="" src="coin-' + r.s.toLowerCase() + (r.s === 'ETH' ? '.png' : '.svg') + '">' + r.s + '</span></th><td>' + money(r.equity) + '</td><td class="' + color(r.pnl) + '">' + signed(r.pnl) + '</td><td class="' + color(r.pnl) + '">' + rate(r.pnl, r.base) + '</td></tr>';
    const stale = (!latest.healthy || Date.now() / 1000 - latest.updated > 900) && (mode === 'all' || end === today);
    get('report-result').innerHTML =
      '<dl class="report-grid">' + detail(basis, money(sum('base'))) + detail(ending, money(sum('equity'))) + detail(uiText('실현 손익'), signed(sum('realized'))) + detail(before ? uiText('미실현 손익 변동') : uiText('미실현 손익'), signed(sum('floating'))) + '</dl>' +
      '<table class="report-table" aria-label="'+uiText('종목별 모의 성과, 금액 단위 USDT')+'"><thead><tr><th>'+uiText('종목')+'</th><th>' + ending + '</th><th>'+uiText('손익')+'</th><th>'+uiText('수익률')+'</th></tr></thead><tbody>' + rows.map(coinRow).join('') + '</tbody><tfoot><tr><th scope="row">'+uiText('합계')+'</th><td>' + money(sum('equity')) + '</td><td class="' + color(pnl) + '">' + signed(pnl) + '</td><td class="' + color(pnl) + '">' + rate(pnl, sum('base')) + '</td></tr></tfoot></table>' +
      '<p class="report-note">' + (stale ? uiText('마지막 수신 자료 기준')+' · ' : '') + note + ' · '+uiText('모의 계좌')+' · '+uiText('금액 단위 USDT')+'</p>';
  }
  function validHistory(h, today) {
    if (!h?.days || typeof h.days !== 'object' || Array.isArray(h.days) ||
        !coins.every(s => h.baselines?.[s] === latest.accounts[s].baseline_equity) ||
        !(h.first_trade === null || (Number.isFinite(h.first_trade) && h.first_trade > 0 && h.first_trade <= latest.updated))) return false;
    return Object.entries(h.days).every(([date, p]) =>
      Number.isFinite(p?.at) && localDateTime(p.at).slice(0, 10) === date && date < today &&
      coins.every(s => Number.isFinite(p.accounts?.[s]?.equity) && Number.isFinite(p.accounts[s].realized)));
  }
  async function refreshHistory(today) {
    if (loading || historyDay === today || Date.now() < retryAt) return;
    loading = true;
    try {
      const r = await fetch('report-history.json?day=' + today, {cache: 'no-store', signal: AbortSignal.timeout(10000)});
      if (!r.ok) throw Error();
      const h = await r.json();
      if (!validHistory(h, today)) throw Error();
      history = h;
      if (h.days[shiftDay(today, -1)]) historyDay = today;
    } catch {} finally {
      retryAt = Date.now() + 60000;
      loading = false;
      render();
    }
  }
  function selectMode(next) {
    mode = next;
    get('report').querySelectorAll('[data-period]').forEach(b => {
      const selected = b.dataset.period === mode;
      b.setAttribute('aria-pressed', String(selected));
      b.classList.toggle('on', selected);
    });
    render();
  }
  get('report').querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
    selectMode(button.dataset.period);
    if (mode === 'custom') from.focus();
  }));
  for (const input of [from, to]) input.addEventListener('input', () => selectMode('custom'));
  window.addEventListener('dashboard-language', render);
  return {update(value) {
    if (value?.version !== 'v5' || value.visibility !== 'public-summary' || !Number.isFinite(value.updated) ||
        !coins.every(s => ['equity','baseline_equity','realized','unrealized','total_pnl'].every(k => Number.isFinite(value.accounts?.[s]?.[k])) &&
        value.accounts[s].baseline_equity > 0)) return;
    if (latest && value.updated < latest.updated) return;
    latest = value;
    refreshHistory(localDateTime(value.updated).slice(0, 10));
    render();
  }};
})();
