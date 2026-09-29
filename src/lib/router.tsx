import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface RouteState {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

interface RouterContextValue extends RouteState {
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextValue>({
  path: '/',
  params: {},
  query: {},
  navigate: () => {},
});

function parsePath(pathname: string): RouteState {
  const [path, queryString] = pathname.split('?');
  const query: Record<string, string> = {};
  if (queryString) {
    new URLSearchParams(queryString).forEach((v, k) => { query[k] = v; });
  }
  return { path, params: {}, query };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<RouteState>(() => parsePath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setRoute(parsePath(path));
    window.scrollTo(0, 0);
  }, []);

  return (
    <RouterContext.Provider value={{ ...route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

export function useRoute() {
  return useContext(RouterContext);
}

export function useNavigate() {
  return useContext(RouterContext).navigate;
}

export function useParams<T extends Record<string, string>>(): T {
  const route = useRoute();
  return route.params as T;
}

export function useSearchParams(): Record<string, string> {
  return useRoute().query;
}

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Link({ to, children, className = '', onClick }: LinkProps) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
