import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import {hot} from 'react-hot-loader';
import IndexPage from 'pages/IndexPage';
import NotFoundPage from 'pages/NotFoundPage';

class IndexRoutes extends React.Component {
  constructor(props) {
    super(props);
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('index');
  }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={IndexPage}/>
          <Route component={NotFoundPage}/>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default hot(module)(IndexRoutes);
