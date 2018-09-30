import React from 'react';
import connect from "react-redux/es/connect/connect";
import 'gsap/TweenMax';
import 'gsap/TimelineMax';
import 'react-dat-gui/build/react-dat-gui.css';
import DatGui, {DatBoolean, DatButton, DatColor, DatNumber, DatString} from 'react-dat-gui';
import * as PIXI from 'pixi.js'
import CloseIcon from 'core/icons/close.inline.svg';
import '../Scene.scss'

import vesselTrackerRange from 'components/samples/hafen/images/VesselTrackerRange.png';
const trackData = require("./trackData/track30_new.json");


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class TrackPlayer extends React.Component {

  state = {
    data: {
      package: 'react-dat-gui',
      progress: 0,
      isAwesome: true,
      feelsLike: '#2FA1D6',
    }
  };

  update = data => this.updateData(data);

  constructor(props) {
    super(props);

    this.loadReady = this.loadReady.bind(this);
    this.playTimeline = this.playTimeline.bind(this);
    this.pauseTimeline = this.pauseTimeline.bind(this);

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
    };

    this.trackLength = 30;

  }


  componentDidMount() {
    this.initialLoad();
  }

  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }

  initialLoad() {
    PIXI.loader.add(vesselTrackerRange).load(this.loadReady);
  }

  loadReady() {
    this.initStage();

    let sprite = new PIXI.Sprite(PIXI.loader.resources[vesselTrackerRange].texture);
    this.app.stage.addChild(sprite);

    this.vesselGraphics = new PIXI.Container();
    this.app.stage.addChild(this.vesselGraphics);

    this.show();
    this.initTimeline();

    this.parseTrackData(trackData);
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

  initTimeline() {
    this.vesselTimeline = new TimelineMax({
      onUpdate: () => {
        this.setState({
          data: {
            ...this.state.data,
            progress: this.vesselTimeline.progress()
          }
        })
      },
      onUpdateScope: this,
      onComplete: () => {
      },
      onCompleteScope: this,
      paused: true
    });
  }

  parseTrackData(_data) {
    let validCounter = 0;
    let range = {
      start: 0,
      end: 100,
      _count: 0
    };

    for (let i = 0; i < _data.vesselPool.length; i++) {
      if (_data.vesselPool[i]['hasMoved'] && _data.vesselPool[i]['status'] !== 'lost') {

        if (validCounter >= range.start) {
          if (validCounter < range.end) {
            this.initVessel(_data.vesselPool[i]);
            range._count++;
          }
        }
        validCounter++;
      }
    }

    console.log('valid vessels: ', validCounter);
  }


  initVessel(_vesselData) {

    let vessel = new PIXI.Container();
    let display = new PIXI.Text(_vesselData['mmsi'], {fontFamily: 'Segoe UI', fontSize: 10, fill: 0xcc660000, align: 'center'});
    let vesselGraphics = new PIXI.Graphics();
    vesselGraphics.beginFill(0x1f164f);
    vesselGraphics.drawCircle(0, 0, 3);
    // vesselGraphics.drawPolygon([0, -5, 4, 5, -4, 5]);
    vesselGraphics.endFill();
    vessel.addChild(vesselGraphics);
    vessel.addChild(display);
    this.vesselGraphics.addChild(vessel);

    let parsedTrack = [];
    for (let i = 0; i < _vesselData['trackData'].length; i++) {
      let pos = this.cartesianFromLatLong(_vesselData['trackData'][i].lat, _vesselData['trackData'][i].lon);
      parsedTrack[i] = {x: pos[0], y: pos[1], status: _vesselData['trackData'].status}
    }

    vessel.x = parsedTrack[0].x;
    vessel.y = parsedTrack[0].y;

    let trackTween = TweenMax.to(vessel, this.trackLength, {
      bezier: {
        curviness: 1,
        type: 'thru',
        values: parsedTrack,
        autoRotate: false
      },
      ease: Power0.easeNone,
      onUpdate: () => {
      },
    });


    this.vesselTimeline.add(trackTween, '0')
  }


  // getColorByStatus(status) {
  //   let color = 0x000000;
  //   switch (status) {
  //     case 'moored':
  //       color = 0xff0000;
  //       break;
  //     case 'waiting':
  //       color = 0x0000ff;
  //       break;
  //     case 'moving':
  //       color = 0x00ff00;
  //       break;
  //     case 'lost':
  //       color = 0x2ad2f6;
  //       break;
  //   }
  //   return color;
  // }


  cartesianFromLatLong(lat, long) {
    return [
      (long - this.GeoBounds.minLong) / (this.GeoBounds.maxLong - this.GeoBounds.minLong) * this.mapData.size.width,
      (lat - this.GeoBounds.minLat) / (this.GeoBounds.maxLat - this.GeoBounds.minLat) * this.mapData.size.height
    ];
  }

  playTimeline() {
    this.vesselTimeline.play();
  }

  pauseTimeline() {
    this.vesselTimeline.pause();
  }

  updateData(data) {
    this.vesselTimeline.progress(data.progress);
    this.setState({data})
  }

  render() {
    const {data} = this.state;

    return (
      <div className={'wrapper'}>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <DatGui data={data} onUpdate={this.update}>
          <DatNumber path='progress' label='progress' min={0} max={1} step={0.01}/>
          <DatButton label="Play" onClick={this.playTimeline}/>
          <DatButton label="Pause" onClick={this.pauseTimeline}/>
          {/*<DatBoolean path='isAwesome' label='Awesome?'/>*/}
          {/*<DatColor path='feelsLike' label='Feels Like'/>*/}
        </DatGui>
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

export default connect(mapStateToProps, {})(TrackPlayer);

