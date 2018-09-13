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

  }

  componentDidMount() {

    this.initStage();
    // requestAnimationFrame(this.draw);


    TweenMax.to(this.canvasWrapper, .5, {delay: .5, opacity: 1, ease: Cubic.easeIn});

    window.addEventListener('resize', this.onResize, true);
    this.onResize();
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize, true);
  }


  initStage() {
    let app = new PIXI.Application({
        width: 1920,         // default: 800
        height: 1083,        // default: 600
        antialias: true,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );

//Add the canvas that Pixi automatically created for you to the HTML document
    this.canvasWrapper.appendChild(app.view);


    console.log(map)

    PIXI.loader
      .add(map)
      .load(setup);

    function setup() {
      let sprite = new PIXI.Sprite(
        PIXI.loader.resources[map].texture
      );

      app.stage.addChild(sprite);

      let rectangle = new PIXI.Graphics();
      rectangle.lineStyle(1, 0xFF3300, 1);
      rectangle.beginFill(0x66CCFF);
      rectangle.drawRect(-20, -10, 40, 20);
      rectangle.endFill();


      let x = (1920) * (180 + 53.5424773) / 360;
      let y = (1083) * (90 - 9.9722899) / 180;

      rectangle.x = x;
      rectangle.y = y;
      app.stage.addChild(rectangle);
    }

    // http://www.mwegner.de/geo/geo-koordinaten/umrechnung-grad-minute-sekunde-dezimalgrad.html

    // let lat =  53.5441666667;
    // let lng = 9.95816666667;
    // 5434.526626371883 3208.969122735945

    // let x0 = 6371 * Math.cos(lat0) * Math.cos(lng0);
    // let y0 = 6371 * Math.cos(lat0) * Math.sin(lng0);

    // https://www.codeproject.com/Questions/626899/Converting-Latitude-And-Longitude-to-an-X-Y-Coordi

    // => https://gist.github.com/arcktip/2589885

    const getXfromLatLng = (lat, lng) => {
      return 6371 * Math.cos(lat) * Math.cos(lng)
    };

    const getYfromLatLng = (lat, lng) => {
      return 6371 * Math.cos(lat) * Math.sin(lng);
    };


    let lat0 = 53.5469;
    let lat1 = 53.5231;
    let lng0 = 9.9418;
    let lng1 = 10.0135;

    // https://stackoverflow.com/questions/1369512/converting-longitude-latitude-to-x-y-on-a-map-with-calibration-points
    let x0 = (1920) * (180 + lat0) / 360;
    let y0 = (1083) * (90 - lng0) / 180;

    let x = (1920) * (180 + 53.5424773) / 360;
    let y = (1083) * (90 - 9.9722899) / 180;


    let bounds = {
      p_0_0: {
        lng: lng0,
        lat: lat0,
        x: getXfromLatLng(lat0, lng0),
        y: getYfromLatLng(lat0, lng0)
      },
      p_1_0: {
        lng: lng1,
        lat: lat0,
        x: getXfromLatLng(lat0, lng1),
        y: getYfromLatLng(lat0, lng1)
      },
      p_1_1: {
        lng: lng1,
        lat: lat1,
        x: getXfromLatLng(lat1, lng1),
        y: getYfromLatLng(lat1, lng1)
      },
      p_0_1: {
        lng: lng0,
        lat: lat1,
        x: getXfromLatLng(lat1, lng0),
        y: getYfromLatLng(lat1, lng0)
      }
    };


    console.log(bounds)

    function millerEncode(lon, lat, lonOrigin) {

      let p = [];

      // get x coordinate in radians
      p[0] = (lon - lonOrigin);

      // convert x coordinate from radians to [0,1)
      p[0] = p[0] / (2.0 * Math.PI);
      while (p[0] < 0) {
        p[0]++;
      }
      while (p[0] > 1) {
        p[0]--;
      }

      // get y coordinate in radians with 0 being equator
      p[1] = (5.0 / 4.0) * Math.log(Math.tan((Math.PI * .25) + (2.0 / 5.0) * lat));

      // convert out of radians
      p[1] = p[1] / Math.PI * 2;

      // move 0 to be the top edge of the screen and not upside down
      p[1] = 1 - (p[1] + 0.5);

      if (p[1] < 0 || p[1] > 1) {
        console.log("out of bounds entry, lon/lat " + lon + " " + lat + " - " + p[0] + "," + p[1]);
      }

      return p;
    }

    // 53.5424773,9.9722899

    // let x = (1920) * (180 + 9.9722899) / 360
    // let y = (1083) * (90 - 53.5424773) / 180


    console.log(x, y)

    const degToRad = 0.0174533;

    let _lat = 53.5424773 * degToRad;
    let _lng = 9.9722899 * degToRad;
    let _lonOrigin = 9.9418 * degToRad;


    // console.log(millerEncode(_lat, _lng, _lonOrigin)[0] * 1920);
    // console.log(millerEncode(_lat, _lng, _lonOrigin)[1] * 1083)


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

