import { useEffect, useState } from "react";

export function Skeleton() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setVisible((v) => !v), 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-pulse bg-slate-200/50">{visible ? <span className="sr-only">Loading...</span> : null}</div>
  );
}

export function TextSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`h-4 rounded w-full bg-slate-200/50 ${className}`}>
      <Skeleton />
    </div>
  );
}

export function AvatarSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`h-10 w-10 rounded-full bg-slate-200/50 ${className}`}>
      <Skeleton />
    </div>
  );
}