import React from 'react';
import connect from "react-redux/es/connect/connect";
import 'gsap/TweenMax';
import CloseIcon from 'core/icons/close.inline.svg';
import map from 'components/samples/hafen/images/map.png';
import vesselTrackerRange from 'components/samples/hafen/images/VesselTrackerRange.png';
import * as PIXI from 'pixi.js'

import '../Scene.scss'
import VesselTrackerConnector from "./VesselTrackerConnector";


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class HafenMap extends React.Component {
  constructor(props) {
    super(props);

    this.draw = this.draw.bind(this);
    this.onResize = this.onResize.bind(this);
    this.loadReady = this.loadReady.bind(this);

    this.GeoBounds = {
      minLong: 9.7538,
      maxLong: 10.0948,
      minLat: 53.5743,
      maxLat: 53.4605
    };

    this.mapData = {
      size: {
        width: 1920,
        height: 1077
      }
    }

  }

  componentDidMount() {

    this.vtc = new VesselTrackerConnector(this);


    this.initialLoad();
    // requestAnimationFrame(this.draw);


    window.addEventListener('resize', this.onResize, true);
    this.onResize();
  }


  onUpdateTrackerData(geo) {
    console.log(geo);
    let pos = this.getXY(geo[0], geo[1]);
    console.log(pos);
    this.point.x = pos[0];
    this.point.y = pos[1];
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize, true);
  }

  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }


  initialLoad() {
    PIXI.loader.add(vesselTrackerRange).load(this.loadReady);
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


    let sprite = new PIXI.Sprite(PIXI.loader.resources[vesselTrackerRange].texture);
    this.app.stage.addChild(sprite);


    this.point = new PIXI.Graphics();
    this.point.lineStyle(1, 0x025bff, 1);
    this.point.beginFill(0xff4f02);
    this.point.drawCircle(0, 0, 5);
    this.point.endFill();
    this.app.stage.addChild(this.point);


    // let pos = this.getXY(53.544448333333335, 9.985446666666666);
    // point.x = pos[0];
    // point.y = pos[1];


    this.show();

    this.vtc.load();
  }


  initStage() {
    this.app = new PIXI.Application({
        width: this.mapData.size.width,
        height: this.mapData.size.height,
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

