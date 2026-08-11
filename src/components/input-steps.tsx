"use client";

import { BookOpenCheck, Building2, Calculator, CircleAlert, Landmark, ReceiptText } from "lucide-react";
import { formatYen } from "@/lib/format";
import { cumulativeBusinessNumbers } from "@/lib/tax/projection";
import {
  DEDUCTION_KEYS,
  EXPENSE_CATEGORIES,
  type DeductionKey,
  type ExpenseCategory,
  type SimulatorInput,
} from "@/lib/tax/types";
import { MoneyField, NumberField, SegmentedControl, Toggle } from "./form-controls";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県",
  "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県",
  "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県",
  "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県",
  "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

export const STEP_LABELS = ["基本情報", "売上", "経費", "控除", "その他", "結果"];

const EXPENSE_LABELS: Record<ExpenseCategory, string> = {
  purchases: "仕入高",
  outsourcing: "外注費",
  rent: "地代家賃",
  utilities: "水道光熱費",
  communications: "通信費",
  advertising: "広告宣伝費",
  supplies: "消耗品費",
  travel: "旅費交通費",
  entertainment: "接待交際費",
  vehicles: "車両費",
  meetings: "会議費",
  fees: "支払手数料",
  taxes: "租税公課",
  depreciation: "減価償却費",
  familySalary: "専従者給与",
  other: "その他経費",
};

const DEDUCTION_LABELS: Record<DeductionKey, string> = {
  smallBusinessMutualAid: "小規模企業共済等掛金控除",
  ideco: "iDeCo掛金",
  lifeInsurance: "生命保険料控除額",
  earthquakeInsurance: "地震保険料控除額",
  medical: "医療費控除額",
  spouse: "配偶者控除額",
  spouseSpecial: "配偶者特別控除額",
  dependents: "扶養控除額",
  donations: "寄附金控除額（計算済み）",
  disability: "障害者控除額",
  singleParent: "ひとり親控除額",
  widow: "寡婦控除額",
  workingStudent: "勤労学生控除額",
  casualty: "雑損控除額",
  other: "その他の所得控除額",
};

export function InputStep({
  step,
  input,
  onChange,
  onClearStorage,
}: {
  step: number;
  input: SimulatorInput;
  onChange: (input: SimulatorInput) => void;
  onClearStorage: () => void;
}) {
  if (step === 0) return <BasicStep input={input} onChange={onChange} />;
  if (step === 1) return <RevenueStep input={input} onChange={onChange} />;
  if (step === 2) return <ExpenseStep input={input} onChange={onChange} />;
  if (step === 3) return <DeductionStep input={input} onChange={onChange} />;
  if (step === 4) {
    return <OtherStep input={input} onChange={onChange} onClearStorage={onClearStorage} />;
  }
  return null;
}

function SectionHeading({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="section-heading">
      <span className="section-icon" aria-hidden="true">{icon}</span>
      <span>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
        <p>{description}</p>
      </span>
    </header>
  );
}

