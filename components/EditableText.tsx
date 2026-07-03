"use client";

import { useRef, useEffect, type CSSProperties, type JSX } from "react";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  placeholder?: string;
  style?: CSSProperties;
}

export default function EditableText({
  value,
  onChange,
  as = "span",
  className = "",
  placeholder = "Click to edit",
  style,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as any;

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={className}
      style={style}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        onChange(e.currentTarget.innerText.trim());
      }}
    />
  );
}
