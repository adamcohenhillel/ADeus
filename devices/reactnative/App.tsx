import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const url = 'https://ouqyndvauaermfxoydxt.supabase.co/functions/v1/process-audio'

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording>();
  const [sound, setSound] = useState<Audio.Sound>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [recordingUri, setRecordingUri] = useState<string | null | undefined>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');
      setRecordingUri(undefined);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  const stopRecording = async () => {
    console.log('Stopping recording..');
    setRecording(undefined);
    await recording?.stopAndUnloadAsync();
    await Audio.setAudioModeAsync(
      {
        allowsRecordingIOS: false,
      }
    );
    const uri = recording?.getURI();
    console.log('Recording stopped and stored at', uri);
    setRecordingUri(uri);
  }

  const startPlaying = async () => {
    if (!recordingUri) {
      console.error('No recording to play');
      return;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: recordingUri },
      { shouldPlay: true },
      (status) => {
        console.log('Sound status', status);
        // TODO stop playing when status is done
      }
    );
    setSound(sound);
    console.log('Playing recording..');
    await sound.playAsync();
    setIsPlaying(true);
  }

  const stopPlaying = async () => {
    console.log('Stopping recording..');
    sound?.stopAsync().then(() => {
      console.log('Stopped playing');
      sound?.unloadAsync();
      setIsPlaying(false);
      setSound(undefined);
    });
  }

  const startUploading = async () => {
    if (!recordingUri) {
      console.error('No recording to upload');
      return;
    }
    setIsUploading(true);
    console.log('Uploading recording..');
    FileSystem.uploadAsync(url, recordingUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'audio/wav',
      },
      sessionType: FileSystem.FileSystemSessionType.BACKGROUND
    }).then((response) => {
      console.log('Upload finished', response);
    }).catch((err) => {
      console.error('Failed to upload', err);
    }).finally(() => {
      setIsUploading(false);
    });
  }

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />
      <Button
        title={!isPlaying ? 'Play Recording' : 'Stop'}
        onPress={isPlaying ? stopPlaying : startPlaying}
      />
      <Button
        title={isUploading ? 'Uploading..' : 'Start upload'}
        onPress={startUploading}
        disabled={isUploading}
      />
    </View>
  );
}