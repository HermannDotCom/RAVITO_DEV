import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from '../components/Accessibility/LoadingSpinner';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  delay?: number;
}

export const lazyLoadComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): React.LazyExoticComponent<T> => {
  const { delay = 0 } = options;

  const lazyImport = delay > 0
    ? () =>
        Promise.all([
          importFunc(),
          new Promise(resolve => setTimeout(resolve, delay)),
        ]).then(([module]) => module)
    : importFunc;

  return lazy(lazyImport);
};

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  ),
}) => {
  return <Suspense fallback={fallback}>{children}</Suspense>;
};

export const withLazyLoad = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> => {
  return (props: P) => (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner />
          </div>
        )
      }
    >
      <Component {...props} />
    </Suspense>
  );
};
