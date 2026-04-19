/**
 * Layout for public auth pages (login, register, verify-otp).
 * No session check here — these pages must always be reachable so users
 * can log in or register even if a stale or foreign session cookie exists.
 * Returning-user redirect lives in the root page (/) only.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
