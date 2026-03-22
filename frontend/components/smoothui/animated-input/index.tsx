import { motion, useReducedMotion } from "motion/react";
import { useRef, useState, useId } from "react";

const EASE_IN_OUT_CUBIC_X1 = 0.4;
const EASE_IN_OUT_CUBIC_Y1 = 0;
const EASE_IN_OUT_CUBIC_X2 = 0.2;
const EASE_IN_OUT_CUBIC_Y2 = 1;

const LABEL_TRANSITION = {
  duration: 0.28,
  ease: [
    EASE_IN_OUT_CUBIC_X1,
    EASE_IN_OUT_CUBIC_Y1,
    EASE_IN_OUT_CUBIC_X2,
    EASE_IN_OUT_CUBIC_Y2,
  ] as [number, number, number, number],
};

export interface AnimatedInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  icon?: React.ReactNode;
  type?: string;
}

export default function AnimatedInput({
  value,
  defaultValue = "",
  onChange,
  label,
  placeholder = "",
  disabled = false,
  className = "",
  inputClassName = "",
  labelClassName = "",
  icon,
  type = "text",
}: AnimatedInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const val = isControlled ? value : internalValue;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = !!val || isFocused;
  const shouldReduceMotion = useReducedMotion();
  const inputId = useId();

  const getLabelAnimation = () => {
    if (shouldReduceMotion) return {};
    if (isFloating) {
      return {
        y: -24,
        scale: 0.85,
        color: "rgba(255,255,255,0.6)",
      };
    }
    return { y: 0, scale: 1, color: "rgba(255,255,255,0.4)" };
  };

  const getLabelStyle = () => {
    if (!shouldReduceMotion) return {};
    if (isFloating) {
      return {
        transform: "translateY(-24px) scale(0.85)",
        color: "rgba(255,255,255,0.6)",
      };
    }
    return {
      transform: "translateY(0) scale(1)",
      color: "rgba(255,255,255,0.4)",
    };
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      {icon && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-3 -translate-y-1/2"
        >
          {icon}
        </span>
      )}
      <input
        aria-label={label}
        className={`peer w-full rounded-sm border bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          icon ? "pl-10" : ""
        } ${inputClassName}`}
        disabled={disabled}
        id={inputId}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => {
          if (!isControlled) {
            setInternalValue(e.target.value);
          }
          onChange?.(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        placeholder={isFloating ? placeholder : ""}
        ref={inputRef}
        type={type}
        value={val}
      />
      <motion.label
        animate={getLabelAnimation()}
        className={`pointer-events-none absolute top-1/2 ${icon ? "left-10" : "left-3"} origin-left -translate-y-1/2 rounded-sm border border-transparent px-1 transition-all ${labelClassName}`}
        htmlFor={inputId}
        style={{
          zIndex: 2,
          background: isFloating
            ? "linear-gradient(180deg, transparent 45%, #050810 45%)"
            : "transparent",
          ...getLabelStyle(),
        }}
        transition={shouldReduceMotion ? { duration: 0 } : LABEL_TRANSITION}
      >
        {label}
      </motion.label>
    </div>
  );
}
