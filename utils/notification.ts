import { PermissionsAndroid } from 'react-native';

export default async function requestSMSPermission(): Promise<boolean> {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'Allow SMS Access',
        message:
          'We need access to your SMS to automatically track your expenses from bank messages.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('SMS permission granted');
      return true;
    } else {
      console.log('SMS permission denied');
      return false;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
}