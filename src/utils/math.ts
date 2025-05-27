type Vector3D = {
  x: number;
  y: number;
  z: number;
};

const normalizeVector = (vector: Vector3D): Vector3D => {
  const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
  if (magnitude === 0) {
    return {x: 0, y: 0, z: 0};
  }
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
    z: vector.z / magnitude,
  };
};

const calculateOrientaion = (acceleration: Vector3D): Vector3D => {
  acceleration = normalizeVector(acceleration);
  return {
    x: -Math.PI - Math.atan2(acceleration.z, acceleration.y),
    y: 0,
    z: Math.asin(acceleration.x),
  };
};

const calculateTrapezoid = (
  current: number,
  previous: number,
  dt: number,
): number => {
  return ((current + previous) / 2) * dt;
};

const integrateGyro = (
  orientation: Vector3D,
  currentGyro: Vector3D,
  previousGyro: Vector3D,
  dt: number,
): Vector3D => {
  return {
    x: orientation.x + calculateTrapezoid(currentGyro.x, previousGyro.x, dt),
    y: orientation.y + calculateTrapezoid(currentGyro.y, previousGyro.y, dt),
    z: orientation.z + calculateTrapezoid(currentGyro.z, previousGyro.z, dt),
  };
};

const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

export type {Vector3D};
export {
  calculateOrientaion,
  calculateTrapezoid,
  integrateGyro,
  radiansToDegrees,
};
