import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-y-6 text-center text-foreground bg-background p-4">
      <h1 className="text-6xl font-black">404</h1>
      <p className="text-xl text-muted-foreground max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-lg bg-sentienx-brand text-white font-medium hover:bg-sentienx-brand-dark transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
