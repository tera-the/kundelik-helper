import { useMemo, useState, type JSX } from "react";
import { Card, CardContent } from "../@/components/ui/card";
import { Input } from "../@/components/ui/input";
import { Button } from "../@/components/ui/button";
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

function getNeededFoAverage(target: number, sorPercent: number, sochPercent: number): number {
  return (target - sorPercent * 0.25 - sochPercent * 0.5) / 0.25 / 10;
}

function getNeededSorAverage(target: number, foPercent: number, sochPercent: number): number {
  return (target - foPercent * 0.25 - sochPercent * 0.5) / 0.25;
}

function getNeededSochPercent(target: number, foPercent: number, sorPercent: number): number {
  return (target - foPercent * 0.25 - sorPercent * 0.25) / 0.5;
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
        <span className="text-xs text-slate-400">баллы / максимум</span>
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
  const [foList, setFoList] = useState<number[]>([]);
  const [customFo, setCustomFo] = useState<string>("");

  const [sor1, setSor1] = useState<string>("");
  const [sor1Max, setSor1Max] = useState<string>("20");
  const [sor2, setSor2] = useState<string>("");
  const [sor2Max, setSor2Max] = useState<string>("20");
  const [soch, setSoch] = useState<string>("");
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
    const sorPercents = [sor1Percent, sor2Percent].filter((x) => x > 0);
    const sorPercent = avg(sorPercents);
    const sochPercent = toPercent(Number(soch), sochMaxNum);

    const hasFo = foList.length > 0;
    const hasSor1 = Number(sor1) > 0;
    const hasSor2 = Number(sor2) > 0;
    const hasSor = hasSor1 || hasSor2;
    const hasBothSors = hasSor1 && hasSor2;
    const hasSoch = Number(soch) > 0;
    const hasAnyScores = hasFo || hasSor || hasSoch;

    const finalPercent = foPercent * 0.25 + sorPercent * 0.25 + sochPercent * 0.5;
    const diff = target - finalPercent;

    const neededSochPercent = getNeededSochPercent(target, foPercent, sorPercent);
    const neededSochRaw = formatExamNeeded(neededSochPercent, sochMaxNum);

    const neededSorPercent = getNeededSorAverage(target, foPercent, sochPercent);
    const neededSor1Raw = formatExamNeeded(neededSorPercent, sor1MaxNum);
    const neededSor2Raw = formatExamNeeded(neededSorPercent, sor2MaxNum);

    const neededFoAverage = getNeededFoAverage(target, sorPercent, sochPercent);

    return {
      foPercent,
      sorPercent,
      sochPercent,
      finalPercent,
      diff,
      grade: getQuarterGrade(finalPercent),
      hasAnyScores,
      hasFo,
      hasSor1,
      hasSor2,
      hasSoch,
      hasSor,
      hasBothSors,
      sor1MaxNum,
      sor2MaxNum,
      sochMaxNum,
      neededSochPercent,
      neededSochRaw,
      neededSorPercent,
      neededSor1Raw,
      neededSor2Raw,
      neededFoAverage,
    };
  }, [foList, sor1, sor1Max, sor2, sor2Max, soch, sochMax, target]);

  const targetButtons: number[] = [50, 75, 90];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50 p-4 md:p-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border-sky-100 shadow-xl shadow-sky-100/50">
          <CardContent className="p-6 md:p-8">
            <div className="mb-6">
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
                <div className="space-y-2">
                  <ExamRow
                    label="СОР 1"
                    score={sor1}
                    maxScore={sor1Max}
                    setScore={setSor1}
                    setMaxScore={setSor1Max}
                  />
                  {data.hasFo && !data.hasSor1 && !data.hasSoch && (
                    <p className="text-xs text-sky-700">
                      С твоими ФО для цели {target}% СОР 1 нужен примерно <span className="font-semibold">{clamp(data.neededSor1Raw, 0, data.sor1MaxNum).toFixed(1)} / {data.sor1MaxNum}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <ExamRow
                    label="СОР 2"
                    score={sor2}
                    maxScore={sor2Max}
                    setScore={setSor2}
                    setMaxScore={setSor2Max}
                  />
                  {data.hasFo && !data.hasSor2 && !data.hasSoch && (
                    <p className="text-xs text-sky-700">
                      Примерно столько же: <span className="font-semibold">{clamp(data.neededSor2Raw, 0, data.sor2MaxNum).toFixed(1)} / {data.sor2MaxNum}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-white p-4 space-y-2 mb-10">
                <ExamRow
                  label="СОЧ"
                  score={soch}
                  maxScore={sochMax}
                  setScore={setSoch}
                  setMaxScore={setSochMax}
                />
                {data.hasFo && data.hasBothSors && !data.hasSoch && (
                  <p className="text-xs text-sky-700">
                    С текущими ФО и СОР для цели {target}% нужен СОЧ примерно <span className="font-semibold">{clamp(data.neededSochRaw, 0, data.sochMaxNum).toFixed(1)} / {data.sochMaxNum}</span>
                  </p>
                )}
              </div>
            </div>
            
            <span className="text-md text-gray-300 flex justify-center">© 2026. Все права защищены.</span>
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
                {!data.hasAnyScores ? (
                  <>
                    <p className="text-sm font-medium text-slate-800">Что нужно для этой цели с нуля</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>
                        Нужен средний <span className="font-semibold text-sky-700">ФО около {clamp(data.neededFoAverage, 0, 10).toFixed(1)} / 10</span>
                      </p>
                      <p>
                        СОР 1 примерно <span className="font-semibold text-sky-700">{clamp(data.neededSor1Raw, 0, data.sor1MaxNum).toFixed(1)} / {data.sor1MaxNum}</span>
                      </p>
                      <p>
                        СОР 2 примерно <span className="font-semibold text-sky-700">{clamp(data.neededSor2Raw, 0, data.sor2MaxNum).toFixed(1)} / {data.sor2MaxNum}</span>
                      </p>
                      <p>
                        СОЧ примерно <span className="font-semibold text-sky-700">{clamp(data.neededSochRaw, 0, data.sochMaxNum).toFixed(1)} / {data.sochMaxNum}</span>
                      </p>
                    </div>
                  </>
                ) : data.diff <= 0 ? (
                  <>
                    <p className="text-sm font-medium text-emerald-600">Цель уже достигнута</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Ты уже выше цели на <span className="font-semibold">{Math.abs(data.diff).toFixed(1)}%</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-800">Что нужно, чтобы дойти до цели</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      {!data.hasFo && (
                        <p>
                          По текущим СОР и СОЧ нужен средний <span className="font-semibold text-sky-700">ФО около {clamp(data.neededFoAverage, 0, 10).toFixed(1)} / 10</span>
                        </p>
                      )}

                      {data.hasFo && !data.hasBothSors && (
                        <>
                          <p>
                            СОР 1 нужен примерно <span className="font-semibold text-sky-700">{clamp(data.neededSor1Raw, 0, data.sor1MaxNum).toFixed(1)} / {data.sor1MaxNum}</span>
                          </p>
                          <p>
                            СОР 2 нужен примерно <span className="font-semibold text-sky-700">{clamp(data.neededSor2Raw, 0, data.sor2MaxNum).toFixed(1)} / {data.sor2MaxNum}</span>
                          </p>
                        </>
                      )}

                      {data.hasFo &&
                        <p>
                          СОЧ нужен примерно <span className="font-semibold text-sky-700">{clamp(data.neededSochRaw, 0, data.sochMaxNum).toFixed(1)} / {data.sochMaxNum}</span>
                        </p>
                      }

                      {data.hasFo && data.hasSor && data.hasSoch && (
                        <p>
                          Сейчас до цели не хватает <span className="font-semibold text-sky-700">{data.diff.toFixed(1)}%</span>
                        </p>
                      )}
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
