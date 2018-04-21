/**
 * ./lib/notifier.js
 */

import { openSnackbar } from '../components/Notifier';

export default function notify(obj) {
  // console.log('Hello from notifier.js > notify()');
  openSnackbar({ message: obj.message || obj.toString() });
}
