import Link from "next/link";
import styles from "./Header.module.css";

export default function Header({ current, children }: { current: "wall" | "brand" | "scorecard"; children?: React.ReactNode }) {
  const links: [typeof current, string, string][] = [
    ["wall", "/", "The Wall"],
    ["brand", "/brand", "Brand kit"],
    ["scorecard", "/scorecard", "Scorecard"],
  ];
  return (
    <header className={styles.header}>
      <Link href="/" prefetch={false} className={styles.mark} aria-label="Pika home">
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
