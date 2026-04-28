import { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="64" height="64" rx="14" fill="hsl(260 85% 60%)" />
      <path
        d="M18 44V20h12c5.5 0 9 3.2 9 8.2 0 5.1-3.5 8.3-9 8.3h-6V44h-6Zm6-12.6h5.4c2.4 0 3.8-1.2 3.8-3.2 0-2-1.4-3.2-3.8-3.2H24v6.4Z"
        fill="white"
      />
      <circle cx="46" cy="22" r="4" fill="#22d3ee" />
    </svg>
  );
}
