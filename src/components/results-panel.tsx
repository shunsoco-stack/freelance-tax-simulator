"use client";

import {
  ArrowDown,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  Landmark,
  PiggyBank,
  ReceiptJapaneseYen,
  Scale,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { formatCompactYen, formatPercent, formatYen } from "@/lib/format";
import { getTaxRules } from "@/lib/tax/taxRules";
import type {
  MonthlyProjectionRow,
  ProjectionMode,
  ScenarioResult,
  SimulatorInput,
  TaxEstimate,
} from "@/lib/tax/types";
import { MonthlyChart } from "./monthly-chart";
import { SegmentedControl } from "./form-controls";

export function ResultsPanel({
  input,
  estimate,
  resultMode,
  onResultModeChange,
  monthlyRows,
  scenarios,
}: {
  input: SimulatorInput;
  estimate: TaxEstimate;
  resultMode: ProjectionMode;
  onResultModeChange: (mode: ProjectionMode) => void;
  monthlyRows: MonthlyProjectionRow[];
  scenarios: ScenarioResult[];
}) {
  const rules = getTaxRules(input.year);
  return (
    <div className="results-page" id="results" tabIndex={-1}>
      <header className="results-heading">
        <span>
          <small>2026年分・概算</small>
          <h2>税金・社会保険の予測結果</h2>
          <p>入力を変えると、その場で結果が更新されます。</p>
        </span>
        <span className="verified-chip"><ShieldCheck size={16} />制度確認 2026年8月8日</span>
      </header>

      <SegmentedControl
        label="表示する計算"
        value={resultMode}
        options={[
          { value: "forecast", label: "年末までの予測", description: "現在の月平均を延長" },
          { value: "actual", label: "現在までの実績", description: "入力済み金額だけ" },
        ]}
        onChange={onResultModeChange}
      />

      <section className="hero-result" aria-label="主要な予測結果">
        <div className="hero-result-primary">
          <span className="metric-label">予想される税・社会保険</span>
          <strong className="numeric">{formatYen(estimate.totalBurden)}</strong>
          <p>税金 {formatYen(estimate.totalTax)} ＋ 社会保険 {formatYen(estimate.totalSocialInsurance)}</p>
        </div>
        <div className="hero-result-takehome">
          <span className="metric-label">予想手取り</span>
          <strong className="numeric">{formatYen(estimate.takeHome)}</strong>
          <p>事業利益・他所得から税・社会保険を差し引いた概算</p>
        </div>
      </section>

      <section className="metric-grid" aria-label="年間予測の主要数値">
        <MetricCard icon={<TrendingUp />} label="年間売上" value={estimate.annualSales} note={resultMode === "forecast" ? "年末予測" : "現在まで"} />
        <MetricCard icon={<ReceiptJapaneseYen />} label="年間経費" value={estimate.annualExpenses} note={resultMode === "forecast" ? "年末予測" : "現在まで"} />
        <MetricCard icon={<CircleDollarSign />} label="事業所得" value={estimate.businessIncome} note={`青色控除 ${formatCompactYen(estimate.appliedBlueDeduction)}`} />
        <MetricCard icon={<Landmark />} label="課税所得" value={estimate.taxableIncome} note={`所得控除 ${formatCompactYen(estimate.totalDeductions)}`} />
      </section>

      <section className="reserve-card">
        <span className="reserve-icon"><PiggyBank size={28} /></span>
        <div>
          <small>今から毎月の納税準備額</small>
          <strong className="numeric">{formatYen(estimate.monthlyReserveNeeded)}</strong>
          <p>
            必要見込 {formatYen(estimate.totalBurden)} − 確保済み {formatYen(input.reservedFunds)}
            ＝ 不足 {formatYen(estimate.remainingToReserve)}を、残り{estimate.monthsRemaining}か月で準備
          </p>
        </div>
      </section>

      <section className="rate-section">
        <div className="section-title-row"><div><small>負担の見え方</small><h3>税率・実質負担率</h3></div><Scale size={22} /></div>
        <div className="rate-grid">
          <RateRing label="売上に対する税" value={estimate.taxToSalesRate} color="#246B73" />
          <RateRing label="所得に対する税" value={estimate.taxToIncomeRate} color="#A66A3F" />
          <RateRing label="税・社会保険" value={estimate.totalBurdenRate} color="#6E5A8A" />
        </div>
      </section>

      <section>
        <div className="section-title-row"><div><small>内訳</small><h3>何に、いくら備えるか</h3></div><WalletCards size={22} /></div>
        <div className="tax-breakdown-grid">
          <BreakdownCard label="所得税" amount={estimate.incomeTax} status="自動計算">
            課税所得 {formatYen(estimate.taxableIncome)} を1,000円未満切捨て後、超過累進税率で計算しています。
          </BreakdownCard>
          <BreakdownCard label="復興特別所得税" amount={estimate.reconstructionIncomeTax} status="2.1%">
            所得税 {formatYen(estimate.incomeTax)} × 2.1%、1円未満切捨てです。
          </BreakdownCard>
          <BreakdownCard label="住民税" amount={estimate.residentTax} status="全国標準概算" tone="approximate">
            所得割 {formatYen(estimate.residentIncomeTax)}、均等割 {formatYen(estimate.residentPerCapitaTax)}、森林環境税 {formatYen(estimate.forestEnvironmentTax)}。2026年所得に対する2027年度課税の見込です。
          </BreakdownCard>
          <BreakdownCard label="個人事業税" amount={estimate.businessTax} status={input.businessTaxRate ? `${input.businessTaxRate * 100}%選択` : "対象外・未確認"} tone="approximate">
            青色申告特別控除前の事業利益から事業主控除 {formatYen(estimate.businessTaxOwnerDeduction)} を差し引き、選択税率で計算しています。
          </BreakdownCard>
          <BreakdownCard label="消費税" amount={estimate.consumptionTax} status={consumptionMethodLabel(input.consumptionTaxMethod)} tone={estimate.consumptionTaxDetail.supported ? "normal" : "warning"}>
            {estimate.consumptionTaxDetail.explanation} 売上税額 {formatYen(estimate.consumptionTaxDetail.outputTax)}、仕入税額控除等 {formatYen(estimate.consumptionTaxDetail.inputTaxCredit)}。
          </BreakdownCard>
          <BreakdownCard label="国民健康保険" amount={estimate.nationalHealthInsurance} status="ユーザー入力" tone="approximate">
            {input.prefecture}{input.municipality ? ` ${input.municipality}` : ""}の通知・公的試算をもとに入力した金額です。アプリでは自動推測していません。
          </BreakdownCard>
          <BreakdownCard label="国民年金" amount={estimate.nationalPension} status="公的月額">
            2026年暦年の通常月額を合計しています。前納・免除・未納・実際の支払日は反映しません。
          </BreakdownCard>
        </div>
      </section>

      <section className="calculation-flow">
        <div className="section-title-row"><div><small>計算の流れ</small><h3>所得税が決まるまで</h3></div><ChevronRight size={22} /></div>
        <ol>
          <FlowStep label="売上" value={estimate.annualSales} />
          <FlowStep label="経費" value={-estimate.annualExpenses} />
          <FlowStep label="青色申告特別控除" value={-estimate.appliedBlueDeduction} />
          <FlowStep label="他の所得を含む合計所得" value={estimate.totalIncome} />
          <FlowStep label="所得控除" value={-estimate.totalDeductions} />
          <FlowStep label="課税所得" value={estimate.taxableIncome} emphasis />
          <FlowStep label="所得税＋復興特別所得税" value={estimate.incomeTax + estimate.reconstructionIncomeTax} emphasis />
        </ol>
      </section>

      {resultMode === "forecast" ? (
        <section className="chart-section">
          <div className="section-title-row"><div><small>1〜12月</small><h3>実績と年末予測</h3><p>濃色が実績、淡色が予測。破線は毎月の積立目安です。</p></div><TrendingUp size={22} /></div>
          <MonthlyChart rows={monthlyRows} />
          <div className="monthly-table-scroll">
            <table className="monthly-table">
              <thead><tr><th>月</th><th>区分</th><th>売上</th><th>経費</th><th>利益</th><th>積立目安</th></tr></thead>
              <tbody>{monthlyRows.map((row) => <tr key={row.month}><th>{row.month}月</th><td><span className={`status-dot ${row.status}`}>{row.status === "actual" ? "実績" : "予測"}</span></td><td>{formatYen(row.revenue)}</td><td>{formatYen(row.expenses)}</td><td>{formatYen(row.profit)}</td><td>{formatYen(row.reserve)}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      ) : null}

      {resultMode === "forecast" ? <ScenarioComparison scenarios={scenarios} /> : null}
      {resultMode === "forecast" ? <PaymentTimeline estimate={estimate} year={input.year} /> : null}

      <details className="basis-panel">
        <summary><span><CheckCircle2 size={19} />計算根拠を見る</span><small>入力値・控除・税率・参照制度</small></summary>
        <div className="basis-content">
          <dl>
            <div><dt>適用年度</dt><dd>{rules.label}</dd></div>
            <div><dt>合計所得</dt><dd>{formatYen(estimate.totalIncome)}</dd></div>
            <div><dt>所得税の基礎控除</dt><dd>{formatYen(estimate.basicDeduction)}</dd></div>
            <div><dt>社会保険料控除</dt><dd>{formatYen(estimate.socialInsuranceDeduction)}</dd></div>
            <div><dt>その他所得控除</dt><dd>{formatYen(estimate.itemizedDeductions)}</dd></div>
            <div><dt>所得税速算</dt><dd>課税所得 × 該当税率 − 速算控除</dd></div>
            <div><dt>住民税</dt><dd>標準所得割10%＋均等割4,000円＋森林環境税1,000円</dd></div>
            <div><dt>制度最終確認日</dt><dd>{rules.verifiedAt}</dd></div>
          </dl>
          <h4>参照した公的情報</h4>
          <ul className="source-list">
            {rules.sources.map((source) => (
              <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.publisher}「{source.title}」</a><span>確認 {source.checkedAt}</span></li>
            ))}
          </ul>
        </div>
      </details>

      <section className="disclaimer" role="note">
        <CircleAlert size={21} aria-hidden="true" />
        <div><strong>この結果は納税準備のための概算です</strong><p>実際の税額は所得状況、控除、自治体、税制改正、申告内容などにより異なります。確定申告や具体的な税務判断については、国税庁・税務署・税理士等へご確認ください。</p></div>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: number; note: string }) {
  return <article className="metric-card"><span aria-hidden="true">{icon}</span><div><small>{label}</small><strong className="numeric">{formatYen(value)}</strong><p>{note}</p></div></article>;
}

function RateRing({ label, value, color }: { label: string; value: number; color: string }) {
  const degree = Math.min(360, Math.max(0, value * 360));
  return <article className="rate-card"><div className="rate-ring" style={{ background: `conic-gradient(${color} ${degree}deg, #e7ebe9 ${degree}deg)` }}><span className="numeric">{formatPercent(value)}</span></div><strong>{label}</strong><small>概算</small></article>;
}

function BreakdownCard({ label, amount, status, children, tone = "normal" }: { label: string; amount: number; status: string; children: React.ReactNode; tone?: "normal" | "approximate" | "warning" }) {
  return <details className={`breakdown-card tone-${tone}`}><summary><span><small>{label}</small><strong className="numeric">{formatYen(amount)}</strong></span><span className="breakdown-status">{status}</span></summary><div className="breakdown-explanation"><p>{children}</p><span>なぜこの金額？</span></div></details>;
}

function FlowStep({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return <li className={emphasis ? "emphasis" : undefined}><span>{label}</span><strong className="numeric">{value < 0 ? "−" : ""}{formatYen(Math.abs(value))}</strong><ArrowDown size={14} aria-hidden="true" /></li>;
}

function ScenarioComparison({ scenarios }: { scenarios: ScenarioResult[] }) {
  return <section className="scenario-section"><div className="section-title-row"><div><small>もし○○したら？</small><h3>シナリオ比較</h3><p>減税額だけでなく、支出後の手元資金まで比較します。</p></div><Scale size={22} /></div><div className="scenario-grid">{scenarios.map((scenario, index) => <article className={`scenario-card ${index === 0 ? "is-current" : ""}`} key={scenario.id}><span className="scenario-number">{index === 0 ? "基準" : `案${index}`}</span><h4>{scenario.name}</h4><p>{scenario.description}</p><dl><div><dt>課税所得</dt><dd>{formatYen(scenario.estimate.taxableIncome)}</dd></div><div><dt>年間税負担</dt><dd>{formatYen(scenario.estimate.totalTax)}</dd></div><div><dt>追加の現金支出</dt><dd>{formatYen(scenario.additionalCashOut)}</dd></div><div className="scenario-cash"><dt>支出後の手元資金</dt><dd>{formatYen(scenario.cashAfterContribution)}</dd></div></dl>{index > 0 ? <div className={`tax-difference ${scenario.taxDifference >= 0 ? "positive" : "negative"}`}>税額差 {scenario.taxDifference >= 0 ? "−" : "+"}{formatYen(Math.abs(scenario.taxDifference))}<small>税額が下がっても支出は増えます</small></div> : null}</article>)}</div></section>;
}

function PaymentTimeline({ estimate, year }: { estimate: TaxEstimate; year: number }) {
  const following = year + 1;
  const events = [
    { period: `${following}年3月ごろ`, title: "所得税・復興特別所得税", amount: estimate.incomeTax + estimate.reconstructionIncomeTax, note: "原則3月15日。休日等で変わる場合があります。" },
    { period: `${following}年3月末ごろ`, title: "消費税・地方消費税", amount: estimate.consumptionTax, note: "課税事業者は原則3月31日。" },
    { period: `${following}年6月以降`, title: "住民税", amount: estimate.residentTax, note: "普通徴収は一般に6・8・10月、翌1月。自治体により異なります。" },
    { period: `${following}年8月・11月ごろ`, title: "個人事業税", amount: estimate.businessTax, note: "対象業種のみ。都道府県の通知に従います。" },
  ].filter((event) => event.amount > 0);
  return <section className="timeline-section"><div className="section-title-row"><div><small>いつ支払う？</small><h3>納税時期タイムライン</h3><p>2026年所得に対する一般的な支払時期です。確定日ではありません。</p></div><CalendarDays size={22} /></div><ol className="timeline">{events.map((event) => <li key={event.title}><span className="timeline-marker" aria-hidden="true" /><div><small>{event.period}</small><h4>{event.title}</h4><p>{event.note}</p></div><strong className="numeric">{formatYen(event.amount)}</strong></li>)}</ol></section>;
}

function consumptionMethodLabel(method: SimulatorInput["consumptionTaxMethod"]): string {
  return { exempt: "免税", general: "原則課税概算", simplified: "簡易課税概算", "two-tenths": "2割特例概算" }[method];
}
