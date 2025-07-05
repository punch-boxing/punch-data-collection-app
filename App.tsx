import {
  useReducer,
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
import { Subscription } from 'rxjs';
import { VolumeManager } from 'react-native-volume-manager';
import { accelerometer, gyroscope, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { Vector3D } from './src/utils/vector';
import { autoCalibrate, initializeOrientaion } from './src/utils/math';

const timeInterval = 50; // ms
const columns = 'index,time,acc x,acc y,acc z,ori x,ori z,punch\n';
const punchTypes = ['Straight', 'Hook', 'UpperCut', 'Body'];

function App() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const data = useRef<string>(columns);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const orientationInitialized = useRef<boolean>(false);
  const punchTypeIndex = useRef<number>(0);
  const acceleration = useRef<Vector3D>(new Vector3D(0, 0, 0));
  const orientation = useRef<Vector3D>(new Vector3D(0, 0, 0));
  const volumeListener = useRef<ReturnType<typeof VolumeManager.addVolumeListener> | null>(null);

  const startSensor = () => {
    if (!subscription) {
      let index = 0;
      let startTime: number | null = null;
      let _gyro: Vector3D = new Vector3D(0, 0, 0);
      let currentVolume = 0;

      setUpdateIntervalForType(SensorTypes.gyroscope, timeInterval);
      setUpdateIntervalForType(SensorTypes.accelerometer, timeInterval);

      let punch = 'None';

      volumeListener.current = VolumeManager.addVolumeListener((result) => {
        if (currentVolume !== result.volume) {
          punch = punchTypes[punchTypeIndex.current];
        }
        currentVolume = result.volume;
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const gyroSubscription = gyroscope.subscribe(({ x, y, z }) => {
        _gyro = new Vector3D(x, 0, z);
      });

      const accelSubscription = accelerometer.subscribe(({ x, y, z, timestamp }) => {
        if (!orientationInitialized.current) {
          orientation.current = initializeOrientaion(new Vector3D(x, y, z));
          acceleration.current = new Vector3D(x, y, z);
          orientationInitialized.current = true;
        } else {
          let result = autoCalibrate(new Vector3D(x, y, z), _gyro, orientation.current, timeInterval);
          orientation.current = result.orientation;
          acceleration.current = result.acceleration;
        }

        if (startTime === null) {
          startTime = timestamp;
        }
        const elapsedTime = (timestamp - startTime) / 1000;
        data.current += `${index},${elapsedTime},${x},${y},${z},${Math.sin(orientation.current.x)},${Math.sin(orientation.current.z)},${punch}\n`;
        punch = 'None';
        index++;
        forceUpdate();
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
    volumeListener.current?.remove();
  };

  return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 }}>
        <Text style={{color: 'white'}}>
          acceleration x : {acceleration.current.x.toFixed(2)} {'\n'}
          acceleration y : {acceleration.current.y.toFixed(2)} {'\n'}
          acceleration z : {acceleration.current.z.toFixed(2)} {'\n'}
          {'\n'}
          rotation x : {Math.sin(orientation.current.x).toFixed(2)} {'\n'}
          rotation z : {Math.sin(orientation.current.z).toFixed(2)}
        </Text>
        <Button title="Start Sensor" onPress={startSensor} />
        <Button title="Stop Sensor" onPress={stopSensor} />
        <Button title={punchTypes[punchTypeIndex.current]} onPress={() => {punchTypeIndex.current = (punchTypeIndex.current + 1) % punchTypes.length; forceUpdate();}}/>
        <Button title="Share Data" onPress={() => {
          Share.share({
            message: data.current,
            title: 'Sensor Data',
          });
        }} />
        <Button title="Clear Data" onPress={() => {
          data.current = columns;
        }} />
        {/* 무음모드 꺼라 ㅡㅡ */}
        <Button title="Vibrate" onPress={() => {
          Vibration.vibrate();
        }} />
      </View>
    );
}

export default App;
