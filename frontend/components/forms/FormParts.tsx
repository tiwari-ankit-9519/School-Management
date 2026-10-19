"use client";
import { HTMLAttributes, ReactNode, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  CalendarDays,
  FileText,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DocumentType } from "@/types";

export const fieldClass = (hasError: boolean) =>
  `h-10 rounded-lg border-input bg-card font-manrope text-sm text-foreground placeholder:text-muted-foreground/60 shadow-none focus-visible:ring-0 dark:bg-card ${
    hasError
      ? "border-red-500/60 focus-visible:border-red-500 dark:border-red-500/60"
      : "focus-visible:border-indigo-500 dark:focus-visible:border-indigo-500"
  }`;

export const OUTLINE_PILL_CLASS =
  "rounded-full border-border bg-transparent font-manrope text-foreground/80 shadow-none hover:bg-accent hover:text-foreground dark:border-border dark:bg-transparent dark:hover:bg-accent";

export const PRIMARY_PILL_CLASS =
  "rounded-full bg-primary font-manrope font-semibold text-primary-foreground shadow-none hover:bg-primary/90";

export const TAB_TRIGGER_CLASS =
  "h-9 flex-none gap-1.5 rounded-full border-0 bg-muted px-4 font-manrope text-xs font-medium text-foreground/70 shadow-none hover:bg-accent hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-0 dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground";

export const toDateOnly = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

export const DOCUMENT_TYPE_OPTIONS = Object.values(DocumentType).map((d) => ({
  value: d,
  label: d.replace(/_/g, " "),
}));

export interface UploadedDocument {
  file: File;
  documentType: DocumentType;
  title: string;
}

export const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1.5 flex items-center gap-1 font-manrope text-xs text-red-600 dark:text-red-400"
    >
      <AlertCircle className="size-3 shrink-0" />
      {message}
    </motion.p>
  );
};

export const FieldLabel = ({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) => (
  <Label
    htmlFor={htmlFor}
    className="mb-1.5 block font-manrope text-xs font-normal text-foreground/70"
  >
    {children}
  </Label>
);

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  suffix?: string;
  className?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}

export const TextField = ({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  suffix,
  className,
  inputMode,
}: TextFieldProps) => {
  const id = useId();
  return (
    <div className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass(!!error)} ${suffix ? "pr-16" : ""} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-manrope text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      <FieldError message={error} />
    </div>
  );
};

export const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <section className="grid grid-cols-1 gap-5 border-b border-border py-8 last:border-b-0 lg:grid-cols-[minmax(0,260px)_1fr] lg:gap-10">
    <div>
      <h3 className="font-jakarta text-[15px] font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1 font-manrope text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

interface PillGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T | undefined;
  onSelect: (value: T) => void;
  error?: string;
}

export function PillGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
  error,
}: PillGroupProps<T>) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <ToggleGroup
        type="single"
        value={value ?? ""}
        onValueChange={(next: string) => {
          const match = options.find((opt) => opt.value === next);
          if (match) onSelect(match.value);
        }}
        className="flex flex-wrap justify-start gap-2"
      >
        {options.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            className="h-10 flex-none rounded-full! border-0 bg-muted px-4 font-manrope text-xs font-medium text-foreground/70 hover:bg-accent hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <FieldError message={error} />
    </div>
  );
}

interface PhotoPickerProps {
  preview: string | null;
  alt: string;
  editLabel: string;
  removeLabel: string;
  hint: string;
  onPick: (file: File) => void;
  onRemove: () => void;
}

