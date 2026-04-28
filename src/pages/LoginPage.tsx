import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const loginWithTelegram = useAuthStore((s) => s.loginWithTelegram);
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initData?.trim()) return;

    setTelegramLoading(true);
    tg.ready();
    tg.expand();

    let cancelled = false;
    (async () => {
      try {
        await loginWithTelegram(tg.initData);
        if (!cancelled) navigate('/');
      } catch (err: unknown) {
        if (!cancelled) {
          let msg = 'Telegram login failed';
          if (axios.isAxiosError(err) && err.response?.data) {
            const d = err.response.data as {
              message?: string | string[];
            };
            msg = Array.isArray(d.message)
              ? d.message.join(', ')
              : (d.message ?? msg);
          }
          setError(msg);
        }
      } finally {
        if (!cancelled) setTelegramLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loginWithTelegram, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Login failed');
      } else {
        setError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm border-primary/20 shadow-xl shadow-primary/15">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[var(--wb-violet)] text-primary-foreground shadow-lg shadow-primary/25">
            <span className="font-heading text-lg font-bold">WB</span>
          </div>
          <CardTitle className="font-heading text-2xl font-bold tracking-tight">
            WB Analytics
          </CardTitle>
          <p className="text-sm text-muted-foreground">Вход в кабинет продавца</p>
        </CardHeader>
        <CardContent>
          {telegramLoading && (
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Вход через Telegram…
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || telegramLoading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
