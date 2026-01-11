import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-zinc-300 text-slate-700 dark:bg-zinc-800 dark:text-slate-100 py-6 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-4xl flex flex-col items-center justify-center text-center pb-4 border-b border-zinc-300 dark:border-zinc-500 ">
        <p className="text-sm">
          This website is not produced, endorsed, supported, or affiliated with
          Nintendo or The Pokémon Company.
        </p>
        <p className="text-sm mt-2">
          &copy; {new Date().getFullYear()}{" "}
          <Link
            href="https://samnunn.me"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-slate-700 dark:text-slate-100 transition">
            Sam Nunn
          </Link>
        </p>
      </div>
      <div>
        <ul className="font-exo text-sm flex items-center justify-center gap-x-4 pt-4 list-none">
          <li className="inline-block">
            <Link
              className="underline text-slate-700 dark:text-slate-100 transition"
              href="/">
              Cards
            </Link>
          </li>
          <li className="inline-block">
            <Link
              className="underline text-slate-700 dark:text-slate-100 transition"
              href="/sets">
              Sets
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
