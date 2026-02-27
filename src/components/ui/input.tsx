import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  theme?: "dark" | "light";
}

export function Input({
  label,
  error,
  theme = "light",
  className = "",
  ...props
}: InputProps) {
  const baseStyles = "w-full px-4 py-2 rounded-lg font-medium transition-all";

  const themeStyles = {
    light:
      "bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-cockpit focus:border-transparent",
    dark: "bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-cockpit focus:border-transparent",
  };

  const errorStyles = error
    ? "border-danger focus:ring-danger"
    : themeStyles[theme];

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-semibold mb-2 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}>
          {label}
        </label>
      )}
      <input
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      />
      {error && <p className="text-danger text-sm mt-1">{error}</p>}
    </div>
  );
}
