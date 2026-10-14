import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import CustomerLayout from './components/layout/CustomerLayout';
import { useBootstrapCurrentLocation } from '@shared/utils/currentLocationBootstrap';

export default function UserLayout() {
  const location = useLocation();
  // Pick up the user's live location on app open so items match where they are
  useBootstrapCurrentLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <CustomerLayout>
      <Outlet />
    </CustomerLayout>
  );
}
