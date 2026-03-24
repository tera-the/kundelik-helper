import { useMemo, useState, type JSX } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type FoChipProps = {
  value: number;
  onRemove: () => void;
};

type ExamRowProps = {
  label: string;
  score: string;
  maxScore: string;
  setScore: (value: string) => void;
  setMaxScore: (value: string) => void;
};

type PredictionPlan = {
  foCount: number;
  foAverage: number;
  sor1Needed: number;
  sor2Needed: number;
  sochNeeded: number;
  reachable: boolean;
};

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function toPercent(score: number, maxScore: number): number {
  if (!maxScore || maxScore <= 0) return 0;
  return (score / maxScore) * 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getQuarterGrade(percent: number): number {
  if (percent >= 90) return 5;
  if (percent >= 75) return 4;
  if (percent >= 50) return 3;
  return 2;
}

function getStatusColor(percent: number): string {
  if (percent >= 90) return "text-emerald-600";
  if (percent >= 75) return "text-amber-500";
  if (percent >= 50) return "text-orange-500";
  return "text-red-500";
}

function formatExamNeeded(percent: number, maxScore: number): number {
  return (percent / 100) * maxScore;
}

function buildPlan(target: number, sor1Max: number, sor2Max: number, sochMax: number): PredictionPlan {
  const presets = [
    { foCount: 8, foAverage: 8 },
    { foCount: 10, foAverage: 8 },
    { foCount: 10, foAverage: 9 },
    { foCount: 12, foAverage: 8 },
    { foCount: 12, foAverage: 9 },
    { foCount: 14, foAverage: 9 },
    { foCount: 14, foAverage: 10 },
  ];

  for (const preset of presets) {
    const foPercent = preset.foAverage * 10;
    const remaining = target - foPercent * 0.25;
    const neededExamPercent = remaining / 0.75;

    if (neededExamPercent <= 100) {
      return {
        foCount: preset.foCount,
        foAverage: preset.foAverage,
        sor1Needed: clamp(formatExamNeeded(neededExamPercent, sor1Max), 0, sor1Max),
        sor2Needed: clamp(formatExamNeeded(neededExamPercent, sor2Max), 0, sor2Max),
        sochNeeded: clamp(formatExamNeeded(neededExamPercent, sochMax), 0, sochMax),
        reachable: true,
      };
    }
  }

  return {
    foCount: 14,
    foAverage: 10,
    sor1Needed: sor1Max,
    sor2Needed: sor2Max,
    sochNeeded: sochMax,
    reachable: false,
  };
}

function FoChip({ value, onRemove }: FoChipProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700">
      <span>{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 text-sky-500 transition hover:bg-sky-100 hover:text-sky-700"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ExamRow({ label, score, maxScore, setScore, setMaxScore }: ExamRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-xs text-slate-400">в формате баллы / максимум</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
        <Input
          type="number"
          min="0"
          placeholder="баллы"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="border-sky-100 focus-visible:ring-sky-300"
        />
        <div className="flex items-center justify-center text-slate-400">/</div>
        <Input
          type="number"
          min="1"
          placeholder="макс"
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
          className="border-sky-100 focus-visible:ring-sky-300"
        />
      </div>
    </div>
  );
}

export default function GradePredictor(): JSX.Element {
  const [foList, setFoList] = useState<number[]>([8, 6, 8, 10, 9, 9, 9, 9, 8, 9, 9, 8]);
  const [customFo, setCustomFo] = useState<string>("");

  const [sor1, setSor1] = useState<string>("18");
  const [sor1Max, setSor1Max] = useState<string>("20");
  const [sor2, setSor2] = useState<string>("20");
  const [sor2Max, setSor2Max] = useState<string>("20");
  const [soch, setSoch] = useState<string>("22");
  const [sochMax, setSochMax] = useState<string>("24");

  const [target, setTarget] = useState<number>(90);

  const addFo = (value: number): void => {
    if (value < 1 || value > 10) return;
    setFoList((prev) => [...prev, value]);
  };

  const removeFo = (index: number): void => {
    setFoList((prev) => prev.filter((_, i) => i !== index));
  };

  const addCustomFo = (): void => {
    const value = Number(customFo);
    if (!Number.isNaN(value) && value >= 1 && value <= 10) {
      addFo(value);
      setCustomFo("");
    }
  };

  const data = useMemo(() => {
    const sor1MaxNum = Number(sor1Max) || 20;
    const sor2MaxNum = Number(sor2Max) || 20;
    const sochMaxNum = Number(sochMax) || 24;

    const foPercent = avg(foList) * 10;
    const sor1Percent = toPercent(Number(sor1), sor1MaxNum);
    const sor2Percent = toPercent(Number(sor2), sor2MaxNum);
    const sorPercent = avg([sor1Percent, sor2Percent].filter((x) => x > 0));
    const sochPercent = toPercent(Number(soch), sochMaxNum);

    const hasFo = foList.length > 0;
    const hasSor = Number(sor1) > 0 || Number(sor2) > 0;
    const hasSoch = Number(soch) > 0;
    const hasAnyScores = hasFo || hasSor || hasSoch;
    const allZero = !hasAnyScores;

    const finalPercent = foPercent * 0.25 + sorPercent * 0.25 + sochPercent * 0.5;
    const diff = target - finalPercent;

    const requiredSochPercent = (target - foPercent * 0.25 - sorPercent * 0.25) / 0.5;
    const neededRawSoch = formatExamNeeded(requiredSochPercent, sochMaxNum);

    const zeroPlan = buildPlan(target, sor1MaxNum, sor2MaxNum, sochMaxNum);

    return {
      foPercent,
      sorPercent,
      sochPercent,
      finalPercent,
      diff,
      allZero,
      grade: getQuarterGrade(finalPercent),
      requiredSochPercent,
      neededRawSoch,
      sor1MaxNum,
      sor2MaxNum,
      sochMaxNum,
      zeroPlan,
    };
  }, [foList, sor1, sor1Max, sor2, sor2Max, soch, sochMax, target]);

  const targetButtons: number[] = [50, 75, 90];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50 p-4 md:p-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border-sky-100 shadow-xl shadow-sky-100/50">
          <CardContent className="p-6 md:p-8">
            <div className="mb-6">
              <div className="mb-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                Kundelik helper
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Прогноз четвертной оценки
              </h1>
              <p className="mt-2 text-sm text-slate-500">ФО — 25%, СОР — 25%, СОЧ — 50%</p>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-sky-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-slate-700">ФО</label>
                  <span className="text-xs text-slate-400">нажми на оценку, чтобы добавить</span>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant="outline"
                      onClick={() => addFo(value)}
                      className="h-9 rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                    >
                      {value}
                    </Button>
                  ))}
                </div>

                <div className="mb-4 flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={customFo}
                    onChange={(e) => setCustomFo(e.target.value)}
                    placeholder="Добавить вручную"
                    className="border-sky-100 focus-visible:ring-sky-300"
                  />
                  <Button
                    type="button"
                    onClick={addCustomFo}
                    className="rounded-xl bg-sky-400 text-white hover:bg-sky-500"
                  >
                    Добавить
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {foList.length > 0 ? (
                    foList.map((value, index) => (
                      <FoChip
                        key={`${value}-${index}`}
                        value={value}
                        onRemove={() => removeFo(index)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Пока нет оценок ФО</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border border-sky-100 bg-white p-4 md:grid-cols-2">
                <ExamRow
                  label="СОР 1"
                  score={sor1}
                  maxScore={sor1Max}
                  setScore={setSor1}
                  setMaxScore={setSor1Max}
                />
                <ExamRow
                  label="СОР 2"
                  score={sor2}
                  maxScore={sor2Max}
                  setScore={setSor2}
                  setMaxScore={setSor2Max}
                />
              </div>

              <div className="rounded-2xl border border-sky-100 bg-white p-4">
                <ExamRow
                  label="СОЧ"
                  score={soch}
                  maxScore={sochMax}
                  setScore={setSoch}
                  setMaxScore={setSochMax}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-sky-100 shadow-xl shadow-sky-100/50">
          <CardContent className="p-6 md:p-8">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Результат</h2>

            <div className="mb-6 rounded-2xl bg-sky-50 p-4">
              <p className="text-sm text-slate-500">Цель</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {targetButtons.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={target === value ? "default" : "outline"}
                    onClick={() => setTarget(value)}
                    className={
                      target === value
                        ? "rounded-xl bg-sky-400 text-white hover:bg-sky-500"
                        : "rounded-xl border-sky-200 text-sky-700 hover:bg-sky-100"
                    }
                  >
                    {value}%
                  </Button>
                ))}
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={target}
                  onChange={(e) => setTarget(clamp(Number(e.target.value) || 0, 0, 100))}
                  className="h-10 w-24 border-sky-100 bg-white focus-visible:ring-sky-300"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-100 p-4">
                <p className="text-sm text-slate-500">Текущий итог</p>
                <p className={`mt-1 text-4xl font-bold ${getStatusColor(data.finalPercent)}`}>
                  {data.finalPercent.toFixed(1)}%
                </p>
                <p className="mt-2 text-sm text-slate-600">Оценка за четверть: {data.grade}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-sky-100">
                  <p className="text-sm text-slate-500">ФО</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{data.foPercent.toFixed(1)}%</p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-sky-100">
                  <p className="text-sm text-slate-500">СОР</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{data.sorPercent.toFixed(1)}%</p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-sky-100">
                  <p className="text-sm text-slate-500">СОЧ</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{data.sochPercent.toFixed(1)}%</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                {data.allZero ? (
                  data.zeroPlan.reachable ? (
                    <>
                      <p className="text-sm font-medium text-slate-800">Примерный план, чтобы выйти на цель</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p>
                          Возьми примерно <span className="font-semibold text-sky-700">{data.zeroPlan.foCount} ФО</span> со средним около{' '}
                          <span className="font-semibold text-sky-700">{data.zeroPlan.foAverage.toFixed(1)} / 10</span>
                        </p>
                        <p>
                          За <span className="font-semibold text-sky-700">СОР 1</span> нужно примерно{' '}
                          <span className="font-semibold text-sky-700">{data.zeroPlan.sor1Needed.toFixed(1)} / {data.sor1MaxNum}</span>
                        </p>
                        <p>
                          За <span className="font-semibold text-sky-700">СОР 2</span> нужно примерно{' '}
                          <span className="font-semibold text-sky-700">{data.zeroPlan.sor2Needed.toFixed(1)} / {data.sor2MaxNum}</span>
                        </p>
                        <p>
                          За <span className="font-semibold text-sky-700">СОЧ</span> нужно примерно{' '}
                          <span className="font-semibold text-sky-700">{data.zeroPlan.sochNeeded.toFixed(1)} / {data.sochMaxNum}</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-red-500">Цель слишком высокая для реалистичного плана</p>
                      <p className="mt-2 text-sm text-slate-600">
                        Даже при почти идеальных ФО, СОР и СОЧ выйти на {target}% очень тяжело.
                      </p>
                    </>
                  )
                ) : data.diff <= 0 ? (
                  <>
                    <p className="text-sm font-medium text-emerald-600">Цель уже достигнута</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Ты уже выше цели на <span className="font-semibold">{Math.abs(data.diff).toFixed(1)}%</span>
                    </p>
                  </>
                ) : data.requiredSochPercent > 100 ? (
                  <>
                    <p className="text-sm font-medium text-red-500">До этой цели дойти уже нельзя</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Даже если взять максимум за СОЧ, итог будет ниже {target}%
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-800">Что нужно, чтобы дойти до цели</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>
                        Нужен <span className="font-semibold text-sky-700">СОЧ</span> примерно{' '}
                        <span className="font-semibold text-sky-700">{clamp(data.neededRawSoch, 0, data.sochMaxNum).toFixed(1)} / {data.sochMaxNum}</span>
                      </p>
                      <p className="text-slate-500">
                        Это около {clamp(data.requiredSochPercent, 0, 100).toFixed(1)}% за СОЧ
                      </p>
                      <p className="text-slate-500">
                        Сейчас до цели не хватает {data.diff.toFixed(1)}%
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
