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


VTPlayerFinalUtils.collisionBounds = [
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
