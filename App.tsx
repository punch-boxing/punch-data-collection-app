import {
  useRef,
  useState,
} from 'react';

import {
  Button,
  View,
  Share,
  Text,
} from 'react-native';

import { accelerometer, gyroscope, magnetometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { Subscription } from 'rxjs';
import { Vector3D, calculateOrientaion, integrateGyro, radiansToDegrees } from './src/utils/math';

const timeInterval = 50; // ms


function App(): React.JSX.Element {
  const data = useRef<string>('index,time,acc x,acc y,acc z,gyro x,gyro y,gyro z,mag x,mag y,mag z\n');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orientation, setOrientation] = useState<Vector3D>({ x: 0, y: 0, z: 0 });
  const orientationInitialized = useRef<boolean>(false);

  const startSensor = () => {
    if (!subscription) {
      let index = 0;
      let startTime: number | null = null;
      let _gyro: Vector3D = { x: 0, y: 0, z: 0 };
      let _mag: Vector3D = { x: 0, y: 0, z: 0 };

      setUpdateIntervalForType(SensorTypes.gyroscope, timeInterval);
      setUpdateIntervalForType(SensorTypes.magnetometer, timeInterval);
      setUpdateIntervalForType(SensorTypes.accelerometer, timeInterval);

      const gyroSubscription = gyroscope.subscribe(({ x, y, z }) => {
        _gyro = { x, y, z };
      });

      const magSubscription = magnetometer.subscribe(({ x, y, z }) => {
        _mag = { x, y, z };
      });

      const accelSubscription = accelerometer.subscribe(({ x, y, z, timestamp }) => {
        if (!orientationInitialized.current) {
          setOrientation(calculateOrientaion({ x, y, z }));
          orientationInitialized.current = true;
        } else {
          setOrientation(prev => ({
            x: prev.x + _gyro.x * (timeInterval / 1000),
            y: prev.y + _gyro.y * (timeInterval / 1000),
            z: prev.z + _gyro.z * (timeInterval / 1000),
          }));
        }

        if (startTime === null) {
          startTime = timestamp;
        }
        const elapsedTime = (timestamp - startTime) / 1000;
        data.current += `${index},${elapsedTime},${x},${y},${z},${_gyro.x},${_gyro.y},${_gyro.z},${_mag.x},${_mag.y},${_mag.z}\n`;
        index++;
      });

      const combinedSubscription = new Subscription();
      combinedSubscription.add(gyroSubscription);
      combinedSubscription.add(magSubscription);
      combinedSubscription.add(accelSubscription);

      setSubscription(combinedSubscription);
    }
  };

  // let previousGyro: Vector3D | null = null;

  // const data = useRef<string>('index,time,acc x,acc y,acc z,gyro x,gyro y,gyro z,mag x,mag y,mag z\n');
  // const [subscription, setSubscription] = useState<Subscription | null>(null);
  // const [orientation, setOrientation] = useState<Vector3D>({ x: 0, y: 0, z: 0 });
  // // const [currentData, setCurrentData] = useState({accelerometerData: {x: 0, y: 0, z: 0} as Vector3D, gyroscopeData: {x: 0, y: 0, z: 0} as Vector3D, magnetometerData: {x: 0, y: 0, z: 0} as Vector3D});

  // const startSensor = () => {
  //   if (!subscription) {
  //     let index = 0;
  //     let startTime: number | null = null;
  //     let _gyro: Vector3D = { x: 0, y: 0, z: 0 };
  //     let _mag: Vector3D = { x: 0, y: 0, z: 0 };

  //     setUpdateIntervalForType(SensorTypes.gyroscope, timeInterval);
  //     setUpdateIntervalForType(SensorTypes.magnetometer, timeInterval);
  //     setUpdateIntervalForType(SensorTypes.accelerometer, timeInterval);

  //     const gyroSubscription = gyroscope.subscribe(({ x, y, z }) => {
  //       _gyro = { x, y, z };
  //       previousGyro = { x, y, z };
  //     });

  //     const magSubscription = magnetometer.subscribe(({ x, y, z }) => {
  //       _mag = { x, y, z };
  //     });

  //     const accelSubscription = accelerometer.subscribe(({ x, y, z, timestamp }) => {
  //       // setCurrentData({ accelerometerData: { x, y, z } as Vector3D, gyroscopeData: _gyro, magnetometerData: _mag});
  //       if (previousGyro !== null) {
  //         // let _x = (previousGyro.x + x) * 0.05 / 2 + orientation.x;
  //         // let _y = (previousGyro.y + y) * 0.05 / 2 + orientation.y;
  //         // let _z = (previousGyro.z + z) * 0.05 / 2 + orientation.z;
  //         let _x = orientation.x;
  //         let _y = orientation.y;
  //         let _z = orientation.z;
  //         setOrientation({ x: _x, y: _y, z: _z });
  //         // setOrientation(integrateGyro(orientation, _gyro, previousGyro, 0.05));
  //       }

  //       if (startTime === null) {
  //         startTime = timestamp;
  //         setOrientation(calculateOrientaion({x: x, y: y, z: z}));
  //       }
  //       const elapsedTime = (timestamp - startTime) / 1000;
  //       data.current += `${index},${elapsedTime},${x},${y},${z},${_gyro.x},${_gyro.y},${_gyro.z},${_mag.x},${_mag.y},${_mag.z}\n`;
  //       index++;
  //     });

  //     const combinedSubscription = new Subscription();
  //     combinedSubscription.add(gyroSubscription);
  //     combinedSubscription.add(magSubscription);
  //     combinedSubscription.add(accelSubscription);

  //     setSubscription(combinedSubscription);
  //   }
  // };

  const stopSensor = () => {
    if (subscription) {
      subscription.unsubscribe();
      orientationInitialized.current = false;
      setSubscription(null);
    }
  };

  return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 }}>
        <Text style={{ fontSize: 24 }}>Sensor Data Logger</Text>
        <Text>Accelerometer and Gyroscope</Text>
        <Text style={{color: 'white'}}>
          {/* x : {currentData.accelerometerData.x} {'\n'}
          y : {currentData.accelerometerData.y} {'\n'}
          z : {currentData.accelerometerData.z} */}
          rotation x : {radiansToDegrees(orientation.x).toFixed(2)} {'\n'}
          rotation y : {radiansToDegrees(orientation.y).toFixed(2)} {'\n'}
          rotation z : {radiansToDegrees(orientation.z).toFixed(2)}
        </Text>
        <Button title="Start Sensor" onPress={startSensor} />
        <Button title="Stop Sensor" onPress={stopSensor} />
        <Button title="Share Data" onPress={() => {
          Share.share({
            message: data.current,
            title: 'Sensor Data',
          });
        }} />
        <Button title="Clear Data" onPress={() => {
          data.current = 'index,time,acc x,acc y,acc z,gyro x,gyro y,gyro z,mag x,mag y,mag z\n';
        }} />
      </View>
    );
}

export default App;
