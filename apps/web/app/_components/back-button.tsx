import Link from "next/link";

type BackButtonProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function BackButton({ href = "/dashboard", label = "Back", className }: BackButtonProps) {
  return (
    <Link
      href={href as never}
      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 ${className ?? ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.72 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.24a.75.75 0 0 1 0-1.06l4.25-4.24a.75.75 0 0 1 1.07 0Z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </Link>
  );
}