function BasicStep({ input, onChange }: StepProps) {
  return (
    <div className="step-content">
      <SectionHeading
        icon={<BookOpenCheck size={20} />}
        eyebrow="Step 1"
        title="基本情報"
        description="税制年度と事業の前提を設定します。氏名・住所・マイナンバーは入力しません。"
      />
      <div className="notice notice-info">
        <Landmark size={18} aria-hidden="true" />
        <p><strong>2026年4月成立の最新改正を反映</strong><span>令和8年分の基礎控除引上げを適用しています。</span></p>
      </div>
      <div className="form-grid two-columns">
        <label className="field">
          <span className="field-label-row">対象年度</span>
          <select value={input.year} disabled aria-label="対象年度">
            <option value={2026}>2026年（令和8年分）</option>
          </select>
          <small className="field-caption">確認済み年度のみ選択できます</small>
        </label>
        <label className="field">
          <span className="field-label-row">現在の月</span>
          <select
            value={input.currentMonth}
            onChange={(event) => patch(onChange, input, { currentMonth: Number(event.target.value) })}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>{index + 1}月</option>
            ))}
          </select>
        </label>
        <NumberField
          label="開業年"
          value={input.businessStartYear}
          min={1950}
          max={2026}
          suffix="年"
          onChange={(value) => patch(onChange, input, { businessStartYear: value })}
        />
        <label className="field">
          <span className="field-label-row">開業月</span>
          <select
            value={input.businessStartMonth}
            onChange={(event) => patch(onChange, input, { businessStartMonth: Number(event.target.value) })}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>{index + 1}月</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label-row">都道府県</span>
          <select
            value={input.prefecture}
            onChange={(event) => patch(onChange, input, { prefecture: event.target.value })}
          >
            {PREFECTURES.map((prefecture) => <option key={prefecture}>{prefecture}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label-row">市区町村</span>
          <input
            type="text"
            value={input.municipality}
            onChange={(event) => patch(onChange, input, { municipality: event.target.value.slice(0, 40) })}
            placeholder="例：新宿区"
          />
          <small className="field-caption">住民税・国保は自治体差を注記するために使用</small>
        </label>
        <NumberField
          label="年齢"
          value={input.age}
          min={18}
          max={99}
          suffix="歳"
          onChange={(value) => patch(onChange, input, { age: value })}
        />
      </div>
      <SegmentedControl
        label="申告方法"
        value={input.filingType}
        options={[
          { value: "blue", label: "青色申告", description: "特別控除を選択" },
          { value: "white", label: "白色申告", description: "特別控除なし" },
        ]}
        onChange={(filingType) => patch(onChange, input, { filingType, blueDeduction: filingType === "white" ? 0 : input.blueDeduction || 100_000 })}
      />
      {input.filingType === "blue" ? (
        <SegmentedControl
          label="青色申告特別控除"
          value={input.blueDeduction}
          options={[
            { value: 100_000, label: "10万円", description: "簡易な帳簿など" },
            { value: 550_000, label: "55万円", description: "複式簿記・期限内申告" },
            { value: 650_000, label: "65万円", description: "55万円要件＋e-Tax等" },
          ]}
          onChange={(blueDeduction) => patch(onChange, input, { blueDeduction })}
        />
      ) : null}
    </div>
  );
}

function RevenueStep({ input, onChange }: StepProps) {
  return (
    <div className="step-content">
      <SectionHeading
        icon={<ReceiptText size={20} />}
        eyebrow="Step 2"
        title="売上"
        description={`${input.currentMonth}月までの実績から、年末まで同じペースが続く場合を予測します。`}
      />
      <SegmentedControl
        label="入力方法"
        value={input.inputMode}
        options={[
          { value: "simple", label: "簡単入力", description: "累計額だけ" },
          { value: "detailed", label: "詳細入力", description: "1〜12月" },
        ]}
        onChange={(inputMode) => patch(onChange, input, { inputMode })}
      />
      {input.inputMode === "simple" ? (
        <MoneyField
          label={`${input.currentMonth}月までの売上累計`}
          value={input.cumulativeRevenue}
          onChange={(cumulativeRevenue) => patch(onChange, input, { cumulativeRevenue })}
          help="請求済み・入金済みなど、普段の集計基準に合わせた現在までの事業売上を入力します。"
        />
      ) : (
        <div className="monthly-entry-grid" aria-label="月別売上入力">
          {input.monthlyRevenue.map((value, index) => (
            <MoneyField
              key={index}
              label={`${index + 1}月${index + 1 > input.currentMonth ? "（予定・任意）" : ""}`}
              value={value}
              onChange={(nextValue) => {
                const monthlyRevenue = [...input.monthlyRevenue];
                monthlyRevenue[index] = nextValue;
                patch(onChange, input, { monthlyRevenue });
              }}
              hint={index + 1 > input.currentMonth ? "空欄は月平均で予測" : "実績"}
            />
          ))}
        </div>
      )}
      <div className="form-grid two-columns">
        <MoneyField
          label="その他事業収入"
          value={input.otherBusinessRevenue}
          onChange={(otherBusinessRevenue) => patch(onChange, input, { otherBusinessRevenue })}
        />
        <MoneyField
          label="売上返品・値引き"
          value={input.salesReturns}
          onChange={(salesReturns) => patch(onChange, input, { salesReturns })}
          hint="売上から差し引きます"
        />
      </div>
    </div>
  );
}

