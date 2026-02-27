import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  padding?: "sm" | "md" | "lg";
  className?: string;
}

const paddingStyles = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  title,
  padding = "md",
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-card rounded-2xl shadow-md overflow-hidden ${className}`}
    >
      {title && (
        <div className={`${paddingStyles[padding]} border-b border-gray-200`}>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
}
