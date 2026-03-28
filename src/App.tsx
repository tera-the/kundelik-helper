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

type SorItem = {
  id: 1 | 2 | 3;
  label: string;
  enabled: boolean;
  score: string;
  maxScore: string;
};

const WEIGHTS = {
  FO: 0.25,
  SOR: 0.25,
  SOCH: 0.5,
} as const;

const GRADE_MIN_PERCENT: Record<number, number> = {
  2: 0,
  3: 45,
  4: 65,
  5: 85,
};

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parseNum(value: string): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toPercent(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return clamp((score / maxScore) * 100, 0, 100);
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

function percentToRaw(percent: number, maxScore: number): number {
  return (percent / 100) * maxScore;
}

function formatValue(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
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

function ExamRow({
  label,
  score,
  maxScore,
  setScore,
  setMaxScore,
}: ExamRowProps) {
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
  const [customFo, setCustomFo] = useState("");

  const [sor1, setSor1] = useState("");
  const [sor1Max, setSor1Max] = useState("");

  const [sor2, setSor2] = useState("");
  const [sor2Max, setSor2Max] = useState("");

  const [isSor3Available, setIsSor3Available] = useState(false);
  const [sor3, setSor3] = useState("");
  const [sor3Max, setSor3Max] = useState("");

  const [soch, setSoch] = useState("");
  const [sochMax, setSochMax] = useState("");

  const [targetGrade, setTargetGrade] = useState<3 | 4 | 5>(4);

  const addFo = (value: number): void => {
    const safeValue = clamp(Math.round(value), 1, 10);
    setFoList((prev) => [...prev, safeValue]);
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
    const targetPercent = GRADE_MIN_PERCENT[targetGrade];

    const foAverage10 = avg(foList);
    const foPercent = foAverage10 * 10;
    const hasFo = foList.length > 0;

    const sorItems: SorItem[] = [
      {
        id: 1,
        label: "СОР 1",
        enabled: true,
        score: sor1,
        maxScore: sor1Max,
      },
      {
        id: 2,
        label: "СОР 2",
        enabled: true,
        score: sor2,
        maxScore: sor2Max,
      },
      {
        id: 3,
        label: "СОР 3",
        enabled: isSor3Available,
        score: sor3,
        maxScore: sor3Max,
      },
    ];

    const activeSorItems = sorItems.filter((item) => item.enabled);

    const normalizedSorItems = activeSorItems.map((item) => {
      const rawScore = parseNum(item.score);
      const rawMax = Math.max(parseNum(item.maxScore), 1);
      const score = clamp(rawScore, 0, rawMax);
      const percent = toPercent(score, rawMax);
      const filled = item.score.trim() !== "";

      return {
        ...item,
        scoreNum: score,
        maxNum: rawMax,
        percent,
        filled,
      };
    });

    const filledSors = normalizedSorItems.filter((item) => item.filled);
    const emptySors = normalizedSorItems.filter((item) => !item.filled);

    const sorPercent =
      filledSors.length > 0 ? avg(filledSors.map((item) => item.percent)) : 0;

    const sochMaxNum = Math.max(parseNum(sochMax), 1);
    const sochScoreNum = clamp(parseNum(soch), 0, sochMaxNum);
    const sochPercent = soch.trim() !== "" ? toPercent(sochScoreNum, sochMaxNum) : 0;
    const hasSoch = soch.trim() !== "";

    const finalPercent =
      foPercent * WEIGHTS.FO +
      sorPercent * WEIGHTS.SOR +
      sochPercent * WEIGHTS.SOCH;

    const currentGrade = getQuarterGrade(finalPercent);

    const needTotalFromSor =
      (targetPercent - foPercent * WEIGHTS.FO - sochPercent * WEIGHTS.SOCH) /
      WEIGHTS.SOR;

    const needTotalFromSoch =
      (targetPercent - foPercent * WEIGHTS.FO - sorPercent * WEIGHTS.SOR) /
      WEIGHTS.SOCH;

    const needFoPercent =
      (targetPercent - sorPercent * WEIGHTS.SOR - sochPercent * WEIGHTS.SOCH) /
      WEIGHTS.FO;

    const needFoAverage10 = needFoPercent / 10;

    let neededRemainingSorAveragePercent: number | null = null;
    let neededRemainingSorRawList: { label: string; raw: number; max: number }[] = [];

    if (emptySors.length > 0) {
      const totalActiveSorCount = normalizedSorItems.length;
      const currentSorPercentSum = filledSors.reduce((sum, item) => sum + item.percent, 0);

      neededRemainingSorAveragePercent =
        (needTotalFromSor * totalActiveSorCount - currentSorPercentSum) /
        emptySors.length;

      neededRemainingSorRawList = emptySors.map((item) => ({
        label: item.label,
        raw: percentToRaw(neededRemainingSorAveragePercent ?? 0, item.maxNum),
        max: item.maxNum,
      }));
    }

    const neededSochRaw = percentToRaw(needTotalFromSoch, sochMaxNum);

    const canStillReachBySochOnly = !hasSoch && needTotalFromSoch <= 100;
    const impossibleBySochOnly = !hasSoch && needTotalFromSoch > 100;

    const canStillReachByRemainingSors =
      emptySors.length > 0 &&
      neededRemainingSorAveragePercent !== null &&
      neededRemainingSorAveragePercent <= 100;

    const impossibleByRemainingSors =
      emptySors.length > 0 &&
      neededRemainingSorAveragePercent !== null &&
      neededRemainingSorAveragePercent > 100;

    const hasAnyScores =
      hasFo || filledSors.length > 0 || hasSoch;

    const allInputsCompleted =
      hasFo &&
      emptySors.length === 0 &&
      hasSoch;

    const targetReached = finalPercent >= targetPercent;

    return {
      targetGrade,
      targetPercent,
      foPercent,
      foAverage10,
      sorPercent,
      sochPercent,
      finalPercent,
      currentGrade,
      hasFo,
      hasSoch,
      hasAnyScores,
      hasFilledSors: filledSors.length > 0,
      emptySorsCount: emptySors.length,
      filledSorsCount: filledSors.length,
      totalSorsCount: normalizedSorItems.length,
      neededRemainingSorAveragePercent,
      neededRemainingSorRawList,
      needTotalFromSoch,
      neededSochRaw,
      needFoAverage10,
      canStillReachBySochOnly,
      impossibleBySochOnly,
      canStillReachByRemainingSors,
      impossibleByRemainingSors,
      targetReached,
      allInputsCompleted,
    };
  }, [
    foList,
    sor1,
    sor1Max,
    sor2,
    sor2Max,
    sor3,
    sor3Max,
    isSor3Available,
    soch,
    sochMax,
    targetGrade,
  ]);

  const gradeButtons: Array<3 | 4 | 5> = [3, 4, 5];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50 p-4 md:p-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border-sky-100 shadow-xl shadow-sky-100/50">
          <CardContent className="p-6 md:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Прогноз четвертной оценки
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                ФО — 25%, СОР — 25%, СОЧ — 50%
              </p>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-sky-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-slate-700">ФО</label>
                  <span className="text-xs text-slate-400">
                    нажми на оценку, чтобы добавить
                  </span>
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
                </div>

                <div className="space-y-2">
                  <ExamRow
                    label="СОР 2"
                    score={sor2}
                    maxScore={sor2Max}
                    setScore={setSor2}
                    setMaxScore={setSor2Max}
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-3 rounded-xl bg-sky-50 px-3 py-3">
                  <input
                    id="sor3-toggle"
                    type="checkbox"
                    checked={isSor3Available}
                    onChange={() => setIsSor3Available((prev) => !prev)}
                    className="h-4 w-4 accent-sky-500"
                  />
                  <label
                    htmlFor="sor3-toggle"
                    className="cursor-pointer text-sm font-medium text-slate-700"
                  >
                    Есть СОР 3
                  </label>
                </div>

                {isSor3Available && (
                  <div className="md:col-span-2 space-y-2">
                    <ExamRow
                      label="СОР 3"
                      score={sor3}
                      maxScore={sor3Max}
                      setScore={setSor3}
                      setMaxScore={setSor3Max}
                    />
                  </div>
                )}
              </div>

              <div className="mb-10 space-y-2 rounded-2xl border border-sky-100 bg-white p-4">
                <ExamRow
                  label="СОЧ"
                  score={soch}
                  maxScore={sochMax}
                  setScore={setSoch}
                  setMaxScore={setSochMax}
                />
              </div>
            </div>

            <span className="flex justify-center text-md text-gray-300">
              © 2026. Все права защищены.
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-sky-100 shadow-xl shadow-sky-100/50">
          <CardContent className="p-6 md:p-8">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Результат</h2>

            <div className="mb-6 rounded-2xl bg-sky-50 p-4">
              <p className="text-sm text-slate-500">Цель</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {gradeButtons.map((grade) => (
                  <Button
                    key={grade}
                    type="button"
                    variant={targetGrade === grade ? "default" : "outline"}
                    onClick={() => setTargetGrade(grade)}
                    className={
                      targetGrade === grade
                        ? "rounded-xl bg-sky-400 text-white hover:bg-sky-500"
                        : "rounded-xl border-sky-200 text-sky-700 hover:bg-sky-100"
                    }
                  >
                    Хочу {grade}
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Минимум для оценки {targetGrade}:{" "}
                <span className="font-semibold text-sky-700">
                  {data.targetPercent}%
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-100 p-4">
                <p className="text-sm text-slate-500">Текущий итог</p>
                <p className={`mt-1 text-4xl font-bold ${getStatusColor(data.finalPercent)}`}>
                  {formatValue(data.finalPercent)}%
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Прогнозируемая оценка сейчас: {data.currentGrade}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-sky-100">
                  <p className="text-sm text-slate-500">ФО</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatValue(data.foPercent)}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-sky-100">
                  <p className="text-sm text-slate-500">СОР</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatValue(data.sorPercent)}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-sky-100">
                  <p className="text-sm text-slate-500">СОЧ</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatValue(data.sochPercent)}%
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                {!data.hasAnyScores ? (
                  <>
                    <p className="text-sm font-medium text-slate-800">
                      Что нужно с нуля для оценки {data.targetGrade}
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>
                        Средний ФО нужен около{" "}
                        <span className="font-semibold text-sky-700">
                          {formatValue(clamp(data.needFoAverage10, 0, 10))} / 10
                        </span>
                      </p>
                      <p>
                        Средний СОР нужен около{" "}
                        <span className="font-semibold text-sky-700">
                          {data.targetPercent}%
                        </span>
                      </p>
                      <p>
                        СОЧ нужен около{" "}
                        <span className="font-semibold text-sky-700">
                          {formatValue(clamp(data.neededSochRaw, 0, parseNum(sochMax) || 30))} /{" "}
                          {parseNum(sochMax) || 30}
                        </span>
                      </p>
                    </div>
                  </>
                ) : data.targetReached ? (
                  <>
                    <p className="text-sm font-medium text-emerald-600">
                      Цель уже достигается
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      По текущим данным у тебя уже выходит минимум на{" "}
                      <span className="font-semibold">{data.targetGrade}</span>
                    </p>
                  </>
                ) : data.allInputsCompleted ? (
                  <>
                    <p className="text-sm font-medium text-red-600">
                      Сейчас цель не достигнута
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Все основные данные уже заполнены. При таких результатах
                      оценка {data.targetGrade} не выходит.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-800">
                      Что нужно, чтобы выйти на {data.targetGrade}
                    </p>

                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      {!data.hasFo && (
                        <p>
                          Средний ФО нужен около{" "}
                          <span className="font-semibold text-sky-700">
                            {formatValue(clamp(data.needFoAverage10, 0, 10))} / 10
                          </span>
                        </p>
                      )}

                      {data.emptySorsCount > 0 &&
                        data.neededRemainingSorAveragePercent !== null &&
                        data.canStillReachByRemainingSors && (
                          <>
                            <p>
                              На оставшиеся СОР нужен средний результат около{" "}
                              <span className="font-semibold text-sky-700">
                                {formatValue(
                                  clamp(data.neededRemainingSorAveragePercent, 0, 100)
                                )}
                                %
                              </span>
                            </p>

                            {data.neededRemainingSorRawList.map((item) => (
                              <p key={item.label}>
                                {item.label}: примерно{" "}
                                <span className="font-semibold text-sky-700">
                                  {formatValue(clamp(item.raw, 0, item.max))} / {item.max}
                                </span>
                              </p>
                            ))}
                          </>
                        )}

                      {data.emptySorsCount > 0 &&
                        data.neededRemainingSorAveragePercent !== null &&
                        data.impossibleByRemainingSors && (
                          <p className="text-red-600">
                            Даже если добрать только СОР, для цели нужно больше 100%,
                            значит одной только оставшейся СОР части уже недостаточно.
                          </p>
                        )}

                      {!data.hasSoch && data.canStillReachBySochOnly && (
                        <p>
                          На СОЧ нужно примерно{" "}
                          <span className="font-semibold text-sky-700">
                            {formatValue(
                              clamp(data.neededSochRaw, 0, parseNum(sochMax) || 30)
                            )}{" "}
                            / {parseNum(sochMax) || 30}
                          </span>
                        </p>
                      )}

                      {!data.hasSoch && data.impossibleBySochOnly && (
                        <p className="text-red-600">
                          Одним только СОЧ цель уже не закрыть — там нужно больше 100%.
                        </p>
                      )}

                      <p>
                        Текущий безопасный прогноз:{" "}
                        <span className="font-semibold text-sky-700">
                          {formatValue(data.finalPercent)}% → оценка {data.currentGrade}
                        </span>
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