function ExpenseStep({ input, onChange }: StepProps) {
  const cumulative = cumulativeBusinessNumbers(input);
  return (
    <div className="step-content">
      <SectionHeading
        icon={<Calculator size={20} />}
        eyebrow="Step 3"
        title="経費"
        description="事業に必要な支出だけを入力します。生活費や将来の予定支出は含めません。"
      />
      {input.inputMode === "simple" ? (
        <>
          <MoneyField
            label={`${input.currentMonth}月までの経費合計`}
            value={input.cumulativeExpenses}
            onChange={(cumulativeExpenses) => patch(onChange, input, { cumulativeExpenses })}
            help="仕入、家賃、外注、通信費など、必要経費の現在までの合計です。"
          />
          <p className="switch-mode-hint">内訳を入力する場合は、売上ステップで「詳細入力」へ切り替えてください。</p>
        </>
      ) : (
        <>
          <div className="section-total"><span>入力済み経費</span><strong className="numeric">{formatYen(cumulative.expenses)}</strong></div>
          <div className="form-grid two-columns">
            {EXPENSE_CATEGORIES.map((key) => (
              <MoneyField
                key={key}
                label={EXPENSE_LABELS[key]}
                value={input.expenseValues[key]}
                onChange={(value) => patch(onChange, input, { expenseValues: { ...input.expenseValues, [key]: value } })}
                help={key === "familySalary" ? "青色事業専従者給与等。適用要件を満たす金額だけを入力してください。" : undefined}
              />
            ))}
          </div>
        </>
      )}
      <div className="notice notice-neutral">
        <CircleAlert size={18} aria-hidden="true" />
        <p><strong>支出を増やすほど手元資金も減ります</strong><span>シナリオ比較では、減税額だけでなく現金支出後の手元資金も表示します。</span></p>
      </div>
    </div>
  );
}

function DeductionStep({ input, onChange }: StepProps) {
  return (
    <div className="step-content">
      <SectionHeading
        icon={<Landmark size={20} />}
        eyebrow="Step 4"
        title="控除・社会保険"
        description="分かる項目だけで計算できます。保険料ではなく、控除額と書かれた欄は計算済み控除額を入力してください。"
      />
      <SegmentedControl
        label="社会保険の扱い"
        value={input.socialInsuranceMode}
        options={[
          { value: "national", label: "国保・国民年金", description: "個人事業中心" },
          { value: "employee", label: "会社の社会保険", description: "会社員の副業など" },
          { value: "none", label: "計算から除外", description: "別途確認する" },
        ]}
        onChange={(socialInsuranceMode) => patch(onChange, input, { socialInsuranceMode })}
      />
      {input.socialInsuranceMode === "national" ? (
        <div className="form-grid two-columns">
          <MoneyField
            label="国民健康保険（年間見込）"
            value={input.nationalHealthInsuranceAnnual}
            onChange={(nationalHealthInsuranceAnnual) => patch(onChange, input, { nationalHealthInsuranceAnnual })}
            help="自治体・前年所得・世帯構成で大きく異なるため、通知書や自治体試算の金額を入力します。自動推測はしません。"
            hint={`${input.prefecture}${input.municipality ? ` ${input.municipality}` : ""}の公的試算をご確認ください`}
          />
          <Toggle
            label="国民年金を含める"
            description="2026年暦年：1〜3月17,510円、4〜12月17,920円／月"
            checked={input.includeNationalPension}
            onChange={(includeNationalPension) => patch(onChange, input, { includeNationalPension })}
          />
        </div>
      ) : null}
      {input.socialInsuranceMode === "employee" ? (
        <MoneyField
          label="給与から負担する社会保険料（年間）"
          value={input.employeeSocialInsuranceAnnual}
          onChange={(employeeSocialInsuranceAnnual) => patch(onChange, input, { employeeSocialInsuranceAnnual })}
          help="健康保険・厚生年金・雇用保険など、年間の本人負担見込額を入力します。"
        />
      ) : null}
      <details className="advanced-panel" open>
        <summary>主な所得控除を入力</summary>
        <p>証明書や公的シミュレーションで確認できた「控除額」を入力してください。</p>
        <div className="form-grid two-columns">
          {DEDUCTION_KEYS.slice(0, 5).map((key) => (
            <DeductionField key={key} deductionKey={key} input={input} onChange={onChange} />
          ))}
        </div>
      </details>
      <details className="advanced-panel">
        <summary>人的控除・その他を詳しく設定</summary>
        <p>適用要件の自動判定は行いません。対象と確認できた控除額だけを入力してください。</p>
        <div className="form-grid two-columns">
          {DEDUCTION_KEYS.slice(5).map((key) => (
            <DeductionField key={key} deductionKey={key} input={input} onChange={onChange} />
          ))}
          <MoneyField
            label="ふるさと納税額（参考）"
            value={input.hometownDonation}
            onChange={(hometownDonation) => patch(onChange, input, { hometownDonation })}
            help="上限や住民税の特例控除が複雑なため自動計算には含めません。寄附金控除額が分かる場合は別欄へ入力してください。"
            hint="税額計算には未反映"
          />
        </div>
      </details>
    </div>
  );
}

