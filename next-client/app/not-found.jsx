import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="panel">
      <h2>Page not found</h2>
      <p>The route you requested does not exist in the Next.js migration app.</p>
      <div className="actions">
        <Link href="/dashboard" className="button-link">
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}
