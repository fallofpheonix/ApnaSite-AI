// Quiet page closing (docs/DESIGN-REFERENCES.md §A rule 4): every full page
// ends with this, never on a raw widget.
export default function AppFooter() {
  return (
    <footer className="mt-16 border-t border-ink/10 px-6 py-8 text-center text-xs text-ink-soft">
      <p>ApnaSite AI — websites for small shops, in your own words.</p>
      <p className="mt-2">
        <a href="/terms" className="underline hover:text-ink">
          Terms
        </a>
        {" · "}
        <a href="/privacy" className="underline hover:text-ink">
          Privacy
        </a>
      </p>
    </footer>
  );
}
