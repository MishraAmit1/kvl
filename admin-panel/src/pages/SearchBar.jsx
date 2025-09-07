import React from "react";

export default function SearchBar({
  value,
  onChange,
  onClear,
  loading,
  placeholder,
}) {
  return (
    <div className="relative w-full max-w-sm">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background text-foreground px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Search"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
      {loading && (
        <span
          className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin"
          aria-label="Loading"
        >
          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
        </span>
      )}
    </div>
  );
}