export const PhotoPicker = ({
  preview,
  alt,
  editLabel,
  removeLabel,
  hint,
  onPick,
  onRemove,
}: PhotoPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={editLabel}
        className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Avatar className="h-28 w-28 border border-border">
          {preview && (
            <AvatarImage src={preview} alt={alt} className="object-cover" />
          )}
          <AvatarFallback className="bg-muted">
            <User className="size-8 text-muted-foreground/60" />
          </AvatarFallback>
        </Avatar>
      </button>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className={`h-8 px-3 text-xs font-normal ${OUTLINE_PILL_CLASS}`}
        >
          {editLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRemove}
          disabled={!preview}
          aria-label={removeLabel}
          className={`h-8 w-8 ${OUTLINE_PILL_CLASS} hover:text-red-600 dark:hover:text-red-400`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <p className="max-w-36 text-center font-manrope text-[11px] leading-snug text-muted-foreground">
        {hint}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};

interface DatePickerFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date) => void;
  placeholder: string;
  startMonth: Date;
  endMonth: Date;
  error?: string;
}

export const DatePickerField = ({
  label,
  value,
  onChange,
  placeholder,
  startMonth,
  endMonth,
  error,
}: DatePickerFieldProps) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={!!error}
            className={`${fieldClass(!!error)} w-full justify-start gap-2 px-3 font-normal hover:bg-card aria-expanded:border-indigo-500 dark:hover:bg-card ${
              value ? "text-foreground" : "text-muted-foreground/60"
            }`}
          >
            <CalendarDays className="size-4 text-muted-foreground" />
            {value
              ? value.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto rounded-xl p-0">
          <Calendar
            mode="single"
            selected={value}
            defaultMonth={value ?? startMonth}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            disabled={{ after: new Date() }}
            onSelect={(date) => {
              if (!date) return;
              onChange(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <FieldError message={error} />
    </div>
  );
};

interface DocumentUploaderProps {
  documents: UploadedDocument[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onTitleChange: (index: number, title: string) => void;
  onTypeChange: (index: number, type: DocumentType) => void;
  labels: {
    upload: string;
    hint: string;
    empty: string;
    title: string;
    type: string;
    remove: string;
  };
}

export const DocumentUploader = ({
  documents,
  onAdd,
  onRemove,
  onTitleChange,
  onTypeChange,
  labels,
}: DocumentUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        className="flex h-auto w-full flex-col items-center justify-center gap-3 rounded-xl border-dashed border-border bg-muted/40 py-8 whitespace-normal shadow-none hover:border-indigo-500/40 hover:bg-indigo-500/5 dark:border-border dark:bg-muted/40 dark:hover:bg-indigo-500/5"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
          <Upload className="size-4 text-muted-foreground" />
        </span>
        <span className="text-center">
          <span className="block font-jakarta text-sm font-semibold text-foreground">
            {labels.upload}
          </span>
          <span className="mt-0.5 block font-manrope text-xs font-normal text-muted-foreground">
            {labels.hint}
          </span>
        </span>
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          onAdd(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      {documents.length === 0 ? (
        <p className="text-center font-manrope text-xs text-muted-foreground">
          {labels.empty}
        </p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, i) => (
            <motion.div
              key={`${doc.file.name}-${doc.file.lastModified}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span className="truncate font-manrope text-xs text-foreground/80">
                    {doc.file.name}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onRemove(i)}
                  aria-label={labels.remove}
                  className={`h-7 w-7 shrink-0 ${OUTLINE_PILL_CLASS} hover:text-red-600 dark:hover:text-red-400`}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor={`doc-title-${i}`}>
                    {labels.title}
                  </FieldLabel>
                  <Input
                    id={`doc-title-${i}`}
                    value={doc.title}
                    onChange={(e) => onTitleChange(i, e.target.value)}
                    className={fieldClass(false)}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor={`doc-type-${i}`}>
                    {labels.type}
                  </FieldLabel>
                  <Select
                    value={doc.documentType}
                    onValueChange={(value: string) => {
                      const match = DOCUMENT_TYPE_OPTIONS.find(
                        (opt) => opt.value === value,
                      );
                      if (match) onTypeChange(i, match.value);
                    }}
                  >
                    <SelectTrigger
                      id={`doc-type-${i}`}
                      className={`${fieldClass(false)} w-full data-[size=default]:h-10 dark:hover:bg-card`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="font-manrope text-xs"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
