import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Welcome</h1>
      <p>This storefront is ready to be shaped.</p>
      <Link href="/cart">View cart</Link>
    </main>
  );
}
