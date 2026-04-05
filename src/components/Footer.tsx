import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-zinc-300 text-slate-700 dark:bg-zinc-900 dark:text-slate-100 py-6 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-4xl flex flex-col items-center justify-center text-center pb-4 border-b border-zinc-300 dark:border-zinc-500 ">
        <p className="text-sm">
          This website is not produced, endorsed, supported, or affiliated with
          Nintendo or The Pokemon Company.
        </p>
        <p className="text-sm mt-2">
          &copy; {new Date().getFullYear()} Bulk Box Binder
        </p>
      </div>
      <div>
        <ul className="font-exo text-sm flex items-center justify-center gap-x-4 pt-4 list-none">
          <li className="inline-block">
            <Link
              className="underline text-slate-700 hover:opacity-70 dark:text-slate-100"
              href="/">
              Home
            </Link>
          </li>
          <li className="inline-block">
            <Link
              className="underline text-slate-700 hover:opacity-70 dark:text-slate-100"
              href="/binders">
              Binders
            </Link>
          </li>
          <li className="inline-block">
            <Link
              className="underline text-slate-700 hover:opacity-70 dark:text-slate-100"
              href="/privacy-policy">
              Privacy Policy
            </Link>
          </li>
          <li className="inline-block">
            <Link
              className="underline text-slate-700 hover:opacity-70 dark:text-slate-100"
              href="/terms-of-service">
              Terms of Service
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
