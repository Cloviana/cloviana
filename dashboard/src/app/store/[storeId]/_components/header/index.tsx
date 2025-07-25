import { AccountDropdown, Logo, Menu } from './components';

export const Header = () => {
  return (
    <nav className="flex size-full items-center px-5 py-1">
      <div className="flex w-full items-center justify-between">
        <div className="block md:hidden">
          <Menu />
        </div>
        <div className="hidden md:block">
          <Logo />
        </div>
        <AccountDropdown />
      </div>
    </nav>
  );
};
