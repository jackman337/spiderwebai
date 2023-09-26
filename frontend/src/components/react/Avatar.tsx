import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { AvatarProps } from '@radix-ui/react-avatar';

const getGravatarURL = async (email?: string) => {
  const address = String(email || '')
    .trim()
    .toLowerCase();

  const msgBuffer = new TextEncoder().encode(address);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  const splitEmail = email?.split('.');

  return hash
    ? `https://www.gravatar.com/avatar/${hash}?d=https://github.com/identicons/${
        splitEmail?.length ? splitEmail[0] : 'spider'
      }.png`
    : 'https://github.com/spider-rs.png';
};

export const UserAvatar = ({
  initials,
  email,
  ...props
}: AvatarProps & { initials?: string; email?: string }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const imageRef = useRef<string>();

  useEffect(() => {
    (async () => {
      const src = await getGravatarURL(email);
      imageRef.current = src;
      setImageSrc(src);
    })();
  }, [email, imageSrc, imageRef]);

  return (
    <Avatar className="avatar" {...props}>
      <AvatarImage src={imageSrc} alt={`${email ?? 'user'} avatar`} />
      <AvatarFallback className="capitalize">{initials}</AvatarFallback>
      <span className="sr-only">Avatar profile</span>
    </Avatar>
  );
};
