import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction } from "@/features/auth/actions/auth-actions";
import { getSafeUser } from "@/lib/supabase/get-safe-user";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const user = await getSafeUser();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <div className="rounded-2xl border border-white/80 bg-white/80 p-6 shadow-[0_24px_55px_-35px_rgba(15,23,42,0.6)] backdrop-blur">
        <h1 className="text-4xl leading-none text-slate-900">Вход администратора</h1>
        <p className="mt-2 text-sm text-slate-600">
          Используйте учетные данные пользователя из Supabase Authentication.
        </p>

        {params.error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Ошибка авторизации. Проверьте email и пароль.
          </p>
        ) : null}

        <form action={signInAction} className="mt-6 space-y-4">
          <label className="block">
            <Label className="mb-1 block text-sm">Email</Label>
            <Input name="email" type="email" required />
          </label>
          <label className="block">
            <Label className="mb-1 block text-sm">Пароль</Label>
            <Input name="password" type="password" required />
          </label>
          <Button type="submit" className="w-full">
            Войти
          </Button>
        </form>

        <Link href="/" className="mt-4 inline-block text-sm text-slate-600 hover:text-slate-900">
          Назад к древу
        </Link>
      </div>
    </main>
  );
}
