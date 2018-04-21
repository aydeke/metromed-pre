/* eslint-disable no-underscore-dangle */

import { SheetsRegistry } from 'react-jss';
import { createMuiTheme, createGenerateClassName } from 'material-ui/styles';
import purple from 'material-ui/colors/purple';
import green from 'material-ui/colors/green';

// A theme with custom primary and secondary color.
// It's optional.
const theme = createMuiTheme({
  palette: {
    // type: 'dark',
    typography: {
      // Use the system font over Roboto.
      fontFamily:
        '-apple-system,system-ui,BlinkMacSystemFont,' +
        '"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
      fontSize: 26,
      // Tell Material-UI what's the font-size on the html element is.
      htmlFontSize: 26,
    },
    // primary: {
    //   light: purple[300],
    //   main: purple[500],
    //   dark: purple[700],
    // },
    // secondary: {
    //   light: green[300],
    //   main: green[500],
    //   dark: green[700],
    // },
  },
});

function createPageContext() {
  return {
    theme,
    // This is needed in order to deduplicate the injection of CSS in the page.
    sheetsManager: new Map(),
    // This is needed in order to inject the critical CSS.
    sheetsRegistry: new SheetsRegistry(),
    // The standard class name generator.
    generateClassName: createGenerateClassName(),
  };
}

export default function getPageContext() {
  // Make sure to create a new context for every server-side request so that data
  // isn't shared between connections (which would be bad).
  if (!process.browser) {
    return createPageContext();
  }

  // Reuse context on the client-side.
  if (!global.__INIT_MATERIAL_UI__) {
    global.__INIT_MATERIAL_UI__ = createPageContext();
    // console.log(global.__INIT_MATERIAL_UI__);
  }

  // console.log(global.__INIT_MATERIAL_UI__);

  return global.__INIT_MATERIAL_UI__;
}
