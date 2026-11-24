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
  let latest, history, historyDay, loading = false, retryAt = 0, mode = 'all', datesSet = false;
  const from = get('report-from'), to = get('report-to');
  function message(text) {
    get('report-result').textContent = text;
  }
  function render() {
    if (!latest) return;
    const today = localDateTime(latest.updated).slice(0, 10);
    const through = localDateTime(latest.updated);
    const dates = Object.keys(history?.days || {}).sort();
    from.max = to.max = today;
    from.min = to.min = dates.length ? shiftDay(dates[0], 1) : '';
    if (!datesSet) {
      from.value = to.value = today;
      datesSet = true;
    }
    let start, end, before, after = latest.accounts;
    let basis = '원금', ending = '현재 평가액', note = '세 계좌의 합산 원금 대비 수익률';
    const period = get('report-period');
    if (mode === 'all') {
      const first = history?.first_trade;
      period.textContent = (first ? '첫 거래 ' + localDateTime(first).slice(0, 10) + ' ~ ' : '누적 · ') + through + ' KST';
    } else {
      start = mode === 'custom' ? from.value : mode === 'week' ? shiftDay(today, -6) : today;
      end = mode === 'custom' ? to.value : today;
      period.textContent = (start || '시작일') + ' ~ ' + (end || '종료일') + ' · KST';
      if (!start || !end || start > end || end > today) return message('시작일과 종료일을 확인해 주세요.');
      if (!history && loading) return message('날짜별 평가액을 불러오는 중입니다.');
      const opening = history?.days[shiftDay(start, -1)];
      const closing = end === today ? latest : history?.days[end];
      if (!opening || !closing) {
        return message(dates.length ? '이 기간의 시작 또는 종료 평가액 기록이 없습니다. 조회 가능한 첫 시작일은 ' + from.min + '입니다.' : '기간별 평가액을 불러올 수 없습니다.');
      }
      before = opening.accounts;
      after = closing.accounts;
      basis = '시작 평가액'; ending = end === today ? '현재 평가액' : '종료 평가액';
      note = '평가 시각 ' + localDateTime(opening.at) + ' → ' + localDateTime(end === today ? latest.updated : closing.at) + ' KST · 시작 평가액 대비 수익률';
    }
    const rows = coins.map(s => {
      const base = before ? before[s].equity : latest.accounts[s].baseline_equity;
      const equity = after[s].equity;
      const pnl = before ? equity - base : after[s].total_pnl;
      const realized = after[s].realized - (before ? before[s].realized : 0);
      const floating = before ? pnl - realized : after[s].unrealized;
      return {s, base, equity, pnl, realized, floating};
    });
    const sum = key => rows.reduce((total, row) => total + row[key], 0);
    const rate = (pnl, base) => base > 0 ? signed(100 * pnl / base) + '%' : '—';
    const pnl = sum('pnl');
    const detail = (label, value) => '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>';
    const coinRow = r => '<tr><th scope="row"><span class="report-coin"><img class="coin-icon" alt="" src="coin-' + r.s.toLowerCase() + (r.s === 'ETH' ? '.png' : '.svg') + '">' + r.s + '</span></th><td>' + money(r.equity) + '</td><td class="' + color(r.pnl) + '">' + signed(r.pnl) + '</td><td class="' + color(r.pnl) + '">' + rate(r.pnl, r.base) + '</td></tr>';
    const stale = (!latest.healthy || Date.now() / 1000 - latest.updated > 900) && (mode === 'all' || end === today);
    get('report-result').innerHTML =
      '<div class="report-headline"><strong class="' + color(pnl) + '">' + signed(pnl) + ' <small>USDT</small></strong><b class="' + color(pnl) + '">' + rate(pnl, sum('base')) + '</b></div>' +
      '<dl class="report-grid">' + detail(basis, money(sum('base'))) + detail(ending, money(sum('equity'))) + detail('실현 손익', signed(sum('realized'))) + detail(before ? '미실현 손익 변동' : '미실현 손익', signed(sum('floating'))) + '</dl>' +
      '<table class="report-table" aria-label="종목별 모의 성과, 금액 단위 USDT"><thead><tr><th>종목</th><th>' + ending + '</th><th>손익</th><th>수익률</th></tr></thead><tbody>' + rows.map(coinRow).join('') + '</tbody></table>' +
      '<p class="report-note">' + (stale ? '마지막 수신 자료 기준 · ' : '') + note + ' · 모의 계좌 · 금액 단위 USDT</p>';
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
  get('report').querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.period;
    get('report').querySelectorAll('[data-period]').forEach(b => {
      b.setAttribute('aria-pressed', String(b === button));
      b.classList.toggle('on', b === button);
    });
    get('report-dates').hidden = mode !== 'custom';
    render();
  }));
  for (const input of [from, to]) input.addEventListener('input', render);
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
