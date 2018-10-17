import {Vector2} from "../../../../utils/vector2";
import * as PIXI from "pixi.js";

const VTPlayerUtils = {};

VTPlayerUtils.GeoBounds = {
  minLong: 9.9171,
  maxLong: 9.9763,
  minLat: 53.5499,
  maxLat: 53.5147
};

VTPlayerUtils.mapData = {
  size: {
    width: 1080,
    height: 1079
  }
};

VTPlayerUtils.getVectorFromGeoPoint = (lat, long) => {
  const pos = VTPlayerUtils.cartesianFromLatLong(lat, long);
  return new Vector2(pos[0], pos[1])
};

VTPlayerUtils.cartesianFromLatLong = (lat, long) => {
  return [
    (long - VTPlayerUtils.GeoBounds.minLong) / (VTPlayerUtils.GeoBounds.maxLong - VTPlayerUtils.GeoBounds.minLong) * VTPlayerUtils.mapData.size.width,
    (lat - VTPlayerUtils.GeoBounds.minLat) / (VTPlayerUtils.GeoBounds.maxLat - VTPlayerUtils.GeoBounds.minLat) * VTPlayerUtils.mapData.size.height
  ];
};

VTPlayerUtils.plotPoint = (layer, vPos, color = 0xffffff, r = 1.5) => {
  let point = new PIXI.Graphics();
  point.beginFill(color);
  point.drawCircle(0, 0, r);
  point.endFill();
  point.x = vPos.x;
  point.y = vPos.y;
  layer.addChild(point);
};

VTPlayerUtils.plotCollisionBounds = (boundsObject, layer) => {
  let topLeft = VTPlayerUtils.cartesianFromLatLong(boundsObject.minLat, boundsObject.minLong);
  let topRight = VTPlayerUtils.cartesianFromLatLong(boundsObject.minLat, boundsObject.maxLong);
  let bottomRight = VTPlayerUtils.cartesianFromLatLong(boundsObject.maxLat, boundsObject.maxLong);
  let bottomLeft = VTPlayerUtils.cartesianFromLatLong(boundsObject.maxLat, boundsObject.minLong);

  let display = new PIXI.Text(boundsObject.index, {fontFamily: 'Arial', fontSize: 15, fill: 0x000000, align: 'center'});
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
    VTPlayerUtils.plotPoint(layer, new Vector2(pos[0], pos[1]), 0x000000, 1.5, 'bounds')
  }

  VTPlayerUtils.plotPoint(layer, boundsObject.collisionLineStart, 0x000000, 1.5, 'bounds');
  VTPlayerUtils.plotPoint(layer, boundsObject.collisionLineEnd, 0x000000, 1.5, 'bounds');

};


VTPlayerUtils.isInBounds = (trackPoint, boundsObject) => {
  return trackPoint.lat < boundsObject.minLat && trackPoint.lat > boundsObject.maxLat && trackPoint.lon > boundsObject.minLong && trackPoint.lon < boundsObject.maxLong
};


// Based on https://www.habrador.com/tutorials/math/5-line-line-intersection/
VTPlayerUtils.lineIntersecting = (l1_start, l1_end, l2_start, l2_end) => {

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
    isIntersecting = true;
  }

  return isIntersecting ? intersectPoint : false
};


export default VTPlayerUtils;
