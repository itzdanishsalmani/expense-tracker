import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useNetwork() {
  const [connection, setConnection] = useState({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setConnection({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      });
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, []);

  return connection;
}
