import Link from 'next/link';

export function ModulePlaceholder({ title, note, links = [] }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p>{note}</p>
      {links.length > 0 && (
        <div className="actions">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="button-link">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
