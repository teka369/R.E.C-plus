"use client";

type Props = {
  children: string;
  className: string;
};

export default function ReloadButton({ children, className }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className={className}
    >
      {children}
    </button>
  );
}

