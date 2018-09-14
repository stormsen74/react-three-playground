import React from 'react';
import connect from "react-redux/es/connect/connect";
import 'gsap/TweenMax';
import CloseIcon from 'core/icons/close.inline.svg';
import map from 'components/samples/hafen/images/map.png';
import * as PIXI from 'pixi.js'

import '../Scene.scss'


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class HafenMap extends React.Component {
  constructor(props) {
    super(props);

    this.draw = this.draw.bind(this);
    this.onResize = this.onResize.bind(this);
    this.loadReady = this.loadReady.bind(this);

    this.GeoBounds = {
      minLong: 9.9418,
      maxLong: 10.0135,
      minLat: 53.5469,
      maxLat: 53.5231
    };

    this.mapData = {
      size: {
        width: 1920,
        height: 1083
      }
    }

  }

  componentDidMount() {


    this.initialLoad();
    // requestAnimationFrame(this.draw);


    window.addEventListener('resize', this.onResize, true);
    this.onResize();
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize, true);
  }

  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }


  initialLoad() {
    PIXI.loader.add(map).load(this.loadReady);
  }


  getXY(lat, long) {
    return [
      (long - this.GeoBounds.minLong) / (this.GeoBounds.maxLong - this.GeoBounds.minLong) * this.mapData.size.width,
      (lat - this.GeoBounds.minLat) / (this.GeoBounds.maxLat - this.GeoBounds.minLat) * this.mapData.size.height
    ];
  }


  loadReady() {
    console.log('loadReady');

    this.initStage();


    let sprite = new PIXI.Sprite(PIXI.loader.resources[map].texture);
    this.app.stage.addChild(sprite);


    let point = new PIXI.Graphics();
    point.lineStyle(1, 0x025bff, 1);
    point.beginFill(0xff4f02);
    point.drawCircle(0, 0, 5);
    point.endFill();
    this.app.stage.addChild(point);


    let pos = this.getXY(53.542271, 9.967715);
    point.x = pos[0];
    point.y = pos[1];


    this.show();
  }


  initStage() {
    this.app = new PIXI.Application({
        width: 1920,
        height: 1083,
        antialias: true,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );

    this.app.view.id = 'pixi-app-view';
    this.canvasWrapper.appendChild(this.app.view);

  }

  onResize() {
  }


  update() {

  }


  draw() {

    requestAnimationFrame(this.draw);

    this.update();
  }


  render() {
    return (
      <div>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <a href={'/'}>
          <CloseIcon fill={'#000000'} className="close-icon"/>
        </a>
      </div>

    );
  }
}

function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps, {})(HafenMap);

