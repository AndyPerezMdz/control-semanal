import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-[var(--ink-primary)]">Panel de control</h1>
        <p className="mt-1 text-sm text-[var(--ink-secondary)]">
          Acceso solo para administración.
        </p>
      </div>
      <LoginForm next={next ?? "/dashboard"} />
    </main>
  );
}
