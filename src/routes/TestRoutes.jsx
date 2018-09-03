import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import NotFoundPage from 'pages/NotFoundPage';
import TestPage from 'pages/TestPage';
import TestPage2 from 'pages/TestPage2';
import {hot} from 'react-hot-loader';

class TestRoutes extends React.Component {
  constructor(props) {
    super(props);
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('test');
  }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route path="/test/" component={TestPage}/>
          <Route path="/test2/" component={TestPage2}/>
          <Route component={NotFoundPage}/>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default hot(module)(TestRoutes);
