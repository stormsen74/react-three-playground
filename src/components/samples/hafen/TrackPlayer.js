import React from 'react';
import connect from "react-redux/es/connect/connect";
import 'gsap/TweenMax';
import 'gsap/TimelineMax';
import CloseIcon from 'core/icons/close.inline.svg';
import vesselTrackerRange from 'components/samples/hafen/images/VesselTrackerRange.png';
import * as PIXI from 'pixi.js'

import '../Scene.scss'

const trackData = require("./trackData/track60.json");


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class TrackPlayer extends React.Component {
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
    };


    this.trackLength = 60;


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
    PIXI.loader.add(vesselTrackerRange).load(this.loadReady);
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
    this.vesselTimeline = new TimelineMax({onComplete: this.onTimelineComplete, onCompleteScope: this, paused: true});
  }

  onTimelineComplete() {
    console.log('onTimelineComplete')
  }

  loadReady() {
    this.initStage();

    let sprite = new PIXI.Sprite(PIXI.loader.resources[vesselTrackerRange].texture);
    this.app.stage.addChild(sprite);

    this.pathGraphics = new PIXI.Container();
    this.app.stage.addChild(this.pathGraphics);

    this.vesselGraphics = new PIXI.Container();
    this.app.stage.addChild(this.vesselGraphics);

    this.show();
    this.initTimeline();

    this.parseTrackData(trackData);

  }


  parseTrackData(_trackData) {
    let validCounter = 0;
    let range = {
      start: 0,
      end: 100,
      _count: 0
    };

    for (let i = 0; i < _trackData.vesselPool.length; i++) {
      if (_trackData.vesselPool[i]['hasMoved'] && _trackData.vesselPool[i]['status'] !== 'lost') {

        // if added later ... add Points []<
        if (validCounter >= range.start) {
          if (validCounter < range.end) {
            console.log(_trackData.vesselPool[i]);
            this.initVessel(_trackData.vesselPool[i]['trackData'], _trackData.vesselPool[i]['mmsi']);
            range._count++;
          }
        }
        validCounter++;
      }
    }

    console.log('valid vessels: ', validCounter);
    this.vesselTimeline.play();
  }


  initVessel(_trackData, _mmsi) {

    let vessel = new PIXI.Container();

    let vesselGraphics = new PIXI.Graphics();
    vesselGraphics.beginFill(0x1f164f);
    vesselGraphics.drawCircle(0, 0, 3);
    vesselGraphics.endFill();

    let display = new PIXI.Text(_mmsi, {fontFamily: 'Segoe UI', fontSize: 10, fill: 0xff0000, align: 'center'});

    vessel.addChild(vesselGraphics);
    vessel.addChild(display);
    this.vesselGraphics.addChild(vessel);


    let parsedTrack = [];
    for (let i = 0; i < _trackData.length; i++) {
      let pos = this.getXY(_trackData[i].lat, _trackData[i].lon);
      parsedTrack[i] = {x: pos[0], y: pos[1], status: _trackData[i].status}
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
        // console.log(trackTween.progress());
        // let frame = Math.round(trackTween.progress() * 60);
        // vessel.clear();
        // vessel.beginFill(this.getColorByStatus(parsedTrack[frame].status));
        // vessel.beginFill(0x1f164f);
        // vessel.drawCircle(0, 0, 3);
        // vessel.endFill();
      },
    });


    this.vesselTimeline.add(trackTween, '0')

  }


  getColorByStatus(status) {
    let color = 0x000000;
    switch (status) {
      case 'moored':
        color = 0xff0000;
        break;
      case 'waiting':
        color = 0x0000ff;
        break;
      case 'moving':
        color = 0x00ff00;
        break;
      case 'lost':
        color = 0x2ad2f6;
        break;
    }
    return color;
  }


  getXY(lat, long) {
    return [
      (long - this.GeoBounds.minLong) / (this.GeoBounds.maxLong - this.GeoBounds.minLong) * this.mapData.size.width,
      (lat - this.GeoBounds.minLat) / (this.GeoBounds.maxLat - this.GeoBounds.minLat) * this.mapData.size.height
    ];
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
    let indicatorMarkup =
      <div style={{position: 'absolute', right: '5px', top: '5px'}}>
        <svg
          viewBox="0 0 36 36" className="circular-chart">
          <path className={'circle'} id={'circle'} strokeDasharray="50, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
        </svg>
      </div>;

    return (
      <div style={{position: 'absolute', width: '1920px', height: '1077px'}}>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        {/*<div className={'debug'}>*/}
        {/*{indicatorMarkup}*/}
        {/*<div style={{position: 'absolute', top: '45px', right: '5px', width: '185px'}}>{'currentStep: ' + this.state.currentStep}</div>*/}
        {/*<div style={{position: 'absolute', top: '65px', right: '5px', width: '185px'}}>{'vesselPoolSize: ' + this.state.vesselPoolSize}</div>*/}
        {/*<div style={{position: 'absolute', top: '85px', right: '5px', width: '185px'}}>{'movingVessels: ' + this.state.movingVessels}</div>*/}
        {/*<div style={{position: 'absolute', top: '105px', right: '5px', width: '185px'}}>{'movedVessels: ' + this.state.movedVessels}</div>*/}
        {/*</div>*/}
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

