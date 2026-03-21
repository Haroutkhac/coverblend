import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/blend', label: 'Blend' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            Built with{' '}
            <span className="font-medium bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
              CoverBlend
            </span>
          </p>
          <nav className="flex items-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
