import React from 'react';
import connect from "react-redux/es/connect/connect";
import 'gsap/TweenMax';
import 'gsap/TimelineMax';
import 'react-dat-gui/build/react-dat-gui.css';
import DatGui, {DatBoolean, DatButton, DatColor, DatNumber, DatString} from 'react-dat-gui';
import * as PIXI from 'pixi.js'
import CloseIcon from 'core/icons/close.inline.svg';
import '../Scene.scss'
import {Vector2} from "../../../utils/vector2";


import vesselTrackerRange from 'components/samples/hafen/images/ProtoRange.png';

const trackData = require("./trackData/lastTrack60.json");


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class TrackPlayer extends React.Component {

  state = {
    data: {
      package: 'react-dat-gui',
      progress: 0,
      showPath: true,
      feelsLike: '#2FA1D6',
    }
  };

  update = data => this.updateData(data);

  constructor(props) {
    super(props);

    this.loadReady = this.loadReady.bind(this);
    this.playTimeline = this.playTimeline.bind(this);
    this.pauseTimeline = this.pauseTimeline.bind(this);

    // this.GeoBounds = {
    //   minLong: 9.7538,
    //   maxLong: 10.0948,
    //   minLat: 53.5743,
    //   maxLat: 53.4605
    // };

    this.GeoBounds = {
      minLong: 9.9174,
      maxLong: 9.9761,
      minLat: 53.5497,
      maxLat: 53.5150
    };

    this.mapRange = {
      minLong: 9.9174,
      maxLong: 9.9761,
      minLat: 53.5497,
      maxLat: 53.5150
    };


    this.collisionBounds = {
      minLong: 9.94979,
      maxLong: 9.95385,
      minLat: 53.54188,
      maxLat: 53.53949,
      lineStart: {
        lat: 53.540703,
        long: 9.951194
      },
      lineEnd: {
        lat: 53.540894,
        long: 9.954155
      },
      collisionLineStart: new Vector2(),
      collisionLineEnd: new Vector2()
    };

    this.mapData = {
      size: {
        width: 1080,
        height: 1074
      }
    };


    this.trackLength = 60;

  }

  plotGeoRect() {

    // let display = new PIXI.Text(_vesselData['mmsi'], {fontFamily: 'Segoe UI', fontSize: 10, fill: 0xcc660000, align: 'center'});

    let topLeft = this.cartesianFromLatLong(this.collisionBounds.minLat, this.collisionBounds.minLong);
    let topRight = this.cartesianFromLatLong(this.collisionBounds.minLat, this.collisionBounds.maxLong);
    let bottomRight = this.cartesianFromLatLong(this.collisionBounds.maxLat, this.collisionBounds.maxLong);
    let bottomLeft = this.cartesianFromLatLong(this.collisionBounds.maxLat, this.collisionBounds.minLong);

    let shape = new PIXI.Graphics();
    shape.beginFill(0xc30000, .1);
    shape.lineStyle(.5, 0x062f3c);
    shape.drawRect(topLeft[0], topLeft[1], topRight[0] - topLeft[0], bottomLeft[1] - topLeft[1]);
    shape.endFill();
    this.app.stage.addChild(shape);

    for (let i = 0; i <= 3; i++) {
      let point = new PIXI.Graphics();
      point.beginFill(0x000000);
      point.drawCircle(0, 0, 1.5);
      point.endFill();

      let pos = [];
      switch (i) {
        case 0:
          pos = topLeft;
          break;
        case 1:
          pos = topRight;
          break;
        case 2:
          pos = bottomRight;
          break;
        case 3:
          pos = bottomLeft;
          break;
      }

      point.x = pos[0];
      point.y = pos[1];
      this.app.stage.addChild(point);
    }

    let lineStart = this.cartesianFromLatLong(this.collisionBounds.lineStart.lat, this.collisionBounds.lineStart.long);
    let lineEnd = this.cartesianFromLatLong(this.collisionBounds.lineEnd.lat, this.collisionBounds.lineEnd.long);

    let pStart = new PIXI.Graphics();
    pStart.beginFill(0x000000);
    pStart.drawCircle(0, 0, 1.5);
    pStart.endFill();
    pStart.x = lineStart[0];
    pStart.y = lineStart[1];
    this.app.stage.addChild(pStart);

    let pEnd = new PIXI.Graphics();
    pEnd.beginFill(0x000000);
    pEnd.drawCircle(0, 0, 1.5);
    pEnd.endFill();
    pEnd.x = lineEnd[0];
    pEnd.y = lineEnd[1];
    this.app.stage.addChild(pEnd);

    this.collisionBounds.collisionLineStart = new Vector2(lineStart[0], lineStart[1]);
    this.collisionBounds.collisionLineEnd = new Vector2(lineEnd[0], lineEnd[1]);

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

    this.pathGraphics = new PIXI.Container();
    this.vesselGraphics = new PIXI.Container();

    this.app.stage.addChild(this.pathGraphics);
    this.app.stage.addChild(this.vesselGraphics);

    this.plotGeoRect();

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
      start: 10,
      end: 11,
      _count: 0
    };

    for (let i = 0; i < _data.vesselPool.length; i++) {

      let hasMoved = _data.vesselPool[i]['hasMoved'];
      let inMapRange = _data.vesselPool[i]['inMapRange'];
      let validData = _data.vesselPool[i]['valid'];
      validData = true;

      if (hasMoved && inMapRange && validData) {
        if (validCounter >= range.start) {
          if (validCounter < range.end) {
            this.initVessel(_data.vesselPool[i], validCounter);
            range._count++;
          }
        }
        validCounter++;
      }
    }

    console.log('valid vessels: ', validCounter);
  }


  lineIntersecting(l1_start, l1_end, l2_start, l2_end) {
    // l1_start = new Vector2(1, 1);
    // l1_end = new Vector2(2, 1);
    // l2_start = new Vector2(1, .25);
    // l2_end = new Vector2(1.8, 1.6);

    let isIntersecting = false;


    //Direction of the lines
    let l1_dir = Vector2.subtract(l1_end, l1_start).normalize();
    let l2_dir = Vector2.subtract(l2_end, l2_start).normalize();

    //If we know the direction we can get the normal vector to each line
    let l1_normal = new Vector2(-l1_dir.y, l1_dir.x);
    let l2_normal = new Vector2(-l2_dir.y, l2_dir.x);

    //Step 1: Rewrite the lines to a general form: Ax + By = k1 and Cx + Dy = k2
    //The normal vector is the A, B
    let A = l1_normal.x;
    let B = l1_normal.y;

    let C = l2_normal.x;
    let D = l2_normal.y;

    //To get k we just use one point on the line
    let k1 = (A * l1_start.x) + (B * l1_start.y);
    let k2 = (C * l2_start.x) + (D * l2_start.y);

    //Step 4: calculate the intersection point -> one solution
    let x_intersect = (D * k1 - B * k2) / (A * D - B * C);
    let y_intersect = (-C * k1 + A * k2) / (A * D - B * C);

    let intersectPoint = new Vector2(x_intersect, y_intersect);
    // console.log(intersectPoint)


    const IsBetween = (a, b, c) => {
      let isBetween = false;

      //Entire line segment
      let ab = Vector2.subtract(b, a);
      //The intersection and the first point
      let ac = Vector2.subtract(c, a);

      //Need to check 2 things:
      //1. If the vectors are pointing in the same direction = if the dot product is positive
      //2. If the length of the vector between the intersection and the first point is smaller than the entire line
      if (ab.dot(ac) > 0 && ab.lengthSq() >= ac.lengthSq()) {
        isBetween = true;
      }

      return isBetween;
    };

    if (IsBetween(l1_start, l1_end, intersectPoint) && IsBetween(l2_start, l2_end, intersectPoint)) {
      console.log("We have an intersection point!");

      isIntersecting = true;
    }

    return isIntersecting ? intersectPoint : new Vector2();


  }


  initVessel(_vesselData, _count) {

    let vessel = new PIXI.Container();
    let display = new PIXI.Text(_vesselData['mmsi'], {fontFamily: 'Segoe UI', fontSize: 10, fill: 0xff0000, align: 'center'});
    let vesselGraphics = new PIXI.Graphics();
    vesselGraphics.beginFill(0x1f164f);
    vesselGraphics.drawCircle(0, 0, 2);
    // vesselGraphics.drawPolygon([0, -5, 4, 5, -4, 5]);
    vesselGraphics.endFill();

    vessel.addChild(vesselGraphics);
    if (!_vesselData['valid']) {
      vessel.addChild(display);
    }
    this.vesselGraphics.addChild(vessel);

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
    let intersected = [];

    for (let i = 0; i < _vesselData['trackData'].length; i++) {
      let pos = this.cartesianFromLatLong(_vesselData['trackData'][i].lat, _vesselData['trackData'][i].lon);
      parsedTrack[i] = {x: pos[0], y: pos[1], status: _vesselData['trackData'].status};


      let pointColor = 0xff0000;
      if (
        _vesselData['trackData'][i].lat < this.collisionBounds.minLat && _vesselData['trackData'][i].lat > this.collisionBounds.maxLat &&
        _vesselData['trackData'][i].lon > this.collisionBounds.minLong && _vesselData['trackData'][i].lon < this.collisionBounds.maxLong
      ) {
        // if point is in collide Bounds
        pointColor = 0x00ff00;

        let pStart = this.cartesianFromLatLong(_vesselData['trackData'][i].lat, _vesselData['trackData'][i].lon);
        let pEnd = this.cartesianFromLatLong(_vesselData['trackData'][i + 1].lat, _vesselData['trackData'][i + 1].lon);
        let l2_start = new Vector2(pStart[0], pStart[1]);
        let l2_end = new Vector2(pEnd[0], pEnd[1]);

        let intersecting = this.lineIntersecting(this.collisionBounds.collisionLineStart, this.collisionBounds.collisionLineEnd, l2_start, l2_end);
        console.log(i, intersecting)

        if (intersecting.x != 0 && intersecting.y != 0) {
          pointColor = 0xf5e211;
          intersected.push({
            index: i,
            crossDistance: Vector2.getDistance(this.collisionBounds.collisionLineStart, intersecting)
          })
          // console.log(parsedTrack[i]);
          // parsedTrack[i].x -= 10;
          // parsedTrack[i+1].x -= 10;
        }

      }


      let point = new PIXI.Graphics();
      point.beginFill(pointColor);
      point.drawCircle(0, 0, 1.5);
      point.endFill();
      point.x = pos[0];
      point.y = pos[1];
      this.pathGraphics.addChild(point);

      if (i < _vesselData['trackData'].length - 1) {
        let line = new PIXI.Graphics();
        line.lineStyle(1, 0x136c0e, 1);
        line.moveTo(pos[0], pos[1]);
        let nextPos = this.cartesianFromLatLong(_vesselData['trackData'][i + 1].lat, _vesselData['trackData'][i + 1].lon);
        line.lineTo(nextPos[0], nextPos[1]);
        this.pathGraphics.addChild(line);
      }

    }

    console.log(intersected)

    if (intersected.length > 0) {
      for (let j = 0; j < intersected.length; j++) {
        // parsedTrack[intersected[j].index].x -= intersected[j].crossDistance;
        // parsedTrack[intersected[j].index + 1].x -= intersected[j].crossDistance;
        // console.log(intersected[j].crossDistance)

        // Vector3 newSpot = oldSpotVector3 + (directionVector3.normalized * distanceFloat);
        let v1 = new Vector2(parsedTrack[intersected[j].index].x, parsedTrack[intersected[j].index].y)
        let v2 = new Vector2(parsedTrack[intersected[j].index + 1].x, parsedTrack[intersected[j].index + 1].y)
        let collision_dir = Vector2.subtract(this.collisionBounds.collisionLineStart, this.collisionBounds.collisionLineEnd).normalize();
        let v1Offset = v1.add(collision_dir.multiplyScalar(intersected[j].crossDistance));
        let v2Offset = v2.add(collision_dir.multiplyScalar(intersected[j].crossDistance));
        parsedTrack[intersected[j].index].x = v1Offset.x;
        parsedTrack[intersected[j].index].y = v1Offset.y;
        parsedTrack[intersected[j].index + 1].x = v2Offset.x;
        parsedTrack[intersected[j].index + 1].y = v2Offset.y;
      }
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
      ease: Power0.easeNone
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
    if (this.pathGraphics) this.pathGraphics.visible = data.showPath;

    return (
      <div className={'wrapper'}>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <DatGui data={data} onUpdate={this.update}>
          <DatNumber path='progress' label='progress' min={0} max={1} step={0.01}/>
          <DatButton label="Play" onClick={this.playTimeline}/>
          <DatButton label="Pause" onClick={this.pauseTimeline}/>
          <DatBoolean path='showPath' label='displayPath'/>
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

