import Link from "next/link";
import styles from "./Header.module.css";

export default function Header({ current, children }: { current: "loop" | "jury" | "sites" | "wall" | "brand" | "scorecard"; children?: React.ReactNode }) {
  const links: [typeof current, string, string][] = [
    ["loop", "/", "The Loop"],
    ["sites", "/sites", "Sites"],
    ["scorecard", "/scorecard", "Scorecard"],
    ["wall", "/wall", "The Wall"],
    ["jury", "/jury", "Jury mode"],
    ["brand", "/brand", "Brand kit"],
  ];
  return (
    <header className={styles.header}>
      <Link href="/" prefetch={false} className={styles.mark} aria-label="Pika home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/pika-mark.svg" alt="" width={30} height={43} />
        Pika
      </Link>
      <nav className={styles.nav}>
        {links.map(([id, href, label]) => (
          <Link key={id} href={href} prefetch={false} aria-current={current === id ? "page" : undefined} className={styles.link}>
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.tools}>{children}</div>
    </header>
  );
}
