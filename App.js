import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Image, Pressable } from 'react-native';

import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';



export default function App({ navigation }) {
  const [cameraPermission, setCameraPermission] = useState(null);
  const [galleryPermission, setGalleryPermission] = useState(null);

  const [camera, setCamera] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [currResponse, setCurrResponse] = useState('')
  const [type, setType] = useState(Camera.Constants.Type.back);

  const URL = "https://mi355q604i.execute-api.us-east-1.amazonaws.com/prod/images"
  const APIKEY = ""

  useEffect(() => {
    capturePermission();
  }, []);

  /**
  * Check whether application has access to the Camera app.
  */
  const capturePermission = async () => {
    //Camera Perms
    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(cameraPermission.status === 'granted');
    const imagePermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    setGalleryPermission(imagePermission.status === 'granted');

    if (
      imagePermission.status !== 'granted' &&
      cameraPermission.status !== 'granted'
    ) {
      alert('Permission for media access needed.');
    }
  };

  /**
   * Capture image
   */
  const takePicture = async () => {
    if (camera) {
      const data = await camera.takePictureAsync({ quality: 1 });
      setImageUri(data.uri);
      processImage(data.uri)
    }
  };

  /**
   * Sends image to bedrock to be processed.
   */
  const processImage = async (imageUri) => {
    //Convert captured image into base64 string
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 }).catch(e => { console.log(e.stack) });

    //Send image to bedrock
    let result = await fetch(URL, {
      method: 'POST',
      headers: {
        "Content-Type": "text/plain",
        "x-api-key": APIKEY,
      },
      body: base64
    }).then(response => response.json()).then(data => {
      setCurrResponse(data.message)
    }).catch(e => { console.log(e.stack) })
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          ref={(ref) => setCamera(ref)}
          style={styles.fixedRatio}
          type={type}
          ratio={'1:1'}
        />
      </View>
      <View style={{ marginTop: 100, flex: 3 }}>
        {imageUri && <Image source={{ uri: imageUri }} style={{ flex: 2 }} />}
      </View>
      <View style={styles.textContainer}>
        <Pressable style={styles.button} onPress={takePicture}>
          <Text style={styles.text}>Take Picture</Text>
        </Pressable>
        <Text style={styles.response}>Response: {currResponse}</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'col'
  },
  textContainer: {
    flex: 3,
    margin: 15,
    justifyContent: 'center'
  },
  response: {
    fontSize: 14,
    fontFamily: 'Arial',
    fontWeight: '400',
    margin: 5
  },
  cameraContainer: {
    flex: 3,
    flexDirection: 'row',
  },
  fixedRatio: {
    flex: 1,
    aspectRatio: 1,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    margin: 5,
    borderRadius: 4,
    backgroundColor: 'black',
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
});