import {
  useState,
} from 'react';

import {
  Button,
  View,
  Share,
  Vibration,
  Text,
} from 'react-native';

import { accelerometer, gyroscope, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { Subscription } from 'rxjs';


function App(): React.JSX.Element {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [data, setData] = useState<string>('index,time,x,y,z,roll,pitch,yaw\n');
  const [currentData, setCurrentData] = useState({x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0, timestamp: 0});
  const [calibrated, setCalibrated] = useState(false);


  const startSensor = () => {
    if (!subscription) {
      let index = 0;
      // Store the start time when we first subscribe
      let startTime: number | null = null;
      let calibrateTime: number | null = null;
      // let previousAcceleration = { x: 0, y: 0, z: 0 };
      // const errorValue = 0.0;
      let gyroData: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };
      // let calibrated = false;

      setUpdateIntervalForType(SensorTypes.gyroscope, 50);
      setUpdateIntervalForType(SensorTypes.accelerometer, 50);

      const gyroSubscription = gyroscope.subscribe(({ x, y, z }) => {
        gyroData = { x, y, z };
      });

      // Create subscriptions for both sensors
      const accelSubscription = accelerometer.subscribe(({ x, y, z, timestamp }) => {
        setCurrentData({x: x, y: y, z: z, roll: gyroData.x, pitch: gyroData.y, yaw: gyroData.z, timestamp: timestamp});
        if (!calibrated) {
          if (z < -0.5 && z > -1.5) {
            Vibration.vibrate();
            if (calibrateTime === null) {
              calibrateTime = timestamp;
            } else {
              const elapsedTime = (timestamp - calibrateTime) / 1000;
              if (elapsedTime > 1) {
                setCalibrated(true);
                Vibration.cancel();
                console.log('Calibration complete');
                console.log(`Elapsed time: ${elapsedTime} seconds`);
                calibrateTime = null; // Reset calibrateTime after calibration
              }
            }
          }
        }
        if (calibrated) {
          if (startTime === null) {
            startTime = timestamp;
          }

          // Accelerometer returns data of relative value of acceleation of gravity
          // if (Math.abs(previousAcceleration.x - x) > errorValue ||
          // Math.abs(previousAcceleration.y - y) > errorValue ||
          // Math.abs(previousAcceleration.z - z) > errorValue
          // ) {
            // previousAcceleration = { x, y, z };
          const elapsedTime = (timestamp - startTime) / 1000;
          setData(data + `${index},${elapsedTime},${x},${y},${z},${gyroData.x},${gyroData.y},${gyroData.z}\n`);
          index++;
          // }
        }
      });


      const combinedSubscription = new Subscription();
      combinedSubscription.add(accelSubscription);
      combinedSubscription.add(gyroSubscription);

      setSubscription(combinedSubscription);
    }
  };

  const stopSensor = () => {
    if (subscription) {
      subscription.unsubscribe();
      setSubscription(null);
    }
  };

  return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 48 }}>
        <Text style={{ fontSize: 24 }}>Sensor Data Logger</Text>
        <Text>Accelerometer and Gyroscope</Text>

        <Text style={{color: 'white'}}>{calibrated ? 'calibrated' : 'not claibrated'} </Text>
        <Text style={{color: 'white'}}>{currentData.x} </Text>
        <Text style={{color: 'white'}}>{currentData.y}</Text>
        <Text style={{color: 'white'}}>{currentData.z}</Text>
        <Text style={{color: 'white'}}>{data}</Text>

        <Button title="Vibrate" onPress={() => Vibration.vibrate(500, true)} />
        <Button title="Start Sensor" onPress={startSensor} />
        <Button title="Stop Sensor" onPress={stopSensor} />
        <Button title="Share Data" onPress={() => {
          Share.share({
            message: data,
            title: 'Sensor Data',
          });
        }} />

        <Button title="Clear Data" onPress={() => {
          setData('time,x,y,z,roll,pitch,yaw\n');
          console.log('Data cleared');
        }} />
      </View>
    );
}

export default App;
