import { RouterProvider, useRoute } from '@/lib/router';
import { Nav } from '@/components/Nav';
import { Landing } from '@/pages/Landing';
import { Workspace } from '@/pages/Workspace';
import { Customers } from '@/pages/Customers';
import { CustomerProfile } from '@/pages/CustomerProfile';
import { Dashboard } from '@/pages/Dashboard';
import { Memory } from '@/pages/Memory';
import { Demo } from '@/pages/Demo';
import { SearchPage } from '@/pages/Search';

function Routes() {
  const route = useRoute();
  const path = route.path;

  let page;
  if (path === '/') page = <Landing />;
  else if (path === '/workspace') page = <Workspace />;
  else if (path === '/customers') page = <Customers />;
  else if (path.startsWith('/customers/')) page = <CustomerProfile />;
  else if (path === '/dashboard') page = <Dashboard />;
  else if (path === '/memory') page = <Memory />;
  else if (path === '/demo') page = <Demo />;
  else if (path === '/search') page = <SearchPage />;
  else page = <Landing />;

  return (
    <div className="min-h-screen bg-ink-50">
      <Nav />
      <main>{page}</main>
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  );
}
