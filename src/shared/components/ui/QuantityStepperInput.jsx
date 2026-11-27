import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { FoodIcon } from "@/shared/components/ui/FoodIcon";
import { getOptimizedImageUrl } from "@/shared/utils/imageUtils";
import { resolveValidAdicionImage } from "@/shared/utils/adicionUtils";

/**
 * Miniatura consistente de adición/topping con respaldo vectorial limpio
 * para que jamás aparezcan íconos de imagen rota.
 */
export function AdicionAvatar({ adicion, size = "md" }) {
  const [imgError, setImgError] = useState(false);
  const validUrl = resolveValidAdicionImage(adicion);

  useEffect(() => {
    setImgError(false);
  }, [validUrl, adicion?.idAdicion, adicion?.id]);

  const dims =
    size === "sm"
      ? "w-9 h-9 rounded-lg"
      : size === "lg"
        ? "w-12 h-12 rounded-xl"
        : "w-11 h-11 rounded-xl";
  const px = size === "sm" ? 36 : size === "lg" ? 48 : 44;
  const iconPx = size === "sm" ? 16 : size === "lg" ? 22 : 20;

  if (!validUrl || imgError) {
    const raw = String(adicion?.nombre || "").toLowerCase();
    const isSauce =
      /\b(salsa|mostaza|mayonesa|suero|guacamole|tartara|tártara|bbq|heinz|rosada|aderezo)\b/.test(raw);
    const tone = isSauce
      ? "bg-amber-50 dark:bg-amber-950/45 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60"
      : "bg-red-50/80 dark:bg-red-950/40 text-[#D9383A] dark:text-red-300 border-red-200/75 dark:border-red-900/50";

    return (
      <div className={`${dims} shrink-0 border flex items-center justify-center ${tone}`}>
        <FoodIcon name={adicion?.imagen || adicion?.nombre || "sauce"} size={iconPx} stroke={1.85} />
      </div>
    );
  }

  return (
    <img
      src={getOptimizedImageUrl(validUrl, 120)}
      alt={adicion?.nombre || "Adición"}
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      onError={() => setImgError(true)}
      className={`${dims} object-cover shrink-0 border border-slate-200/80 dark:border-gray-700 bg-slate-100 dark:bg-gray-800`}
    />
  );
}

/**
 * Control numérico editable `[- [input] +]` con validación de stock máximo en tiempo real.
 * Permite tanto pulsar `-` / `+` como escribir directamente la cantidad deseada.
 */
export function QuantityStepperInput({
  value = 1,
  min = 1,
  max = 999,
  allowZeroRemove = false,
  onChange,
  onRemove,
  onMaxReached,
  size = "sm",
  ariaLabel = "Cantidad",
  className = ""
}) {
  const safeVal = Math.max(allowZeroRemove ? 0 : min, Math.floor(Number(value) || 1));
  const safeMax = Math.max(allowZeroRemove ? 0 : min, Math.floor(Number(max ?? 999)));

  const [draft, setDraft] = useState(String(safeVal));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraft(String(safeVal));
    }
  }, [safeVal, isFocused]);

  const stopBubble = (e) => {
    e.stopPropagation();
  };

  const commitNumericValue = (num) => {
    if (num <= 0) {
      if (allowZeroRemove) {
        if (typeof onRemove === "function") onRemove();
        else onChange?.(0);
        return;
      }
      const clampedMin = Math.max(1, min);
      setDraft(String(clampedMin));
      if (clampedMin !== safeVal) onChange?.(clampedMin);
      return;
    }

    if (num > safeMax) {
      onMaxReached?.(safeMax);
      setDraft(String(safeMax));
      if (safeMax !== safeVal) onChange?.(safeMax);
      return;
    }

    setDraft(String(num));
    if (num !== safeVal) onChange?.(num);
  };

  const handleInputChange = (e) => {
    e.stopPropagation();
    const digits = e.target.value.replace(/\D/g, "");
    if (digits === "") {
      setDraft("");
      return;
    }
    const parsed = parseInt(digits, 10);
    if (Number.isNaN(parsed)) return;

    if (parsed === 0) {
      setDraft("0");
      return;
    }

    if (parsed > safeMax) {
      onMaxReached?.(safeMax);
      setDraft(String(safeMax));
      if (safeMax !== safeVal) onChange?.(safeMax);
      return;
    }

    setDraft(String(parsed));
    if (parsed !== safeVal) onChange?.(parsed);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (draft === "") {
      setDraft(String(safeVal));
      return;
    }
    const parsed = parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(safeVal));
      return;
    }
    commitNumericValue(parsed);
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDraft(String(safeVal));
      setIsFocused(false);
      e.currentTarget.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (safeVal < safeMax) commitNumericValue(safeVal + 1);
      else onMaxReached?.(safeMax);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      commitNumericValue(safeVal - 1);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    const next = safeVal - 1;
    commitNumericValue(next);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (safeVal >= safeMax) {
      onMaxReached?.(safeMax);
      return;
    }
    commitNumericValue(safeVal + 1);
  };

  const btnCls =
    size === "md"
      ? "w-8 h-8 sm:w-9 sm:h-9 rounded-lg"
      : "w-7 h-7 rounded-lg";
  const iconCls = size === "md" ? "w-4 h-4 stroke-[2.75]" : "w-3.5 h-3.5 stroke-[2.75]";
  const inputCls =
    size === "md"
      ? "w-10 h-8 sm:h-9 text-sm"
      : "w-9 h-7 text-xs";

  const minusDisabled = !allowZeroRemove && safeVal <= min;
  const plusDisabled = safeVal >= safeMax;

  return (
    <div
      onClick={stopBubble}
      className={`inline-flex items-center gap-1 bg-slate-100 dark:bg-gray-800 p-1 rounded-xl border border-slate-200/85 dark:border-gray-700 shrink-0 ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={minusDisabled}
        aria-label={`Disminuir ${ariaLabel}`}
        className={`${btnCls} bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-100 hover:bg-red-50 hover:text-[#D9383A] dark:hover:bg-gray-600 disabled:opacity-35 disabled:pointer-events-none flex items-center justify-center transition cursor-pointer active:scale-95 shadow-2xs`}
      >
        <Minus className={iconCls} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={ariaLabel}
        value={isFocused ? draft : String(safeVal)}
        onFocus={(e) => {
          e.stopPropagation();
          setIsFocused(true);
          setDraft(String(safeVal));
          e.target.select();
        }}
        onClick={stopBubble}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${inputCls} rounded-md bg-white/80 dark:bg-gray-900/70 focus:bg-white dark:focus:bg-gray-900 border border-transparent focus:border-[#D9383A] text-center font-black text-slate-900 dark:text-white tabular-nums outline-none transition`}
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={plusDisabled}
        aria-label={`Aumentar ${ariaLabel}`}
        className={`${btnCls} bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-100 hover:bg-red-50 hover:text-[#D9383A] dark:hover:bg-gray-600 disabled:opacity-35 disabled:pointer-events-none flex items-center justify-center transition cursor-pointer active:scale-95 shadow-2xs`}
      >
        <Plus className={iconCls} />
      </button>
    </div>
  );
}

export default QuantityStepperInput;
