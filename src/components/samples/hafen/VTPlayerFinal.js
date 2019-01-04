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
      const data = this.vesselLayer.children[i].data.trackData[this.currentFrame];
      this.vesselLayer.children[i].x = this.vesselLayer.children[i].parsedTrack[this.currentFrame].x;
      this.vesselLayer.children[i].y = this.vesselLayer.children[i].parsedTrack[this.currentFrame].y;
      // this.vesselLayer.children[i].children[1].rotation = data.cog * 0.0174533;
      // this.vesselLayer.children[i].children[2].rotation = data.hdg !== 511 ? data.hdg * 0.0174533 : 0;
      // this.vesselLayer.children[i].children[3].rotation = data.rot * 0.0174533;
      // this.vesselLayer.children[i].children[4].visible = data.status == 'static' ? true : false;
      // this.vesselLayer.children[i].children[5].visible = data.status == 'moored' ? true : false;
      // this.vesselLayer.children[i].children[6].visible = data.status == 'waiting' ? true : false;
      this.vesselLayer.children[i].children[1].rotation = data.r * 0.0174533;
      this.vesselLayer.children[i].children[2].visible = data.status == 'static' ? true : false;
      this.vesselLayer.children[i].children[3].visible = data.status == 'moored' ? true : false;
      this.vesselLayer.children[i].children[4].visible = data.status == 'waiting' ? true : false;
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
      if(this.shiftIsDown) {
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

    this.collisionBounds = [
      {
        index: 0,
        minLong: 9.949696544325088,
        maxLong: 9.954310934570312,
        minLat: 53.54292959464058,
        maxLat: 53.53728326430859,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.540694, 9.951064),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.540894, 9.954155)
      },
      {
        index: 1,
        minLong: 9.951390,
        maxLong: 9.955178025806568,
        minLat: 53.539734,
        maxLat: 53.53755770742224,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.538943, 9.952549),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.538745, 9.954598)
      },
      {
        index: 2,
        minLong: 9.932996296296295,
        maxLong: 9.939025925925925,
        minLat: 53.54105922150139,
        maxLat: 53.536557275254864,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53964556655106, 9.934604198088469),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.539254092964406, 9.937783457347729)
      },
      {
        index: 3,
        minLong: 9.966835310872396,
        maxLong: 9.9716590145761,
        minLat: 53.5259657392189,
        maxLat: 53.52300793812268,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.52502303119297, 9.970970136796875),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.52376913809082, 9.968077777777777)
      },
      {
        index: 4,
        minLong: 9.955506914695457,
        maxLong: 9.961207655436198,
        minLat: 53.52716190917516,
        maxLat: 53.52398662208932,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.526096230414446, 9.95748024802879),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.52466082726338, 9.957516792353877)
      },
      {
        index: 5,
        minLong: 9.96731037037037,
        maxLong: 9.97059925925926,
        minLat: 53.54338631382501,
        maxLat: 53.54064599871843,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.54214904385088, 9.969065072851564),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.54060741132903, 9.967768003710939)
      },
      {
        index: 6,
        minLong: 9.953277777777778,
        maxLong: 9.958064940502025,
        minLat: 53.53288177258312,
        maxLat: 53.5291410243136,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53179434661724, 9.955214570131655),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53061992585727, 9.957991851851851)
      },
      {
        index: 7,
        minLong: 9.952912347909432,
        maxLong: 9.958868888888889,
        minLat: 53.53629629286376,
        maxLat: 53.53242505339869,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53504307901618, 9.955608003710939),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53395911839082, 9.958202134570312)
      },
      {
        index: 8,
        minLong: 9.876089708398439,
        maxLong: 9.88317493828125,
        minLat: 53.54192619575445,
        maxLat: 53.53745188114098,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.540222003474234, 9.878594669140625),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.539733170097705, 9.883069548398439)
      },
      {
        index: 9,
        minLong: 9.902533656796876,
        maxLong: 9.909359469140625,
        minLat: 53.54138637469586,
        maxLat: 53.53569345649406,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53942952046267, 9.90503051359375),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53926082725061, 9.90996747359375),
      },
      {
        index: 10,
        minLong: 9.973920960000001,
        maxLong: 9.978995745703125,
        minLat: 53.54142011302939,
        maxLat: 53.53605477559985,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53892343773761, 9.97823371359375),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53663288793337, 9.976117872851564),
      },
      {
        index: 11,
        minLong: 9.996789872851563,
        maxLong: 10.003518411132813,
        minLat: 53.5420286045165,
        maxLat: 53.537572320475356,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53913804284887, 10.001734934570313),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.54125778770425, 9.998816534570313),
      },
      {
        index: 12,
        minLong: 9.981752003710938,
        maxLong: 9.987791472851564,
        minLat: 53.54231766068327,
        maxLat: 53.539692066433396,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.541498667475665, 9.982805872851563),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.54171545960074, 9.987142934570313),
      },
      {
        index: 13,
        minLong: 9.938948803710938,
        maxLong: 9.947014934570314,
        minLat: 53.516061723697845,
        maxLat: 53.51300254740315,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.51521864394656, 9.942150934570313),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.512833930570764, 9.943083203710938),
      },
      {
        index: 14,
        minLong: 9.952568003710939,
        maxLong: 9.958891203710937,
        minLat: 53.5060411084465,
        maxLat: 53.50233155577659,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.504884883779454, 9.955081072851563),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.50411407027518, 9.959377603710939),
      },
      {
        index: 15,
        minLong: 9.976847472851563,
        maxLong: 9.980819734570312,
        minLat: 53.540366531557616,
        maxLat: 53.535693455391396,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53906577880718, 9.979522672851562),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.5366088013897, 9.977739203710938),
      },
      {
        index: 16,
        minLong: 9.990628811132813,
        maxLong: 9.997803211132814,
        minLat: 53.536536537348006,
        maxLat: 53.53270654313839,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53480220034742, 9.992858134570312),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.53316421393222, 9.995817072851564),
      },
      {
        index: 17,
        minLong: 9.974699203710937,
        maxLong: 9.982522134570313,
        minLat: 53.52617869063722,
        maxLat: 53.5239625940938,
        collisionLineStart: VTPlayerFinalUtils.getVectorFromGeoPoint(53.525431961471305, 9.979076803710939),
        collisionLineEnd: VTPlayerFinalUtils.getVectorFromGeoPoint(53.52427573680425, 9.979522672851562),
      }
    ];




    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[1], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[2], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[3], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[4], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[5], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[6], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[7], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[8], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[9], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[10], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[11], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[12], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[13], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[14], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[15], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[16], this.boundsLayer);
    VTPlayerFinalUtils.plotCollisionBounds(this.collisionBounds[17], this.boundsLayer);

    this.loadDataFromAPI(this);


  }

  // ——————————————————————————————————————————————————
  // api - handling
  // ——————————————————————————————————————————————————


  loadDataFromAPI(_this) {
    const url = 'http://db.dumont.dmdr.io/v1/appdata/?day=0';
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
    console.log('appdata: ',appdata.meta);

    this.range = {
      start: 0,
      end: appdata.vesselPool.length,
      // start: 44,
      // end:45,
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
    for (let i = 0; i < _vesselData['trackData'].length; i++) {
      let pointColor = 0x000000;
      let currentTrackPoint = _vesselData['trackData'][i];
      let nextTrackPoint = _vesselData['trackData'][i + 1];
      let currentPosition = VTPlayerFinalUtils.cartesianFromLatLong(currentTrackPoint.x, currentTrackPoint.y);
      parsedTrack[i] = {x: currentPosition[0], y: currentPosition[1], status: '*'};

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

    vessel.x = parsedTrack[0].x;
    vessel.y = parsedTrack[0].y;

    if (_index === 0) {
      let trackTween = TweenMax.to(vessel, this.trackLength, {
        bezier: {
          curviness: 0,
          type: 'thru',
          values: parsedTrack,
          autoRotate: false
        },
        ease: Power0.easeNone
      });

      this.vesselTimeline.add(trackTween, '0')
    }

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

