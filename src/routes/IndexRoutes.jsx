import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import {hot} from 'react-hot-loader';
import IndexPage from 'pages/IndexPage';
import NotFoundPage from 'pages/NotFoundPage';
import Cube from "../components/samples/cube/Cube";
import HafenMap from "../components/samples/hafen/HafenMap";
import TrackPlayer from "../components/samples/hafen/VTPlayer";
import TidesVisualizer from "../components/samples/hafen/TidesVisualizer";

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
          <Route path="/cube" component={Cube}/>
          <Route path="/hafen-map" component={HafenMap}/>
          <Route path="/track-player" component={TrackPlayer}/>
          <Route path="/tides-visualizer" component={TidesVisualizer}/>
          <Route component={NotFoundPage}/>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default hot(module)(IndexRoutes);
