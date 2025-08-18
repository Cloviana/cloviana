declare module '*.svg' {
  import * as React from 'react';

  // Export a React component that passes through all <svg> attributes:
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  // Default export is also the component:
  const SVGRComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  export default SVGRComponent;
}
