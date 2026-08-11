"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CloudOff,
  DatabaseZap,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatYen } from "@/lib/format";
import { clearStoredInput, loadStoredInput, saveStoredInput } from "@/lib/storage";
import { calculateTaxEstimate } from "@/lib/tax/calculator";
import { buildMonthlyProjection } from "@/lib/tax/projection";
import { createBlankInput, createSampleInput, type SampleRevenue } from "@/lib/tax/sampleData";
import { calculateScenarios } from "@/lib/tax/scenarios";
import type { ProjectionMode, SimulatorInput } from "@/lib/tax/types";
import { InputStep, STEP_LABELS } from "./input-steps";
import { ResultsPanel } from "./results-panel";

export function TaxSimulator() {
  const [input, setInput] = useState<SimulatorInput>(() => createSampleInput());
  const [activeStep, setActiveStep] = useState(0);
  const [resultMode, setResultMode] = useState<ProjectionMode>("forecast");
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"sample" | "saving" | "saved" | "unavailable">("sample");

  useEffect(() => {
    const stored = loadStoredInput();
    if (stored) {
      setInput(stored);
      setSaveState("saved");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      setSaveState(saveStoredInput(input) ? "saved" : "unavailable");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [hydrated, input]);

  const actualEstimate = useMemo(() => calculateTaxEstimate(input, "actual"), [input]);
  const forecastEstimate = useMemo(() => calculateTaxEstimate(input, "forecast"), [input]);
  const estimate = resultMode === "forecast" ? forecastEstimate : actualEstimate;
  const monthlyRows = useMemo(
    () => buildMonthlyProjection(input, forecastEstimate.totalBurden),
    [input, forecastEstimate.totalBurden],
  );
  const scenarios = useMemo(() => calculateScenarios(input), [input]);

  function goToStep(step: number) {
    setActiveStep(Math.max(0, Math.min(5, step)));
    window.requestAnimationFrame(() => {
      document.getElementById(step === 5 ? "results" : "workspace-main")?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function loadSample(revenue: SampleRevenue) {
    setInput(createSampleInput(revenue));
    setSaveState("sample");
    setActiveStep(0);
    setResultMode("forecast");
  }

  function clearData() {
    clearStoredInput();
    setInput(createBlankInput());
    setSaveState("saved");
    setActiveStep(0);
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <a className="brand" href="#top" aria-label="個人事業主 税金予測シミュレーター トップ">
          <Image src="/icons/tax-simulator.svg" alt="" width={42} height={42} priority />
          <span><strong>個人事業主 税金予測</strong><small>シミュレーター</small></span>
        </a>
        <div className="header-actions">
          <span className={`save-state save-${saveState}`} aria-live="polite">
            {saveState === "saving" ? <Save size={15} /> : saveState === "unavailable" ? <CloudOff size={15} /> : <Check size={15} />}
            {saveState === "sample" ? "架空サンプル" : saveState === "saving" ? "端末に保存中" : saveState === "saved" ? "端末に保存済み" : "保存できません"}
          </span>
          <button type="button" className="button button-primary header-result-button" onClick={() => goToStep(5)}>
            結果を見る<ArrowRight size={16} />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="intro-section">
          <div className="intro-copy">
            <span className="eyebrow"><ShieldCheck size={15} />2026年分の公的制度を確認済み</span>
            <h1>年末の税金を、<br /><span>今のうちに見える化。</span></h1>
            <p>現在の売上・経費から、所得税、住民税、個人事業税、消費税、社会保険と「毎月いくら取り分けるか」をリアルタイムで概算します。</p>
            <div className="trust-points">
              <span><DatabaseZap size={16} />入力は端末内だけ</span>
              <span><Sparkles size={16} />入力と同時に再計算</span>
              <span><ShieldCheck size={16} />制度確認日を表示</span>
            </div>
          </div>
          <div className="sample-panel">
            <span className="sample-kicker">架空データで試す</span>
            <h2>年商を選ぶだけで体験できます</h2>
            <div className="sample-buttons">
              {([3_000_000, 6_000_000, 10_000_000, 15_000_000] as SampleRevenue[]).map((revenue) => (
                <button type="button" key={revenue} onClick={() => loadSample(revenue)}>
                  <span>年商</span><strong>{(revenue / 10_000).toLocaleString("ja-JP")}万円</strong>
                </button>
              ))}
            </div>
            <small>すべて架空の数値です。選択後も自由に変更できます。</small>
          </div>
        </section>

        <nav className="step-nav" aria-label="入力ステップ">
          <ol>
            {STEP_LABELS.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  className={index === activeStep ? "is-current" : index < activeStep ? "is-complete" : undefined}
                  aria-current={index === activeStep ? "step" : undefined}
                  onClick={() => goToStep(index)}
                >
                  <span>{index < activeStep ? <Check size={14} /> : index + 1}</span>{label}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className={`workspace ${activeStep === 5 ? "results-workspace" : ""}`}>
          <section className="workspace-main" id="workspace-main" tabIndex={-1}>
            {activeStep < 5 ? (
              <InputStep step={activeStep} input={input} onChange={setInput} onClearStorage={clearData} />
            ) : (
              <ResultsPanel
                input={input}
                estimate={estimate}
                resultMode={resultMode}
                onResultModeChange={setResultMode}
                monthlyRows={monthlyRows}
                scenarios={scenarios}
              />
            )}

            {activeStep < 5 ? (
              <div className="step-actions">
                <button type="button" className="button button-secondary" onClick={() => goToStep(activeStep - 1)} disabled={activeStep === 0}>
                  <ArrowLeft size={17} />戻る
                </button>
                <span>Step {activeStep + 1} / 5</span>
                <button type="button" className="button button-primary" onClick={() => goToStep(activeStep + 1)}>
                  {activeStep === 4 ? "結果を見る" : "次へ"}<ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <button type="button" className="button button-secondary return-edit" onClick={() => goToStep(0)}><ArrowLeft size={17} />入力を見直す</button>
            )}
          </section>

          {activeStep < 5 ? (
            <aside className="live-summary" aria-label="リアルタイム年間予測" aria-live="polite">
              <header><span><small>LIVE</small><strong>年末までの予測</strong></span><span className="live-dot" /></header>
              <div className="summary-primary"><small>税・社会保険</small><strong className="numeric">{formatYen(forecastEstimate.totalBurden)}</strong><p>税金 {formatYen(forecastEstimate.totalTax)}<br />社会保険 {formatYen(forecastEstimate.totalSocialInsurance)}</p></div>
              <dl>
                <div><dt>年間売上</dt><dd>{formatYen(forecastEstimate.annualSales)}</dd></div>
                <div><dt>年間経費</dt><dd>{formatYen(forecastEstimate.annualExpenses)}</dd></div>
                <div><dt>事業所得</dt><dd>{formatYen(forecastEstimate.businessIncome)}</dd></div>
                <div className="summary-takehome"><dt>予想手取り</dt><dd>{formatYen(forecastEstimate.takeHome)}</dd></div>
              </dl>
              <div className="summary-reserve"><span>毎月の準備目安</span><strong>{formatYen(forecastEstimate.monthlyReserveNeeded)}</strong></div>
              <button type="button" className="button button-primary button-full" onClick={() => goToStep(5)}>詳しい結果を見る<ArrowRight size={17} /></button>
              <small className="summary-note">概算・制度確認 2026年8月8日</small>
            </aside>
          ) : null}
        </div>

        <section className="privacy-strip">
          <ShieldCheck size={22} />
          <div><strong>税務データをクラウドへ送りません</strong><p>ログイン不要。入力値はこのブラウザ内だけに保存され、計算も端末上で完結します。</p></div>
          <button type="button" className="button button-ghost" onClick={clearData}><RotateCcw size={16} />新しく入力</button>
        </section>
      </main>

      {activeStep < 5 ? (
        <div className="mobile-result-bar">
          <span><small>予想負担</small><strong>{formatYen(forecastEstimate.totalBurden)}</strong></span>
          <button type="button" className="button button-primary" onClick={() => goToStep(5)}>結果を見る<ArrowRight size={16} /></button>
        </div>
      ) : null}

      <footer className="app-footer">
        <Image src="/icons/tax-simulator.svg" alt="" width={30} height={30} />
        <p><strong>個人事業主 税金予測シミュレーター</strong><span>2026年分対応・最終制度確認 2026年8月8日</span></p>
        <span>概算結果は税務判断の代わりにはなりません。</span>
      </footer>
    </div>
  );
}