function DeductionField({ deductionKey, input, onChange }: StepProps & { deductionKey: DeductionKey }) {
  return (
    <MoneyField
      label={DEDUCTION_LABELS[deductionKey]}
      value={input.deductions[deductionKey]}
      onChange={(value) => patch(onChange, input, { deductions: { ...input.deductions, [deductionKey]: value } })}
      help={deductionKey === "lifeInsurance" || deductionKey === "earthquakeInsurance"
        ? "支払保険料そのものではなく、申告書に記載する控除額を入力してください。"
        : undefined}
    />
  );
}

function OtherStep({ input, onChange, onClearStorage }: StepProps & { onClearStorage: () => void }) {
  const twoTenthsEligible = input.invoiceRegistered && input.taxableBecauseOfInvoice;
  return (
    <div className="step-content">
      <SectionHeading
        icon={<Building2 size={20} />}
        eyebrow="Step 5"
        title="その他・高度設定"
        description="給与所得、消費税、個人事業税、納税資金を必要に応じて調整します。"
      />
      <details className="advanced-panel" open>
        <summary>他の所得</summary>
        <div className="form-grid two-columns">
          <MoneyField
            label="給与所得額（年間）"
            value={input.salaryIncome}
            onChange={(salaryIncome) => patch(onChange, input, { salaryIncome })}
            help="給与収入ではなく、源泉徴収票の『給与所得控除後の金額』など、給与所得額を入力します。"
          />
          <MoneyField
            label="その他所得（年間）"
            value={input.otherIncome}
            onChange={(otherIncome) => patch(onChange, input, { otherIncome })}
            help="総合課税となる所得の概算額です。株式・土地などの分離課税所得は対象外です。"
          />
        </div>
      </details>
      <details className="advanced-panel" open>
        <summary>個人事業税・住民税</summary>
        <div className="form-grid two-columns">
          <label className="field">
            <span className="field-label-row">個人事業税の対象・税率</span>
            <select
              value={input.businessTaxRate}
              onChange={(event) => patch(onChange, input, { businessTaxRate: Number(event.target.value) as SimulatorInput["businessTaxRate"] })}
            >
              <option value={0}>対象外・不明（0%）</option>
              <option value={0.03}>対象業種 3%</option>
              <option value={0.04}>対象業種 4%</option>
              <option value={0.05}>対象業種 5%</option>
            </select>
            <small className="field-caption">業種判定は行いません。都道府県の案内で確認してください。</small>
          </label>
          <Toggle
            label="住民税の均等割等を計上"
            description="標準4,000円＋森林環境税1,000円。非課税基準は自治体・世帯で異なります。"
            checked={input.residentPerCapitaTaxApplies}
            onChange={(residentPerCapitaTaxApplies) => patch(onChange, input, { residentPerCapitaTaxApplies })}
          />
        </div>
      </details>
      <details className="advanced-panel" open>
        <summary>消費税</summary>
        <div className="form-grid two-columns">
          <Toggle
            label="インボイス登録あり"
            description="適格請求書発行事業者の登録状況"
            checked={input.invoiceRegistered}
            onChange={(invoiceRegistered) => patch(onChange, input, { invoiceRegistered, taxableBecauseOfInvoice: invoiceRegistered ? input.taxableBecauseOfInvoice : false })}
          />
          {input.invoiceRegistered ? (
            <Toggle
              label="登録がなければ免税事業者だった"
              description="2割特例の主要要件を自己確認"
              checked={input.taxableBecauseOfInvoice}
              onChange={(taxableBecauseOfInvoice) => patch(onChange, input, { taxableBecauseOfInvoice })}
            />
          ) : null}
        </div>
        <SegmentedControl
          label="消費税の計算方式"
          value={input.consumptionTaxMethod}
          options={[
            { value: "exempt", label: "免税", description: "納付0円" },
            { value: "general", label: "原則課税", description: "課税仕入を入力" },
            { value: "simplified", label: "簡易課税", description: "みなし仕入率" },
            { value: "two-tenths", label: "2割特例", description: "2026年分まで", disabled: !twoTenthsEligible },
          ]}
          onChange={(consumptionTaxMethod) => patch(onChange, input, { consumptionTaxMethod })}
        />
        {!twoTenthsEligible ? <p className="field-warning">2割特例は「インボイス登録あり」かつ「登録がなければ免税」の自己確認後に選択できます。</p> : null}
        {input.consumptionTaxMethod === "general" ? (
          <MoneyField
            label="年間の課税仕入れ（税込・標準税率）"
            value={input.taxablePurchases}
            onChange={(taxablePurchases) => patch(onChange, input, { taxablePurchases })}
            help="仕入税額控除の対象となる課税仕入れだけを入力します。軽減税率や非課税取引がある場合は概算精度が下がります。"
          />
        ) : null}
        {input.consumptionTaxMethod === "simplified" ? (
          <label className="field">
            <span className="field-label-row">簡易課税の事業区分</span>
            <select
              value={input.simplifiedBusinessType}
              onChange={(event) => patch(onChange, input, { simplifiedBusinessType: Number(event.target.value) as SimulatorInput["simplifiedBusinessType"] })}
            >
              <option value={1}>第1種・卸売業（90%）</option>
              <option value={2}>第2種・小売業等（80%）</option>
              <option value={3}>第3種・製造業等（70%）</option>
              <option value={4}>第4種・その他（60%）</option>
              <option value={5}>第5種・サービス業等（50%）</option>
              <option value={6}>第6種・不動産業（40%）</option>
            </select>
            <small className="field-caption">複数区分の売上があるケースは対象外です。</small>
          </label>
        ) : null}
      </details>
      <details className="advanced-panel" open>
        <summary>納税資金・シナリオ</summary>
        <div className="form-grid two-columns">
          <MoneyField label="現在確保済みの資金" value={input.reservedFunds} onChange={(reservedFunds) => patch(onChange, input, { reservedFunds })} />
          <MoneyField label="追加経費シナリオ" value={input.scenarioExpenseIncrease} onChange={(scenarioExpenseIncrease) => patch(onChange, input, { scenarioExpenseIncrease })} />
          <MoneyField label="共済掛金シナリオ" value={input.scenarioMutualAid} onChange={(scenarioMutualAid) => patch(onChange, input, { scenarioMutualAid })} />
          <MoneyField label="iDeCo掛金シナリオ" value={input.scenarioIdeco} onChange={(scenarioIdeco) => patch(onChange, input, { scenarioIdeco })} />
        </div>
      </details>
      <div className="privacy-panel">
        <div><strong>この端末だけに保存</strong><p>入力値はブラウザのlocalStorageへ保存され、サーバーへ送信されません。</p></div>
        <button type="button" className="button button-danger-subtle" onClick={onClearStorage}>保存データを削除</button>
      </div>
    </div>
  );
}

interface StepProps {
  input: SimulatorInput;
  onChange: (input: SimulatorInput) => void;
}

function patch(
  onChange: (input: SimulatorInput) => void,
  input: SimulatorInput,
  updates: Partial<SimulatorInput>,
) {
  onChange({ ...input, ...updates });
}
