import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container flex min-h-[70vh] flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="section-label">Not found</div>
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">The requested page does not exist.</h1>
      <p className="max-w-xl text-sm leading-6 text-slateblue-700">
        The resource may have been removed, or the link may be out of date.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white"
      >
        Go back home
      </Link>
    </main>
  );
}
