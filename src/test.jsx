import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import store from 'stores/store';
import AppLauncher from 'utilities/AppLauncher';
import ErrorBoundary from 'components/error/ErrorBoundary';
import TestRoutes from 'routes/TestRoutes';
import './test.scss';

class Test {
  constructor() {
    new AppLauncher().start(() => {
      Test.startTestApp();
    });
  }

  static startTestApp() {
    const dom = document.getElementById('app');
    ReactDOM.render(
      <ErrorBoundary>
        <Provider store={store}>
          <TestRoutes/>
        </Provider>
      </ErrorBoundary>,
      dom,
    );
  }
}

window.__webpack_hash__ = 'test';
const test = new Test();
export default test;
