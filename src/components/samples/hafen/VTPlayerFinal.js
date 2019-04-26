import React from 'react';
import connect from "react-redux/es/connect/connect";
import axios from 'axios';
import * as PIXI from 'pixi.js'
import DatGui, {DatBoolean, DatButton, DatNumber} from 'react-dat-gui';
import 'gsap/TweenMax';
import 'gsap/TimelineMax';
import 'react-dat-gui/build/react-dat-gui.css';
import CloseIcon from 'core/icons/close.inline.svg';
import '../Scene.scss'
import {Vector2} from "../../../utils/vector2";
import Mousetrap from 'mousetrap';


import mapImage from 'components/samples/hafen/images/FinalMap.png';
import mapImageLarge from 'components/samples/hafen/images/FinalMapLarge.png';
import VTPlayerFinalUtils from "./utils/final/VTPlayerFinalUtils";

const DEVELOPMENT = process.env.NODE_ENV === 'development';

class VTPlayerFinal extends React.Component {

  state = {
    data: {
      package: 'react-dat-gui',
      progress: 0,
      frame: 0,
      showPath: false,
      showBounds: false,
      showStatic: true,
      showMoving: true,
      feelsLike: '#2FA1D6'
    }
  };

  update = data => this.updateData(data);

  constructor(props) {
    super(props);

    this.showLargeMap = true;
    if (!this.showLargeMap) {
      this.mapImage = mapImage;
    } else {
      this.mapImage = mapImageLarge;
      VTPlayerFinalUtils.mapData.size.width = 3500;
      VTPlayerFinalUtils.mapData.size.height = 1530;
    }


    this.loadReady = this.loadReady.bind(this);
    this.playTimeline = this.playTimeline.bind(this);
    this.pauseTimeline = this.pauseTimeline.bind(this);

    this.stepForward = this.stepForward.bind(this);
    this.stepBack = this.stepBack.bind(this);

    this.shiftdown = this.shiftdown.bind(this);
    this.shiftup = this.shiftup.bind(this);

    this.shiftIsDown = false;
    Mousetrap.bind('6', this.stepForward);
    Mousetrap.bind('4', this.stepBack);
    Mousetrap.bind('shift', this.shiftdown, 'keydown');
    Mousetrap.bind('shift', this.shiftup, 'keyup');


  }

  shiftdown() {
    this.shiftIsDown = true;
  }

  shiftup() {
    this.shiftIsDown = false;
  }

  stepForward() {
    if (this.vesselTimeline.progress() < 1) {
      this.vesselTimeline.progress(this.vesselTimeline.progress() + this.timeStep);
      this.currentFrame = Math.round(this.vesselTimeline.progress() * this.trackLength);
      this.updateDebug();
    }
  }

  stepBack() {
    if (this.vesselTimeline.progress() >= this.timeStep) {
      this.vesselTimeline.progress(this.vesselTimeline.progress() - this.timeStep);
      this.currentFrame = Math.round(this.vesselTimeline.progress() * this.trackLength);
      this.updateDebug();
    }
  }

  updateDebug() {
    for (let i = 0; i < this.vesselLayer.children.length; i++) {
      const parsedFrame = this.vesselLayer.children[i].parsedTrack[this.currentFrame];
      if (parsedFrame) {
        this.vesselLayer.children[i].x = parsedFrame.x;
        this.vesselLayer.children[i].y = parsedFrame.y;
        // this.vesselLayer.children[i].children[1].rotation = data.cog * 0.0174533;
        // this.vesselLayer.children[i].children[2].rotation = data.hdg !== 511 ? data.hdg * 0.0174533 : 0;
        // this.vesselLayer.children[i].children[3].rotation = data.rot * 0.0174533;
        // this.vesselLayer.children[i].children[4].visible = data.status == 'static' ? true : false;
        // this.vesselLayer.children[i].children[5].visible = data.status == 'moored' ? true : false;
        // this.vesselLayer.children[i].children[6].visible = data.status == 'waiting' ? true : false;

        this.vesselLayer.children[i].children[1].rotation = parsedFrame.r * 0.0174533;
        // this.vesselLayer.children[i].children[2].visible = data.status == 'static' ? true : false;
        // this.vesselLayer.children[i].children[3].visible = data.status == 'moored' ? true : false;
        // this.vesselLayer.children[i].children[4].visible = data.status == 'waiting' ? true : false;
      }
    }

    this.setState({
      data: {
        ...this.state.data,
        frame: this.currentFrame
      }
    })
  }

