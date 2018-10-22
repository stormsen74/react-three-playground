import {Vector2} from "../../../utils/vector2";
import VTPlayerUtils from "./utils/VTPlayerUtils";

const VTRecorderUtils = {};

VTRecorderUtils.GeoBounds = {
  minLong: 9.7538,
  maxLong: 10.0948,
  minLat: 53.5743,
  maxLat: 53.4605
};

VTRecorderUtils.mapRange = {
  minLong: 9.9171,
  maxLong: 9.9763,
  minLat: 53.5499,
  maxLat: 53.5147
};

VTRecorderUtils.mapData = {
  size: {
    width: 1920,
    height: 1077
  }
};

VTRecorderUtils.getVectorFromGeoPoint = (lat, long) => {
  const pos = VTRecorderUtils.cartesianFromLatLong(lat, long);
  return new Vector2(pos[0], pos[1])
};


VTRecorderUtils.cartesianFromLatLong = (lat, long) => {
  const x = (long - VTRecorderUtils.GeoBounds.minLong) / (VTRecorderUtils.GeoBounds.maxLong - VTRecorderUtils.GeoBounds.minLong) * VTRecorderUtils.mapData.size.width;
  const y = (lat - VTRecorderUtils.GeoBounds.minLat) / (VTRecorderUtils.GeoBounds.maxLat - VTRecorderUtils.GeoBounds.minLat) * VTRecorderUtils.mapData.size.height;
  return [x, y];
};

VTRecorderUtils.geoFromCartesian = (x, y) => {
  const lat = VTRecorderUtils.GeoBounds.minLat + (y / VTRecorderUtils.mapData.size.height * (VTRecorderUtils.GeoBounds.maxLat - VTRecorderUtils.GeoBounds.minLat));
  const long = VTRecorderUtils.GeoBounds.minLong + (x / VTRecorderUtils.mapData.size.width * (VTRecorderUtils.GeoBounds.maxLong - VTRecorderUtils.GeoBounds.minLong));
  return [lat, long]
};

VTRecorderUtils.isInBounds = (trackPoint, boundsObject) => {
  return trackPoint.lat < boundsObject.minLat && trackPoint.lat > boundsObject.maxLat && trackPoint.lon > boundsObject.minLong && trackPoint.lon < boundsObject.maxLong
};

VTRecorderUtils.lineIntersecting = (l1_start, l1_end, l2_start, l2_end) => {

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


VTRecorderUtils.collisionBounds = [
  {
    index: 0,
    minLong: 9.949696544325088,
    maxLong: 9.953972099880643,
    minLat: 53.54292959464058,
    maxLat: 53.53781868981334,
    collisionLineStart: VTRecorderUtils.getVectorFromGeoPoint(53.540694, 9.951064),
    collisionLineEnd: VTRecorderUtils.getVectorFromGeoPoint(53.540894, 9.954155)
  },
  {
    index: 1,
    minLong: 9.951390,
    maxLong: 9.955178025806568,
    minLat: 53.539734,
    maxLat: 53.53755770742224,
    collisionLineStart: VTRecorderUtils.getVectorFromGeoPoint(53.538943, 9.952549),
    collisionLineEnd: VTRecorderUtils.getVectorFromGeoPoint(53.538745, 9.954598)
  },
  {
    index: 2,
    minLong: 9.932996296296295,
    maxLong: 9.938879753644025,
    minLat: 53.54105922150139,
    maxLat: 53.53781868981334,
    collisionLineStart: VTRecorderUtils.getVectorFromGeoPoint(53.53964556655106, 9.934604198088469),
    collisionLineEnd: VTRecorderUtils.getVectorFromGeoPoint(53.539254092964406, 9.937783457347729)
  },
  {
    index: 3,
    minLong: 9.966835310872396,
    maxLong: 9.9716590145761,
    minLat: 53.5259657392189,
    maxLat: 53.52300793812268,
    collisionLineStart: VTRecorderUtils.getVectorFromGeoPoint(53.524965306055954, 9.970416544325087),
    collisionLineEnd: VTRecorderUtils.getVectorFromGeoPoint(53.52376913809082, 9.968077777777777)
  },
  {
    index: 4,
    minLong: 9.955506914695457,
    maxLong: 9.96076913691768,
    minLat: 53.52716190917516,
    maxLat: 53.524747822057456,
    collisionLineStart: VTRecorderUtils.getVectorFromGeoPoint(53.526096230414446, 9.95748024802879),
    collisionLineEnd: VTRecorderUtils.getVectorFromGeoPoint(53.52466082726338, 9.957516792353877)
  },
  {
    index: 5,
    minLong: 9.96731037037037,
    maxLong:  9.97059925925926,
    minLat: 53.54338631382501,
    maxLat: 53.54064599871843,
    collisionLineStart: VTRecorderUtils.getVectorFromGeoPoint(53.54203790546803, 9.96880864420573),
    collisionLineEnd: VTRecorderUtils.getVectorFromGeoPoint(53.54079823911029, 9.969247162724248)
  }
];





export default VTRecorderUtils;
