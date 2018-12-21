import {Vector2} from "../../../../../utils/vector2";
import * as PIXI from "pixi.js";

const VTPlayerFinalUtils = {};

VTPlayerFinalUtils.GeoBounds = {
  minLong: 9.7841,
  maxLong: 10.0158,
  minLat: 53.5550,
  maxLat: 53.4948
};

VTPlayerFinalUtils.mapData = {
  size: {
    width: 3500,
    height: 1530
  }
};

VTPlayerFinalUtils.vesselTypes = [
  'pleasure_crafts',
  'tankships',
  'cargo_ships',
  'passenger_ships',
  'sailing_vessels',
  'tugboats',
  'dredgers',
  'pilot_vessels',
  'ekranoplans',
  'towing_vessels',
  'rescue_vessels',
  'coast_guard_ships',
  'high-speed_crafts',
  'others'
];

VTPlayerFinalUtils.getVectorFromGeoPoint = (lat, long) => {
  const pos = VTPlayerFinalUtils.cartesianFromLatLong(lat, long);
  return new Vector2(pos[0], pos[1])
};

VTPlayerFinalUtils.cartesianFromLatLong = (lat, long) => {
  const x = (long - VTPlayerFinalUtils.GeoBounds.minLong) / (VTPlayerFinalUtils.GeoBounds.maxLong - VTPlayerFinalUtils.GeoBounds.minLong) * VTPlayerFinalUtils.mapData.size.width;
  const y = (lat - VTPlayerFinalUtils.GeoBounds.minLat) / (VTPlayerFinalUtils.GeoBounds.maxLat - VTPlayerFinalUtils.GeoBounds.minLat) * VTPlayerFinalUtils.mapData.size.height
  return [x, y];
};

VTPlayerFinalUtils.geoFromCartesian = (x, y) => {
  const lat = VTPlayerFinalUtils.GeoBounds.minLat + (y / VTPlayerFinalUtils.mapData.size.height * (VTPlayerFinalUtils.GeoBounds.maxLat - VTPlayerFinalUtils.GeoBounds.minLat))
  const long = VTPlayerFinalUtils.GeoBounds.minLong + (x / VTPlayerFinalUtils.mapData.size.width * (VTPlayerFinalUtils.GeoBounds.maxLong - VTPlayerFinalUtils.GeoBounds.minLong))
  return [lat, long]
};

VTPlayerFinalUtils.plotPoint = (layer, vPos, color = 0xffffff, r = 1.5) => {
  let point = new PIXI.Graphics();
  point.beginFill(color);
  point.drawCircle(0, 0, r);
  point.endFill();
  point.x = vPos.x;
  point.y = vPos.y;
  layer.addChild(point);
};

VTPlayerFinalUtils.plotLine = (layer, v1, v2, color = 0xffffff, width = 1, alpha = 1, blendMode = PIXI.BLEND_MODES.NORMAL) => {
  let line = new PIXI.Graphics();
  line.blendMode = blendMode;
  line.lineStyle(width, color, alpha);
  line.moveTo(v1.x, v1.y);
  line.lineTo(v2.x, v2.y);
  layer.addChild(line);
};

VTPlayerFinalUtils.plotCollisionBounds = (boundsObject, layer) => {
  if (boundsObject) {
    let topLeft = VTPlayerFinalUtils.cartesianFromLatLong(boundsObject.minLat, boundsObject.minLong);
    let topRight = VTPlayerFinalUtils.cartesianFromLatLong(boundsObject.minLat, boundsObject.maxLong);
    let bottomRight = VTPlayerFinalUtils.cartesianFromLatLong(boundsObject.maxLat, boundsObject.maxLong);
    let bottomLeft = VTPlayerFinalUtils.cartesianFromLatLong(boundsObject.maxLat, boundsObject.minLong);

    let display = new PIXI.Text(boundsObject.index, {fontFamily: 'Arial', fontSize: 15, fill: 0xffffff, align: 'center'});
    display.x = topLeft[0];
    display.y = topLeft[1] - 17;

    let container = new PIXI.Container();
    let shape = new PIXI.Graphics();
    // shape.beginFill(0xc30000, .1);
    shape.lineStyle(.5, 0x062f3c);
    shape.drawRect(topLeft[0], topLeft[1], topRight[0] - topLeft[0], bottomLeft[1] - topLeft[1]);
    shape.endFill();

    container.addChild(shape);
    container.addChild(display);
    layer.addChild(container);

    for (let i = 0; i <= 3; i++) {
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
      VTPlayerFinalUtils.plotPoint(layer, new Vector2(pos[0], pos[1]), 0x000000, 1.5, 'bounds')
    }

    VTPlayerFinalUtils.plotPoint(layer, boundsObject.collisionLineStart, 0x00ff00, 1.5, 'bounds');
    VTPlayerFinalUtils.plotPoint(layer, boundsObject.collisionLineEnd, 0x00ff00, 1.5, 'bounds');
    VTPlayerFinalUtils.plotLine(layer, boundsObject.collisionLineEnd, boundsObject.collisionLineStart, 0xe100ff);
  }


};


VTPlayerFinalUtils.isInBounds = (trackPoint, boundsObject) => {
  return trackPoint.lat < boundsObject.minLat && trackPoint.lat > boundsObject.maxLat && trackPoint.lon > boundsObject.minLong && trackPoint.lon < boundsObject.maxLong
};


// Based on https://www.habrador.com/tutorials/math/5-line-line-intersection/
VTPlayerFinalUtils.lineIntersecting = (l1_start, l1_end, l2_start, l2_end) => {

  let isIntersecting = false;

  //Direction of the lines
  const l1_dir = Vector2.subtract(l1_end, l1_start).normalize();
  const l2_dir = Vector2.subtract(l2_end, l2_start).normalize();

  //If we know the direction we can get the normal vector to each line
  const l1_normal = new Vector2(-l1_dir.y, l1_dir.x);
  const l2_normal = new Vector2(-l2_dir.y, l2_dir.x);

  //Step 1: Rewrite the lines to a general form: Ax + By = k1 and Cx + Dy = k2
  //The normal vector is the A, B
  const A = l1_normal.x;
  const B = l1_normal.y;

  const C = l2_normal.x;
  const D = l2_normal.y;

  //To get k we just use one point on the line
  const k1 = (A * l1_start.x) + (B * l1_start.y);
  const k2 = (C * l2_start.x) + (D * l2_start.y);

  //Step 4: calculate the intersection point -> one solution
  const x_intersect = (D * k1 - B * k2) / (A * D - B * C);
  const y_intersect = (-C * k1 + A * k2) / (A * D - B * C);

  const intersectPoint = new Vector2(x_intersect, y_intersect);

  const IsBetween = (a, b, c) => {
    let isBetween = false;

    //Entire line segment
    const ab = Vector2.subtract(b, a);
    //The intersection and the first point
    const ac = Vector2.subtract(c, a);

    //Need to check 2 things:
    //1. If the vectors are pointing in the same direction = if the dot product is positive
    //2. If the length of the vector between the intersection and the first point is smaller than the entire line
    if (ab.dot(ac) > 0 && ab.lengthSq() >= ac.lengthSq()) {
      isBetween = true;
    }

    return isBetween;
  };

  if (IsBetween(l1_start, l1_end, intersectPoint) && IsBetween(l2_start, l2_end, intersectPoint)) {
    isIntersecting = true;
  }

  return isIntersecting ? intersectPoint : false
};


export default VTPlayerFinalUtils;
