import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import {hot} from 'react-hot-loader';
import IndexPage from 'pages/IndexPage';
import NotFoundPage from 'pages/NotFoundPage';
import Cube from "../components/samples/cube/Cube";

import HafenMap from "../components/samples/hafen/prototype/HafenMap";
import TrackPlayer from "../components/samples/hafen/prototype/VTPlayer";
import TidesVisualizer from "../components/samples/hafen/TidesVisualizer";
import HafenMapFinal from "../components/samples/hafen/HafenMapFinal";
import TrackPlayerFinal from "../components/samples/hafen/VTPlayerFinal";

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
          <Route path="/hafen-map-final" component={HafenMapFinal}/>
          <Route path="/track-player-final" component={TrackPlayerFinal}/>
          <Route component={NotFoundPage}/>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default hot(module)(IndexRoutes);
