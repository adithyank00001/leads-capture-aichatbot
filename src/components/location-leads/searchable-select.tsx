"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SearchableOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  id: string;
  label: string;
  placeholder: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  allowClear?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  optionClassName?: string;
};

export function SearchableSelect({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  allowClear = true,
  className,
  labelClassName,
  inputClassName,
  optionClassName,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    setQuery(selected?.label ?? "");
  }, [selected?.label]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery(selected?.label ?? "");
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [selected?.label]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options.slice(0, 100);
    }
    return options
      .filter((option) => option.label.toLowerCase().includes(normalized))
      .slice(0, 100);
  }, [options, query]);

  return (
    <div ref={rootRef} className={cn("relative space-y-1.5", className)}>
      <label
        htmlFor={id}
        className={cn("text-sm font-medium text-foreground", labelClassName)}
      >
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      <Input
        id={id}
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClassName}
        onFocus={() => {
          if (!disabled) {
            setOpen(true);
          }
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (allowClear && event.target.value.trim() === "") {
            onChange("");
          }
        }}
      />
      {open && !disabled ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-md">
          {allowClear ? (
            <button
              type="button"
              className={cn(
                "w-full rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted",
                optionClassName,
              )}
              onClick={() => {
                onChange("");
                setQuery("");
                setOpen(false);
              }}
            >
              Clear
            </button>
          ) : null}
          {filtered.length === 0 ? (
            <p
              className={cn(
                "px-2 py-1.5 text-sm text-muted-foreground",
                optionClassName,
              )}
            >
              No matches
            </p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                  option.value === value && "bg-muted font-medium",
                  optionClassName,
                )}
                onClick={() => {
                  onChange(option.value);
                  setQuery(option.label);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
