import { redirect } from 'next/navigation';

export default function SellerRegisterRedirect() {
  redirect('/user/register?type=seller');
}
