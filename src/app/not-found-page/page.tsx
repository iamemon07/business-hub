import { notFound } from "next/navigation";

/** Target for middleware rewrites of platform-only paths on a business host. */
export default function NotFoundPage() {
  notFound();
}
