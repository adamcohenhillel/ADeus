import React, { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { AVPlaybackStatusSuccess, Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

const MAX_RECORDING_DURATION = 5000;
const url =
  "https://ouqyndvauaermfxoydxt.supabase.co/functions/v1/process-audio";

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording>();
  const [sound, setSound] = useState<Audio.Sound>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [recordingUri, setRecordingUri] = useState<string | null | undefined>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // TODO add useEffect to return clean up function that stops recording and playback and gets rid of those pieces of state

  useEffect(() => {
    if(recording && !isRecording) {
      stopRecording();
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== "granted") {
        console.log("Requesting permission..");
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(recording);
      setRecordingUri(undefined);
      recording.setOnRecordingStatusUpdate((status: Audio.RecordingStatus) => {
        if(status.durationMillis >= MAX_RECORDING_DURATION) {
          setIsRecording(false);
        }
      });
      setIsRecording(true);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      console.error("No recording to stop");
      return;
    }
    console.log("Stopping recording..");
    setRecording(undefined);
    await recording?.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording?.getURI();
    setRecordingUri(uri);
    console.log("Recording stopped and stored at", uri);
  };

  const startPlaying = async () => {
    if (!recordingUri) {
      console.error("No recording to play");
      return;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: recordingUri },
      { shouldPlay: true },
      (status) => {
        console.log("Sound status", status);
        if((status as AVPlaybackStatusSuccess).didJustFinish) {
          setIsPlaying(false);
        }
      }
    );
    setSound(sound);
    console.log("Playing recording..");
    await sound.playAsync();
    setIsPlaying(true);
  };

  const stopPlaying = async () => {
    console.log("Stopping recording..");
    sound?.stopAsync().then(() => {
      console.log("Stopped playing");
      sound?.unloadAsync();
      setIsPlaying(false);
      setSound(undefined);
    });
  };

  const startUploading = async () => {
    if (!recordingUri) {
      console.error("No recording to upload");
      return;
    }
    setIsUploading(true);
    console.log("Uploading recording..");
    FileSystem.uploadAsync(url, recordingUri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        "Content-Type": "audio/wav",
      },
      sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
    })
      .then((response) => {
        console.log("Upload finished", response);
      })
      .catch((err) => {
        console.error("Failed to upload", err);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Button
        title={isRecording ? "Stop Recording" : "Start Recording"}
        onPress={isRecording ? () => setIsRecording(false) : startRecording}
      />
      <Button
        title={!isPlaying ? "Play Recording" : "Stop"}
        onPress={isPlaying ? stopPlaying : startPlaying}
      />
      <Button
        title={isUploading ? "Uploading.." : "Start upload"}
        onPress={startUploading}
        disabled={isUploading}
      />
    </View>
  );
}
