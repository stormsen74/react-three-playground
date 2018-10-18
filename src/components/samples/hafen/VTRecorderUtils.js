import {Vector2} from "../../../utils/vector2";


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
  return [
    (long - VTRecorderUtils.GeoBounds.minLong) / (VTRecorderUtils.GeoBounds.maxLong - VTRecorderUtils.GeoBounds.minLong) * VTRecorderUtils.mapData.size.width,
    (lat - VTRecorderUtils.GeoBounds.minLat) / (VTRecorderUtils.GeoBounds.maxLat - VTRecorderUtils.GeoBounds.minLat) * VTRecorderUtils.mapData.size.height
  ];
};


VTRecorderUtils.collisionBounds = [
  {
    index: 0,
    minLong: 9.94979,
    maxLong: 9.95385,
    minLat: 53.54188,
    maxLat: 53.53949,
    collisionLineStart: VTRecorderUtils.getVectorFromGeoPoint(53.540694, 9.951064),
    collisionLineEnd: VTRecorderUtils.getVectorFromGeoPoint(53.540894, 9.954155)
  },
  {
    index: 1,
    minLong: 9.951390,
    maxLong: 9.953890,
    minLat: 53.539734,
    maxLat: 53.537987,
    collisionLineStart: VTRecorderUtils.getVectorFromGeoPoint(53.538943, 9.952549),
    collisionLineEnd: VTRecorderUtils.getVectorFromGeoPoint(53.538745, 9.954598)
  }
];





export default VTRecorderUtils;
