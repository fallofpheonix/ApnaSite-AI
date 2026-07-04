// The one heading pattern for full app pages (docs/DESIGN-REFERENCES.md §A):
// display-serif title + single subtitle line + optional right-aligned action.
// Pages use this instead of hand-rolling their own header block.
export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        <p className="mt-1.5 max-w-md text-sm text-ink-soft">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
