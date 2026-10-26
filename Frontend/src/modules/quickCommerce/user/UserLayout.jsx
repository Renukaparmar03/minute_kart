import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import CustomerLayout from './components/layout/CustomerLayout';
import { useBootstrapCurrentLocation } from '@shared/utils/currentLocationBootstrap';
import OutOfZoneScreen from '@shared/components/OutOfZoneScreen';
import { useLocation as useAppLocation } from '@food/hooks/useLocation';
import { useQuickZoneStatus } from './hooks/useQuickZoneStatus';

export default function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  // Pick up the user's live location on app open so items match where they are
  useBootstrapCurrentLocation();

  const { location: appLocation } = useAppLocation();
  const { isOutOfService } = useQuickZoneStatus(appLocation);
  // Leave the address pages usable so the user can switch to a serviceable location
  const isAddressRoute = /\/(addresses|address-selector)\/?$/.test(location.pathname);

  const handleChangeLocation = () => {
    const currentPath = `${location.pathname || ''}${location.search || ''}${location.hash || ''}` || '/quick';
    navigate('/food/user/cart/address-selector', {
      state: { from: currentPath, backTo: currentPath },
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <CustomerLayout>
      {isOutOfService && !isAddressRoute && <OutOfZoneScreen onChangeLocation={handleChangeLocation} />}
      <Outlet />
    </CustomerLayout>
  );
}
