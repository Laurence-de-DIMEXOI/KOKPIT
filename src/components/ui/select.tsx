import React from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  theme?: "dark" | "light";
}

export function Select({
  label,
  error,
  options,
  placeholder,
  theme = "light",
  className = "",
  ...props
}: SelectProps) {
  const baseStyles = "w-full px-4 py-2 rounded-lg font-medium transition-all appearance-none";

  const themeStyles = {
    light:
      "bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-cockpit focus:border-transparent",
    dark: "bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-cockpit focus:border-transparent",
  };

  const errorStyles = error
    ? "border-danger focus:ring-danger"
    : themeStyles[theme];

  const wrapperStyles = "relative w-full";
  const iconStyles = "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none";
  const iconColorClass = theme === "dark" ? "text-gray-400" : "text-gray-600";

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-semibold mb-2 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}>
          {label}
        </label>
      )}
      <div className={wrapperStyles}>
        <select
          className={`${baseStyles} ${errorStyles} ${className} pr-10`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled selected>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className={`${iconStyles} ${iconColorClass}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
      {error && <p className="text-danger text-sm mt-1">{error}</p>}
    </div>
  );
}
