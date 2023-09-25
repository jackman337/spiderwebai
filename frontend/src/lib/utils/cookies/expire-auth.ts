import { CookieKeys } from '@/lib/storage';
import cookie from 'cookie';

export const expireAuthCookies = () => {
  const date = new Date();
  date.setDate(date.getDate() - 2);

  document.cookie = cookie.serialize(CookieKeys.ACCESS_TOKEN, '', {
    expires: date,
  });
  // keep refresh token around for re-auth
  document.cookie = cookie.serialize(CookieKeys.REFRESH_TOKEN, '', {
    expires: date,
  });
};