  componentDidMount() {
    this.initialLoad();
  }

  initialLoad() {
    PIXI.loader.add(this.mapImage).load(this.loadReady);
  }

  loadReady() {
    this.initStage();

    this.mapLayer = new PIXI.Container();
    this.mapLayer.interactive = true;
    this.boundsLayer = new PIXI.Container();
    this.pathLayer = new PIXI.Container();
    this.pathLayer.blendMode = PIXI.BLEND_MODES.ADD;
    this.vesselLayer = new PIXI.Container();
    this.staticVesselLayer = new PIXI.Container();


    let sprite = new PIXI.Sprite(PIXI.loader.resources[this.mapImage].texture);
    this.mapLayer.addChild(sprite);
    this.mapLayer.on('click', (e) => {
      if (this.shiftIsDown) {
        const point = this.app.renderer.plugins.interaction.mouse.global;
        console.log(VTPlayerFinalUtils.geoFromCartesian(point.x, point.y))
      }
    });

    this.mapLayer.cacheAsBitmap = true;
    this.pathLayer.cacheAsBitmap = true;

    this.app.stage.addChild(this.mapLayer);
    this.app.stage.addChild(this.boundsLayer);
    this.app.stage.addChild(this.pathLayer);
    this.app.stage.addChild(this.staticVesselLayer);
    this.app.stage.addChild(this.vesselLayer);


    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[1], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[2], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[3], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[4], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[5], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[6], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[7], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[8], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[9], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[10], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[11], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[12], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[13], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[14], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[15], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[16], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[17], this.boundsLayer);

