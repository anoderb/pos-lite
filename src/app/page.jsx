import { redirect } from 'next/navigation';

// Root aplikasi web app.tokiva.biz.id → langsung ke halaman login
export default function RootPage() {
  redirect('/login');
}
