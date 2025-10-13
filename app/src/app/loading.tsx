import Image from 'next/image';

export default function AppLoading() {
  return (
    <div className="bg-background flex h-screen items-center justify-center">
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