    this.loadDataFromAPI(this);


  }

  // ——————————————————————————————————————————————————
  // api - handling
  // ——————————————————————————————————————————————————


  loadDataFromAPI(_this) {
    const url = 'http://db.dumont.dmdr.io/v1/appdata/?day=-16';
    axios.get(url, {
      responseType: 'json',
      headers: {
        'accept': 'application/json',
      },
    }).then(function (response) {
      _this.init(response.data);
    }).catch(function (error) {
      // handle error
      console.log(error);
    }).then(function () {
      // if error debug!
    });
  }

  init(appdata) {

    this.range = {
      start: 0,
      end: appdata.vesselPool.length,
      // start: 0,
      // end: 30,
      _count: 0
    };

    this.currentFrame = 0;
    this.trackLength = 1440;
    this.timeStep = 1 / (1440);

    this.initTimeline();
    this.parseTrackData(appdata);
    // this.parseStaticData(appdata);

    this.show();
  }


  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }


  initStage() {
    this.app = new PIXI.Application({
        width: VTPlayerFinalUtils.mapData.size.width,
        height: VTPlayerFinalUtils.mapData.size.height,
        antialias: true,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );

    this.app.view.id = 'pixi-app-view';
    this.canvasWrapper.appendChild(this.app.view);

  }

  initTimeline() {
    console.log('init Timeline')
    this.vesselTimeline = new TimelineMax({
      onUpdate: () => {
        this.currentFrame = Math.round(this.state.data.progress * this.trackLength);
        this.updateDebug();
        // this.getInfoFrame(this.currentFrame);
        this.setState({
          data: {
            ...this.state.data,
            progress: this.vesselTimeline.progress(),
            frame: this.currentFrame
          }
        })
      },
      onUpdateScope: this,
      onComplete: () => {
      },
      onCompleteScope: this,
      paused: true
    });

    let o = {};
    let trackTween = TweenMax.to(o, this.trackLength, {ease: Power0.easeNone});

    this.vesselTimeline.add(trackTween, '0')

  }

  // ——————————————————————————————————————————————————
  // test optimize ...
  // ——————————————————————————————————————————————————

  getRotation(aisPosition) {
    let rotation = 0;
    if (aisPosition['hdg'] !== 511) {
      rotation = aisPosition['hdg']
    } else {
      if (aisPosition['cog'] === 0 || aisPosition['cog'] === 360) {
        rotation = 360;
      } else {
        rotation = aisPosition['cog'];
      }
    }
    return rotation
  }

  getDistance(trackPoint_1, trackPoint_2) {
    const v1 = new Vector2(trackPoint_1['lat'], trackPoint_1['lon']);
    const v2 = new Vector2(trackPoint_2['lat'], trackPoint_2['lon']);
    return Vector2.getDistance(v1, v2);
  }

  optimizeTrackData(_vesselData) {
    // console.log('optimize', _vesselData['mmsi'])

    let intersected = [];
    for (let i = 0; i < _vesselData['trackData'].length - 1; i++) {

      const currentTrackPoint = _vesselData['trackData'][i];
      const nextTrackPoint = _vesselData['trackData'][i + 1];

      // debug!
      // console.log(this.getDistance(currentTrackPoint, nextTrackPoint) > 0.01, i)

      // check for intersections
      for (let b = 0; b < this.collisionBounds.length; b++) {
        if (VTPlayerFinalUtils.isInBounds(currentTrackPoint, this.collisionBounds[b])) {
          const collisionBounds = this.collisionBounds[b];
          const line_start = VTPlayerFinalUtils.getVectorFromGeoPoint(currentTrackPoint.lat, currentTrackPoint.lon);
          const line_end = VTPlayerFinalUtils.getVectorFromGeoPoint(nextTrackPoint.lat, nextTrackPoint.lon);
          const intersecting = VTPlayerFinalUtils.lineIntersecting(collisionBounds.collisionLineStart, collisionBounds.collisionLineEnd, line_start, line_end);
          if (intersecting) {
            // console.log('intersected', _vesselData['mmsi'], Vector2.getDistance(collisionBounds.collisionLineStart, intersecting));
            intersected.push({
              index: i,
              intersecting: intersecting,
              type: collisionBounds.type || 1,
              bounds: collisionBounds,
              crossDistance: Vector2.getDistance(collisionBounds.collisionLineStart, intersecting)
            });
          }
        }
      }

    }

    // handle intersected
    // maybe offset points parallel to intersecting trackLine ...
    let minDistance = 5; // = 15m (4K projected 1m = .333px)
    if (intersected.length > 0) {
      let io = {};
      for (let j = 0; j < intersected.length; j++) {
        io = intersected[j];
        const v1 = VTPlayerFinalUtils.getVectorFromGeoPoint(_vesselData['trackData'][io.index].lat, _vesselData['trackData'][io.index].lon);
        const v2 = VTPlayerFinalUtils.getVectorFromGeoPoint(_vesselData['trackData'][io.index + 1].lat, _vesselData['trackData'][io.index + 1].lon);
        VTPlayerFinalUtils.plotPoint(this.boundsLayer, v1, 0xffffff);
        VTPlayerFinalUtils.plotPoint(this.boundsLayer, v2, 0xffffff);


        // console.log('=>', io);
        const lineIntersectStart = Vector2.subtract(io.bounds.collisionLineStart, io.intersecting)
        let collision_dir = new Vector2();

        // ——————————————————————————————————————————————————
        // offset points 90° =>  to origin line
        // ——————————————————————————————————————————————————

        if (io.type === 1) {
          collision_dir = lineIntersectStart.normalize();
        }

        // ——————————————————————————————————————————————————
        // offset points => cross line direction
        // ——————————————————————————————————————————————————

        // if (io.type === 2) {
        //   collision_dir = Vector2.subtract(io.bounds.collisionLineStart, io.bounds.collisionLineEnd).normalize();
        // }
        //
        // if (io.type === 3) {
        //   const line_dir = Vector2.subtract(v1, v2).normalize();
        //   // cross-product
        //   collision_dir = new Vector2(-line_dir.y, line_dir.x);
        //   if (Vector2.getAngleRAD(line_dir) < 0) collision_dir.negate();
        // }

        // ——————————————————————————————————————————————————
        // do nothing!
        // ——————————————————————————————————————————————————

        if (io.type === 0) {
          console.log('spdm')
          return
        }


        const v1_new = v1.add(collision_dir.multiplyScalar(io.crossDistance + minDistance));
        const v2_new = v2.add(collision_dir.normalize().multiplyScalar(io.crossDistance + minDistance));

        VTPlayerFinalUtils.plotPoint(this.boundsLayer, v1_new, 0x00ff00);
        VTPlayerFinalUtils.plotPoint(this.boundsLayer, v2_new, 0x00ff00);

        // convert back from cartesian to lat/long
        const newGeoPoint1 = VTPlayerFinalUtils.geoFromCartesian(v1_new.x, v1_new.y);
        const newGeoPoint2 = VTPlayerFinalUtils.geoFromCartesian(v2_new.x, v2_new.y);

        // overwrite old geo-coordinates
        _vesselData['trackData'][io.index].lat = newGeoPoint1[0];
        _vesselData['trackData'][io.index].lon = newGeoPoint1[1];
        _vesselData['trackData'][io.index + 1].lat = newGeoPoint2[0];
        _vesselData['trackData'][io.index + 1].lon = newGeoPoint2[1];
      }
    }
  }

  correctRotationTrackData(_vesselData) {

    // console.log('=== correctRotationTrackData ===', _vesselData['mmsi']);

    let startReplace = 0;
    let endReplace = 0;
    let setAtStart = false;
    let lastValidRotation = 0;
    let _tempRotationBeforeMoored = 0;

    for (let i = 0; i < _vesselData['trackData'].length; i++) {

      const currentTrackPoint = _vesselData['trackData'][i];
      const currentRotation = this.getRotation(currentTrackPoint);
      const nextTrackPoint = (i < _vesselData['trackData'].length - 1) ? _vesselData['trackData'][i + 1] : null;
      const nextRotation = nextTrackPoint != null ? this.getRotation(nextTrackPoint) : null;

      if (currentRotation !== 360) {
        lastValidRotation = currentRotation;
      }
      _vesselData['trackData'][i]['rot'] = lastValidRotation;


      if (nextRotation != null) {

        // if rotation at start == zero => fill with next valid value
        if (currentRotation === 360 && nextRotation === 360 && !setAtStart && i === 0) {
          setAtStart = true;
          startReplace = i;
        }

        if (nextRotation !== 360 && setAtStart) {
          endReplace = i;
          for (let j = startReplace; j < endReplace + 1; j++) {
            _vesselData['trackData'][j]['rot'] = nextRotation;
          }
          setAtStart = false;
        }

        // if next zero => replace with latest valid
        if (nextRotation === 360) _vesselData['trackData'][i + 1]['rot'] = lastValidRotation;


        if (currentTrackPoint['status'] !== 'moored' && nextTrackPoint['status'] === 'moored') {
          _tempRotationBeforeMoored = currentRotation;
        }

        if (currentTrackPoint['status'] === 'moored' && nextTrackPoint['status'] === 'moored') {
          if (_tempRotationBeforeMoored !== 0) _vesselData['trackData'][i]['rot'] = _tempRotationBeforeMoored;

        }

        if (currentTrackPoint['status'] === 'moored' && nextTrackPoint['status'] !== 'moored') {
          _tempRotationBeforeMoored = 0;
          _vesselData['trackData'][i]['rot'] = currentRotation;
        }

      }


    }

  }

  parseTrackData(_data) {
    let validCounter = 0;


    console.log('moving:', _data.vesselPool.length);

    for (let i = 0; i < _data.vesselPool.length; i++) {

      if (validCounter >= this.range.start) {
        if (validCounter < this.range.end) {

          // ——————————————————————————————————————————————————
          // debug optimizations ...
          // ——————————————————————————————————————————————————
          // this.optimizeTrackData(_data.vesselPool[i]);
          // this.correctRotationTrackData(_data.vesselPool[i]);


          this.initVessel(_data.vesselPool[i], validCounter, this.range._count);
          this.range._count++;
        }
      }

      validCounter++;
    }

    // save Debug
    // let data = new Blob([JSON.stringify(trackData)], {type: "application/json"});
    // saveAs(data, "vesselData.json");

    this.updateDebug();

  }

  plotStaticVessel(_vesselData) {
    let vessel = new PIXI.Container();
    let vesselGraphics = new PIXI.Graphics();
    const vesselType = _vesselData['aisStatic']['type'];
    // const vesselColor = this.getColorByType(vesselType);
    const vesselColor = 0x000000;
    vesselGraphics.beginFill(vesselColor);
    vesselGraphics.drawCircle(0, 0, 1);
    vesselGraphics.endFill();
    vessel.addChild(vesselGraphics);

    VTPlayerFinalUtils.plotLine(vessel, new Vector2(0, 0), new Vector2(0, -10), 0xff0000, 1);
    if (_vesselData['aisPosition'].rot === 360) vessel.alpha = .3;
    vessel.children[1].rotation = _vesselData['aisPosition'].rot * 0.0174533;

    let position = VTPlayerFinalUtils.cartesianFromLatLong(_vesselData['aisPosition'].x, _vesselData['aisPosition'].y);
    vessel.x = position[0];
    vessel.y = position[1];
    this.staticVesselLayer.addChild(vessel);

    vessel.data = _vesselData;
    vessel.interactive = true;
    vessel.cursor = 'pointer';
    vessel.on('click', (event) => {
      console.log(event.target.data);
    });
  }

  parseStaticData(_data) {
    const staticVessels = _data['meta']['staticVessels'];
    console.log('static:', staticVessels.length);
    for (let i = 0; i < staticVessels.length; i++) {
      this.plotStaticVessel(staticVessels[i])
    }
  }

  initVessel(_vesselData, _count, _index) {
    // console.log(_count, _index)

    let vessel = new PIXI.Container();

    const vesselType = _vesselData['aisStatic']['type'];
    const vesselColor = this.getColorByType(vesselType);
    // if (_vesselData['mmsi'] == 211437270) vesselColor = 0xf3d611;

    let vesselGraphics = new PIXI.Graphics();
    vesselGraphics.beginFill(vesselColor);
    vesselGraphics.drawCircle(0, 0, 4);
    vesselGraphics.endFill();
    vessel.addChild(vesselGraphics);

    // VTPlayerFinalUtils.plotLine(vessel, new Vector2(0, 0), new Vector2(0, -25), 0xff0000, 1); // cog
    // VTPlayerFinalUtils.plotLine(vessel, new Vector2(0, 0), new Vector2(0, -25), 0x00ff00, 1); // hdg
    VTPlayerFinalUtils.plotLine(vessel, new Vector2(0, 0), new Vector2(0, -15), 0x0000ff, 1); // rot
    VTPlayerFinalUtils.plotPoint(vessel, new Vector2(0, 0), 0xf3b611, 2);
    VTPlayerFinalUtils.plotPoint(vessel, new Vector2(0, 0), 0xff0000, 2);
    VTPlayerFinalUtils.plotPoint(vessel, new Vector2(0, 0), 0x0000ff, 2);

    this.vesselLayer.addChild(vessel);

    vessel.data = _vesselData;
    vessel.count = _count;
    vessel.interactive = true;
    vessel.cursor = 'pointer';
    vessel.on('click', (event) => {
      console.log(event.target.data);
      console.log(event.target.count)
    });

    // parse Track
    let parsedTrack = [];
    for (let p = 0; p < 1440; p++) {
      parsedTrack[p] = undefined;
    }

    for (let i = 0; i < _vesselData['trackData'].length; i++) {
      let pointColor = 0x000000;
      let currentTrackPoint = _vesselData['trackData'][i];
      let nextTrackPoint = _vesselData['trackData'][i + 1];
      let currentPosition = VTPlayerFinalUtils.cartesianFromLatLong(currentTrackPoint.x, currentTrackPoint.y);

      let frame = Math.round(currentTrackPoint.t * 1440)
      // console.log(frame, i)
      if (frame >= 0) {
        parsedTrack[frame] = {x: currentPosition[0], y: currentPosition[1], r: currentTrackPoint.r || undefined};
      }

      // plot points
      VTPlayerFinalUtils.plotPoint(this.pathLayer, new Vector2(currentPosition[0], currentPosition[1]), pointColor, 1);

      // plot path

      if (i < _vesselData['trackData'].length - 1) {
        VTPlayerFinalUtils.plotLine(this.pathLayer,
          VTPlayerFinalUtils.getVectorFromGeoPoint(currentTrackPoint.x, currentTrackPoint.y),
          VTPlayerFinalUtils.getVectorFromGeoPoint(nextTrackPoint.x, nextTrackPoint.y),
          0x295b29, 1, 1, PIXI.BLEND_MODES.NORMAL
        );
      }

    }

    vessel.parsedTrack = parsedTrack;

    // vessel.x = parsedTrack[0].x;
    // vessel.y = parsedTrack[0].y;

    // if (_index === 0) {
    //   let trackTween = TweenMax.to(vessel, this.trackLength, {
    //     bezier: {
    //       curviness: 0,
    //       type: 'thru',
    //       values: parsedTrack,
    //       autoRotate: false
    //     },
    //     ease: Power0.easeNone
    //   });
    //
    //   this.vesselTimeline.add(trackTween, '0')
    // }

  }

  getColorByType(type) {
    let color = 0x000000;
    switch (type) {
      case 'pleasure_crafts':
        color = 0x971fae;
        break;
      case 'tankships':
        color = 0x6636B8;
        break;
      case 'cargo_ships':
        color = 0x444EB4;
        break;
      case 'passenger_ships':
        color = 0x3B95F2;
        break;
      case 'sailing_vessels':
        color = 0x3DA8F2;
        break;
      case 'tugboats':
        color = 0x42BCD5;
        break;
      case 'dredgers':
        color = 0x329788;
        break;
      case 'pilot_vessels':
        color = 0x59B154;
        break;
      case 'ekranoplans':
        color = 0x91C74F;
        break;
      case 'towing_vessels':
        color = 0xCEDE40;
        break;
      case 'rescue_vessels':
        color = 0xFBEC42;
        break;
      case 'coast_guard_ships':
        color = 0xF8C132;
        break;
      case 'high-speed_crafts':
        color = 0xF59828;
        break;
      case 'others':
        color = 0xF4551E;
        break;
    }
    return color;
  }

  playTimeline() {
    this.vesselTimeline.play();
  }

  pauseTimeline() {
    this.vesselTimeline.pause();
  }

  updateData(data) {
    this.setState({data})
    this.vesselTimeline.progress(data.progress);
  }

  render() {
    const {data} = this.state;
    if (this.pathLayer) this.pathLayer.visible = data.showPath;
    if (this.boundsLayer) this.boundsLayer.visible = data.showBounds;
    if (this.staticVesselLayer) this.staticVesselLayer.visible = data.showStatic;
    if (this.vesselLayer) this.vesselLayer.visible = data.showMoving;

    return (
      <div className={'wrapper'}>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <DatGui data={data} onUpdate={this.update}>
          <DatNumber path='progress' label='progress' min={0} max={1} step={0.01}/>
          <DatNumber path='frame' label='frame'/>
          <DatButton label="Play" onClick={this.playTimeline}/>
          <DatButton label="Pause" onClick={this.pauseTimeline}/>
          <DatBoolean path='showPath' label='showPath'/>
          <DatBoolean path='showBounds' label='showBounds'/>
          <DatBoolean path='showStatic' label='showStatic'/>
          <DatBoolean path='showMoving' label='showMoving'/>
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

export default connect(mapStateToProps, {})(VTPlayerFinal);

