import { redirect } from 'next/navigation';

// Landing page sudah dipisah ke repo tersendiri (tokiva-landing-page)
// Root aplikasi web app.tokiva.biz.id → redirect ke landing tokiva.biz.id
export default function RootPage() {
  redirect('https://tokiva.biz.id');
}
