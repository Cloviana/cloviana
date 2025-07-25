'use client';

import React, {
  ReactNode,
  ReactElement,
  FormEvent,
  KeyboardEvent,
  useCallback,
  cloneElement,
  isValidElement,
} from 'react';

export interface FormProps {
  /** Called when the user submits (clicks a submit button or presses Enter). */
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;

  /**
   * If true (default), pressing Enter inside any text input will submit.
   * If false, “Enter” does nothing unless the user clicks a button with submit=true.
   */
  implicitSubmit?: boolean;

  /**
   * If true (default), prevents the browser’s default form‐submission
   * (i.e. reload/navigate). If you want the native behavior, set this to false.
   */
  preventDefault?: boolean;

  /** All other <form> attributes (action, method, noValidate, etc.) pass through. */
  children: ReactNode;
  acceptCharset?: string;
  action?: string;
  autoComplete?: 'on' | 'off';
  encType?:
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'
    | 'text/plain';
  method?: 'get' | 'post';
  name?: string;
  noValidate?: boolean;
  target?: string;
  className?: string;
}

export function Form({
  onSubmit,
  implicitSubmit = true,
  preventDefault = true,
  acceptCharset,
  action,
  autoComplete,
  encType,
  method,
  name,
  noValidate,
  target,
  children,
  className,
}: FormProps) {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      if (preventDefault) {
        event.preventDefault();
      }
      onSubmit(event);
    },
    [onSubmit, preventDefault],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLFormElement>) => {
      if (!implicitSubmit && event.key === 'Enter') {
        const target = event.target as HTMLElement;
        const tag = target.tagName.toLowerCase();
        const type = (target as HTMLInputElement).type;
        const isTextField =
          tag === 'textarea' ||
          (tag === 'input' &&
            ['text', 'email', 'password', 'search', 'tel', 'url'].includes(
              type,
            ));

        if (isTextField) {
          event.preventDefault();
        }
      }
    },
    [implicitSubmit],
  );

  const normalizedChildren = React.Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    if (child.type === 'button' || (child.props as any).submit) {
      const wantsSubmit = Boolean((child.props as any).submit);
      return cloneElement(child as ReactElement<any>, {
        type: wantsSubmit ? 'submit' : 'button',
      });
    }

    return child;
  });

  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
    <form
      acceptCharset={acceptCharset}
      action={action}
      autoComplete={autoComplete ? 'on' : 'off'}
      encType={encType}
      method={method}
      name={name}
      noValidate={noValidate}
      target={target}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {normalizedChildren}
    </form>
  );
}
