const DashboardLanguage = (() => {
  const english = {
    "워크스페이스 메뉴": "Workspace menu",
    "KRAPI 트레이딩 현황": "KRAPI trading overview",
    "운영 현황": "Overview",
    "트레이딩 현황": "Trading overview",
    "코인 수익 리포트": "Crypto performance",
    "실시간 차트": "Live chart",
    "거래 내역": "Trade history",
    "시장 종목": "Markets",
    "모의 운영": "Paper trading",
    "모의 계좌 현황": "Paper account overview",
    "워크스페이스": "Workspace",
    "트레이딩": "Trading",
    "버전 선택": "Version",
    "자료 불러오는 중": "Loading data…",
    "화면 테마 변경": "Change theme",
    "운영 버전": "Dashboard version",
    "BTC, ETH, SOL의 시세와 계좌 현황을 확인하세요.": "Prices and account performance for BTC, ETH and SOL.",
    "주식 토큰 보기 →": "View stock tokens →",
    "BTC · ETH · SOL 수익 리포트": "BTC · ETH · SOL performance",
    "모의 계좌 · KST": "Paper accounts · KST",
    "전체 누적 손익": "All-time P&L",
    "첫 거래일부터": "Since the first trade",
    "오늘 손익": "Today’s P&L",
    "한국시간 기준": "Korea Standard Time",
    "종목별 성과": "Performance by asset",
    "조회 기간": "Reporting period",
    "전체 누적": "All time",
    "오늘": "Today",
    "최근 7일": "Last 7 days",
    "직접 선택": "Custom",
    "시작일": "Start date",
    "종료일": "End date",
    "계좌 자료를 불러오는 중": "Loading account data…",
    "종목": "Asset",
    "계좌 전체 손익": "Total account P&L",
    "전체 손익 불러오는 중": "Loading total P&L…",
    "지금 포지션": "Current position",
    "차트": "Chart",
    "봉 간격": "Candle interval",
    "범위": "Time range",
    "인디케이터 선택": "Select indicators",
    "차트 배율 맞춤": "Fit chart to view",
    "차트 맞춤 ↔": "Fit chart ↔",
    "최근 거래": "Recent trades",
    "주식 토큰": "Stock tokens",
    "← 코인 시장": "← Crypto markets",
    "주식 토큰 계좌 전체 손익": "Stock token account P&L",
    "주식 토큰 종목": "Stock token markets",
    "보유 포지션": "Open positions",
    "주식·상품 토큰 시세": "Stock & commodity token prices",
    "11종목": "11 markets",
    "최근 체결": "Recent fills",
    "이 페이지는 모의 운영 결과를 표시합니다.": "This dashboard shows paper trading results.",
    "정상 운영": "Live",
    "상태 확인 중": "Checking status",
    "자료 갱신을 확인하고 있습니다": "Checking for fresh data.",
    "밝게": "Light",
    "어둡게": "Dark",
    "밝은 화면으로 변경": "Switch to light mode",
    "어두운 화면으로 변경": "Switch to dark mode",
    "지금 {asset} 포지션 없음": "No open {asset} position",
    "직전 거래": "Last trade",
    "{time} 진입": "Entry at {time}",
    "평균 진입가": "Avg. entry price",
    "현재가": "Current price",
    "목표 / 익절": "Take-profit target",
    "손절": "Stop loss",
    "수량": "Size",
    "{n}건": "{n} total",
    "완료된 거래가 없습니다": "No closed trades",
    "계좌 전체 PnL": "Account P&L",
    "실현 손익": "Realized P&L",
    "미실현 손익": "Unrealized P&L",
    "현재 평가액": "Current equity",
    "{side} 보유": "{side} open",
    "새 신호 대기": "Waiting for signal",
    "BB상단": "Upper BB",
    "BB중심": "Middle BB",
    "BB하단": "Lower BB",
    "MACD 히스토그램": "MACD histogram",
    "지표": "Indicators",
    "볼린저밴드": "Bollinger Bands",
    "평균 진입": "Avg. entry",
    "목표(종료)": "Target (closed)",
    "손절(종료)": "Stop loss (closed)",
    "물타기 대기": "Pending scale-in",
    "롱": "Long",
    "숏": "Short",
    "진입": "entry",
    "물타기": "Scale-in",
    "익절": "Take profit",
    "청산": "Close",
    "{n}분봉": "{n}m",
    "{n}시간": "{n}h",
    "거래량": "Volume",
    "모의 계좌": "Paper trading",
    "갱신 지연": "Data delayed",
    "{time} 기준": "As of {time}",
    "첫 거래일": "First trade",
    "조회 중": "Loading",
    "전일 마감 기록 없음": "Previous close unavailable",
    "원금": "Starting capital",
    "세 계좌의 합산 원금 대비 수익률": "Return on combined starting capital",
    "시작일과 종료일을 확인해 주세요.": "Check the start and end dates.",
    "날짜별 평가액을 불러오는 중입니다.": "Loading daily balances…",
    "이 기간의 시작 또는 종료 평가액 기록이 없습니다.": "The opening or closing balance is unavailable for this period.",
    "시작 평가액": "Opening equity",
    "종료 평가액": "Closing equity",
    "첫 거래일 원금": "Initial capital",
    "평가 기준": "Valuation period",
    "미실현 손익 변동": "Change in unrealized P&L",
    "종목별 모의 성과, 금액 단위 USDT": "Paper performance by asset in USDT",
    "손익": "P&L",
    "수익률": "Return",
    "합계": "Total",
    "마지막 수신 자료 기준": "Last available data",
    "금액 단위 USDT": "Amounts in USDT",
    "주식 토큰 자료 갱신을 확인하고 있습니다": "Checking for fresh stock token data.",
    "{time} 갱신": "Updated {time}",
    "자료를 불러올 수 없습니다": "Data unavailable",
    "자료 갱신을 기다리고 있습니다": "Waiting for updated data…",
    "주식 토큰 계좌 전체 PnL": "Stock token account P&L",
    "{time} 시작": "Started {time}",
    "실현·정산 손익": "Settled P&L",
    "손익 내역": "P&L breakdown",
    "매매 실현": "Realized on trades",
    "수수료": "Fees",
    "펀딩": "Funding",
    "포지션": "Position",
    "평가 손익": "Unrealized P&L",
    "보유 포지션이 없습니다": "No open positions",
    "표시가격": "Mark price",
    "기초자산 가격": "Underlying price",
    "펀딩 비율": "Funding rate",
    "24시간 거래대금": "24h turnover",
    "갱신": "Updated",
    "체결 시각": "Fill time",
    "거래": "Side",
    "체결가": "Fill price",
    "매수": "Buy",
    "매도": "Sell",
    "체결 기록이 없습니다": "No fills recorded",
    "주식·상품 토큰의 시세와 계좌 현황을 확인하세요.": "Prices and account performance for stock and commodity tokens.",
    "추가": "add",
    "축소": "reduce",
    "반전 진입": "reversal entry",
    "실현": "Realized",
    "수익 구간": "Profit zone",
    "손실 구간": "Loss zone",
    "평균 진입가 위": "Above avg. entry",
    "평균 진입가 아래": "Below avg. entry",
    "화면 밖": "off chart",
    "캔들 데이터를 불러올 수 없습니다": "Candle data unavailable",
    "이 종목의 캔들 데이터를 확인하고 있습니다": "Checking candles for this market…",
    "캔들 데이터 불러오는 중": "Loading candles…",
    "마지막 봉": "Last candle",
    "갱신 확인 중": "Checking for updates"
  };
  const key = 'krapi-v5-language';
  const params = new URLSearchParams(location.search);
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  const requested = params.get('lang');
  let lang = ['en','ko'].includes(requested) ? requested : saved === 'ko' ? 'ko' : 'en';
  function text(original, values) {
    const translated = lang === 'en' ? (english[original] ?? original) : original;
    return values ? translated.replace(/\{(\w+)\}/g, (_, name) => values[name]) : translated;
  }

  // Capture the static labels once, before the charts and report render their data.
  const root = document.querySelector('.app-shell');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const labels = [];
  for (let node; (node = walker.nextNode());) {
    const key = node.data.trim();
    if (Object.hasOwn(english, key)) labels.push([node, node.data, key]);
  }
  const aria = [...root.querySelectorAll('[aria-label]')]
    .map(node => [node, node.getAttribute('aria-label')])
    .filter(([,label]) => Object.hasOwn(english,label));
  const buttons = [...document.querySelectorAll('[data-language]')];
  function apply() {
    document.documentElement.lang = lang;
    for (const [node, source, label] of labels) {
      if (node.isConnected) node.data = source.replace(label, text(label));
    }
    for (const [node, label] of aria) node.setAttribute('aria-label', text(label));
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.language === lang));
  }
  for (const button of buttons) button.addEventListener('click', () => {
    lang = button.dataset.language;
    try { localStorage.setItem(key, lang); } catch {}
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState(window.history.state, '', url);
    apply();
    window.dispatchEvent(new Event('dashboard-language'));
  });
  apply();
  return {text, get locale() { return lang === 'en' ? 'en-US' : 'ko-KR'; }};
})();
const uiText = DashboardLanguage.text;
