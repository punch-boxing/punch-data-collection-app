import {
  useRef,
  useState,
} from 'react';

import {
  Button,
  View,
  Share,
  Text,
  Vibration,
} from 'react-native';

import { accelerometer, gyroscope, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { Vector3D, autoCalibrate, initializeOrientaion, integrateGyro, removeGravity } from './src/utils/math';
import { Subscription } from 'rxjs';

const timeInterval = 50; // ms


function App(): React.JSX.Element {
  const data = useRef<string>('index,time,acc x,acc y,acc z,ori x,ori y,ori z\n');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [acceleration, setAcceleration] = useState<Vector3D>({ x: 0, y: 0, z: 0 });
  const [orientation, setOrientation] = useState<Vector3D>({ x: 0, y: 0, z: 0 });
  const orientationInitialized = useRef<boolean>(false);

  const startSensor = () => {
    if (!subscription) {
      let index = 0;
      let startTime: number | null = null;
      let _gyro: Vector3D = { x: 0, y: 0, z: 0 };

      setUpdateIntervalForType(SensorTypes.gyroscope, timeInterval);
      setUpdateIntervalForType(SensorTypes.accelerometer, timeInterval);

      const gyroSubscription = gyroscope.subscribe(({ x, y, z }) => {
        _gyro = { x, y, z };
      });

      const accelSubscription = accelerometer.subscribe(({ x, y, z, timestamp }) => {
        if (!orientationInitialized.current) {
          setOrientation(initializeOrientaion({ x, y, z }));
          setAcceleration({ x, y, z });
          orientationInitialized.current = true;
        } else {
          // let result = autoCalibrate({ x, y, z }, _gyro, orientation, timeInterval);
          // setOrientation(result.orientation);
          // setAcceleration(result.acceleration);

          setOrientation(prev => integrateGyro(prev, _gyro, timeInterval));
          setAcceleration(removeGravity({ x, y, z }, orientation));
        }

        if (startTime === null) {
          startTime = timestamp;
        }
        const elapsedTime = (timestamp - startTime) / 1000;
        data.current += `${index},${elapsedTime},${x},${y},${z},${orientation.x},${orientation.y},${orientation.z}\n`;
        index++;
      });

      const combinedSubscription = new Subscription();
      combinedSubscription.add(gyroSubscription);
      combinedSubscription.add(accelSubscription);
      setSubscription(combinedSubscription);
    }
  };

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
          acceleration x : {acceleration.x.toFixed(2)} {'\n'}
          acceleration y : {acceleration.y.toFixed(2)} {'\n'}
          acceleration z : {acceleration.z.toFixed(2)} {'\n'}
          {'\n'}
          rotation x : {Math.sin(orientation.x).toFixed(2)} {'\n'}
          rotation y : {Math.sin(orientation.y).toFixed(2)} {'\n'}
          rotation z : {Math.sin(orientation.z).toFixed(2)}
        </Text>
        <Button title="Start Sensor" onPress={startSensor} />
        <Button title="Stop Sensor" onPress={stopSensor} />
        <Button title="Calibrate" onPress={() => {
          orientationInitialized.current = false;
          data.current = 'index,time,acc x,acc y,acc z,ori x,ori y,ori z\n';
        }} />
        <Button title="Share Data" onPress={() => {
          Share.share({
            message: data.current,
            title: 'Sensor Data',
          });
        }} />
        <Button title="Clear Data" onPress={() => {
          data.current = 'index,time,acc x,acc y,acc z,ori x,ori y,ori z\n';
        }} />
        {/* 무음모드 꺼라 ㅡㅡ */}
        <Button title="Vibrate" onPress={() => {
          Vibration.vibrate();
        }} />
      </View>
    );
}

export default App;
