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

    // let lat0 = 53.5469;
    // let lat1 = 53.5231;
    // let lng0 = 9.9418;
    // let lng1 = 10.0135;

    this.GeoBounds = {
      minLong: 9.9418,
      maxLong: 10.0135,
      minLat: 53.5469,
      maxLat: 53.5231
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
    let pos = [0, 0]
    pos[0] = (long - this.GeoBounds.minLong) / (this.GeoBounds.maxLong - this.GeoBounds.minLong) * 1920;
    pos[1] = (lat - this.GeoBounds.minLat) / (this.GeoBounds.maxLat - this.GeoBounds.minLat) * 1083;
    return pos;
  }


  loadReady() {
    console.log('loadReady')

    this.initStage();


    let sprite = new PIXI.Sprite(
      PIXI.loader.resources[map].texture
    );
    this.app.stage.addChild(sprite);


    let rectangle = new PIXI.Graphics();
    rectangle.lineStyle(1, 0xFF3300, 1);
    rectangle.beginFill(0x66CCFF);
    rectangle.drawRect(-20, -10, 40, 20);
    rectangle.endFill();

    // 53.5412987,9.9878186
    let pos = this.getXY(53.538643, 9.971231);
    console.log(pos)

    rectangle.x = pos[0];
    rectangle.y = pos[1];

    this.app.stage.addChild(rectangle);

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

    this.canvasWrapper.appendChild(this.app.view);


    const degToRad = 0.0174533;


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

