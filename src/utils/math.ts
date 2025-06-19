type Vector3D = {
  x: number;
  y: number;
  z: number;
};

type CalibrationResult = {
  acceleration: Vector3D;
  orientation: Vector3D;
};

const subtractVectors = (a: Vector3D, b: Vector3D): Vector3D => {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
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

const initializeOrientaion = (acceleration: Vector3D): Vector3D => {
  acceleration = normalizeVector(acceleration);
  return {
    x: -Math.PI - Math.atan2(acceleration.z, acceleration.y),
    y: 0,
    z: Math.asin(acceleration.x),
  };
};

const calculateGravity = (orientaion: Vector3D): Vector3D => {
  return {
    x: Math.sin(orientaion.z),
    y: -Math.cos(orientaion.x) * Math.cos(orientaion.z),
    z: Math.cos(orientaion.x) * Math.sin(orientaion.z),
  };
};

const removeGravity = (
  acceleration: Vector3D,
  orientaion: Vector3D,
): Vector3D => {
  const gravity = calculateGravity(orientaion);
  return subtractVectors(acceleration, gravity);
};

const integrateGyro = (
  orientation: Vector3D,
  gyro: Vector3D,
  dt: number,
): Vector3D => {
  return {
    x: orientation.x + (gyro.x * dt) / 1000,
    y: orientation.y + (gyro.y * dt) / 1000,
    z: orientation.z + (gyro.z * dt) / 1000,
  };
};

const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

const autoCalibrate = (
  acceleration: Vector3D,
  gyro: Vector3D,
  previousOrientation: Vector3D,
  dt: number,
): CalibrationResult => {
  const magnitude = Math.sqrt(
    acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2,
  );

  if (magnitude <= 1) {
    let _acceleration = normalizeVector(acceleration);
    let _orientation = {
      x: -Math.PI - Math.atan2(_acceleration.z, _acceleration.y),
      y: previousOrientation.y + (gyro.y * dt) / 1000,
      z: Math.asin(_acceleration.x),
    };
    return {
      acceleration: acceleration,
      orientation: _orientation,
    };
  } else {
    let _orientation = integrateGyro(previousOrientation, gyro, dt);
    return {
      acceleration: removeGravity(acceleration, _orientation),
      orientation: _orientation,
    };
  }
};

export type {Vector3D};
export {
  autoCalibrate,
  initializeOrientaion,
  calculateGravity,
  removeGravity,
  integrateGyro,
  radiansToDegrees,
};
