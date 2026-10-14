"use client";

import { Eye, EyeOff } from "lucide-react";
import { type InputHTMLAttributes, useId, useState } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

const PasswordInput = ({ label, id, className = "", ...props }: PasswordInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isVisible, setIsVisible] = useState(false);
  const actionLabel = `${isVisible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`;

  return (
    <label htmlFor={inputId} className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
      {label}
      <span className="relative block">
        <input
          {...props}
          id={inputId}
          type={isVisible ? "text" : "password"}
          className={`h-11 w-full rounded-md border border-zinc-300 px-3 pr-12 text-base font-normal outline-none transition focus:border-zinc-900 ${className}`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={actionLabel}
          title={actionLabel}
          className="absolute right-0 top-0 grid size-11 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          {isVisible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
        </button>
      </span>
    </label>
  );
};

export default PasswordInput;
