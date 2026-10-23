"use client";
import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import type { Matcher } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fieldClass } from "@/components/forms/FormParts";

interface DatePickerFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  invalid?: boolean;
  disableSundays?: boolean;
  minDate?: string;
  maxDate?: string;
  clearable?: boolean;
  clearLabel?: string;
  disabled?: boolean;
}

export const toYmd = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const fromYmd = (value: string): Date | undefined => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatLabel = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const DatePickerField = ({
  id,
  value,
  onChange,
  placeholder,
  invalid = false,
  disableSundays = false,
  minDate,
  maxDate,
  clearable = false,
  clearLabel = "Clear date",
  disabled = false,
}: DatePickerFieldProps) => {
  const [open, setOpen] = useState(false);
  const selected = fromYmd(value);
  const min = minDate ? fromYmd(minDate) : undefined;
  const max = maxDate ? fromYmd(maxDate) : undefined;

  const disabledDays: Matcher[] = [
    ...(disableSundays ? [{ dayOfWeek: [0] }] : []),
    ...(min ? [{ before: min }] : []),
    ...(max ? [{ after: max }] : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid}
            className={`${fieldClass(invalid)} w-full justify-start gap-2 pr-9 text-left font-manrope text-sm font-normal shadow-none hover:bg-card dark:hover:bg-card ${
              selected ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selected ? formatLabel(selected) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        {clearable && selected && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={clearLabel}
            className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent
        align="start"
        className="w-auto rounded-xl border-border p-0"
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? max ?? min}
          onSelect={(date) => {
            if (!date) return;
            onChange(toYmd(date));
            setOpen(false);
          }}
          disabled={disabledDays}
          captionLayout="dropdown"
          startMonth={new Date(new Date().getFullYear() - 5, 0)}
          endMonth={new Date(new Date().getFullYear() + 2, 11)}
        />
      </PopoverContent>
    </Popover>
  );
};
