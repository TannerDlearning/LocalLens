import Link from "next/link";

export default function Footer() {
  return (
    <div className="relative flex justify-center w-full">
      <footer className="flex flex-col items-center md:flex-row md:items-start justify-between max-w-[var(--max-content-width)] w-full gap-[var(--space-3xl)]">
        <div className="flex flex-col items-center md:items-start gap-[var(--space-xl)] w-72">
          <p className="text-4xl font-medium">LocalLens</p>
          <p className="text-center md:text-left">
            Know what's stored. Take control.
          </p>
          <p className="text-xs font-semibold">
            Copyright ©{new Date().getFullYear()} - All rights reserved
          </p>
        </div>

        <div className="flex flex-col items-center md:items-start gap-[var(--space-xl)]">
          <h3 className="text-xl">Links</h3>
          <div className="flex flex-col items-center md:items-start gap-[var(--space-md)]">
            <Link className="hover:underline" href="/">
              Home
            </Link>
            <Link className="hover:underline" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
