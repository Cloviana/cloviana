import Image from 'next/image';

export default function AppLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="animate-pulse">
        <Image
          src={'/logo-icon.png'}
          width={35}
          height={35}
          alt="logo"
          className="logo-swing"
        />
      </div>
    </div>
  );
}
