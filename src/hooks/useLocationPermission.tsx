import { useEffect } from 'react';

export const useLocationPermission = () => {
  useEffect(() => {
    const askLocation = async () => {
      const alreadyAsked = sessionStorage.getItem('location_asked');
      if (alreadyAsked) return;
      
      sessionStorage.setItem('location_asked', 'true');
      
      try {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Location granted:', position.coords.latitude, position.coords.longitude);
            },
            (error) => {
              console.log('Location denied or unavailable:', error.message);
            },
            { enableHighAccuracy: false, timeout: 10000 }
          );
        }
      } catch (e) {
        console.log('Geolocation not supported');
      }
    };

    // Delay to not block initial render
    const timer = setTimeout(askLocation, 3000);
    return () => clearTimeout(timer);
  }, []);
};
