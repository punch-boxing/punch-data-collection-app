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
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Subscription } from 'rxjs';
import { VolumeManager } from 'react-native-volume-manager';
import { accelerometer, gyroscope, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { Vector3D } from './src/utils/vector';
import { autoCalibrate, initializeOrientaion } from './src/utils/math';

const timeInterval = 50; // ms
const columns = 'Index,Time,Raw Acceleration X,Raw Acceleration Y,Raw Acceleration Z,Acceleration X,Acceleration Y,Acceleration Z,Angular Velocity X,Angular Velocity Y,Angular Velocity Z,Orientation X,Orientation Y,Orientation Z,Punch Type\n';
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

      const gyroSubscription = gyroscope.subscribe(({ x, y, z }) => {
        _gyro = new Vector3D(x, y, z);
      });

      const accelSubscription = accelerometer.subscribe(({ x, y, z, timestamp }) => {
        let result = autoCalibrate(new Vector3D(x, y, z), _gyro, orientation.current, timeInterval);
        orientation.current = result.orientation;
        acceleration.current = result.acceleration;

        if (startTime === null) {
          startTime = timestamp;
        }
        const elapsedTime = (timestamp - startTime) / 1000;
        data.current += `${index},${elapsedTime},${x},${y},${z},${acceleration.current.x},${acceleration.current.y},${acceleration.current.z},${_gyro.x},${_gyro.y},${_gyro.z},${Math.sin(orientation.current.x)},${Math.sin(orientation.current.y)},${Math.sin(orientation.current.z)},${punch}\n`;
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
      // <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 }}>
      //   <Text style={{color: 'white'}}>
      //     acceleration x : {acceleration.current.x.toFixed(2)} {'\n'}
      //     acceleration y : {acceleration.current.y.toFixed(2)} {'\n'}
      //     acceleration z : {acceleration.current.z.toFixed(2)} {'\n'}
      //     {'\n'}
      //     rotation x : {Math.sin(orientation.current.x).toFixed(2)} {'\n'}
      //     rotation z : {Math.sin(orientation.current.z).toFixed(2)}
      //   </Text>
      //   <Button title="Start Sensor" onPress={startSensor} />
      //   <Button title="Stop Sensor" onPress={stopSensor} />
      //   <Button title={punchTypes[punchTypeIndex.current]} onPress={() => {punchTypeIndex.current = (punchTypeIndex.current + 1) % punchTypes.length; forceUpdate();}}/>
      //   <Button title="Share Data" onPress={() => {
      //     Share.share({
      //       message: data.current,
      //       title: 'Sensor Data',
      //     });
      //   }} />
      //   <Button title="Clear Data" onPress={() => {
      //     data.current = columns;
      //   }} />
      //   <Button title="Vibrate" onPress={() => {
      //     Vibration.vibrate();
      //   }} />
      // </View>
      <View style={styles.container}>
      <Text style={styles.text}>
        acceleration x : {acceleration.current.x.toFixed(2)} {'\n'}
        acceleration y : {acceleration.current.y.toFixed(2)} {'\n'}
        acceleration z : {acceleration.current.z.toFixed(2)} {'\n'}
        {'\n'}
        rotation x : {Math.sin(orientation.current.x).toFixed(2)} {'\n'}
        rotation z : {Math.sin(orientation.current.z).toFixed(2)}
      </Text>

      <CustomButton title="Start Sensor" onPress={startSensor} />
      <CustomButton title="Stop Sensor" onPress={stopSensor} />
      <CustomButton title={punchTypes[punchTypeIndex.current]} onPress={() => {
        punchTypeIndex.current = (punchTypeIndex.current + 1) % punchTypes.length;
        forceUpdate();
      }} />
      <CustomButton title="Share Data" onPress={() => {
        Share.share({ message: data.current, title: 'Sensor Data' });
      }} />
      <CustomButton title="Clear Data" onPress={() => {
        data.current = columns;
      }} />
      <CustomButton title="Vibrate" onPress={() => {
        Vibration.vibrate();
      }} />
    </View>
    );
}

const CustomButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FF4040', // red tone
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 8,
    width: '80%',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default App;
