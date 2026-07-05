"use client";

import { useRef, useEffect, type CSSProperties, type ElementType, type JSX } from "react";

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
  const Tag = as as ElementType;

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
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        // Only paragraph fields are multi-line; everywhere else Enter would
        // inject a line break into a heading/pill/price.
        if (e.key === "Enter" && as !== "p") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onPaste={(e: React.ClipboardEvent<HTMLElement>) => {
        // contentEditable pastes rich HTML by default — insert plain text,
        // and keep single-line fields single-line.
        e.preventDefault();
        let text = e.clipboardData.getData("text/plain");
        if (as !== "p") text = text.replace(/\s*\r?\n\s*/g, " ");
        document.execCommand("insertText", false, text);
      }}
    />
  );
}
