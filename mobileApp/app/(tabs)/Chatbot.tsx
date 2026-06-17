import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';



export default function Chatbot() {
  const router = useRouter();

  const [message, setMessage] = useState('');

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hello 👋 I am your medical assistant. How can I help you today?',
      sender: 'bot',
    },
  ]);

 const sendMessage = async () => {
  if (!message.trim()) return;

  const userText = message;

  const token = await AsyncStorage.getItem('token'); // ✅ ADD THIS

  setMessages((prev) => [
    ...prev,
    {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
    },
  ]);

  setMessage('');

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // now it works
      },
      body: JSON.stringify({
        message: userText,
      }),
    });

    const data = await response.json();

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
      },
    ]);
  } catch (error) {
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        text: 'Unable to connect to server.',
        sender: 'bot',
      },
    ]);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons
            name="close"
            size={32}
            color="#38BDF8"
          />
        </TouchableOpacity>

        <Ionicons
          name="chatbubble-ellipses"
          size={30}
          color="#38BDF8"
        />

        <Text style={styles.headerTitle}>
          Medical Assistant
        </Text>
      </View>

      {/* CHAT */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.sender === 'user'
                ? styles.userMessage
                : styles.botMessage,
            ]}
          >
            <Text style={styles.messageText}>
              {item.text}
            </Text>
          </View>
        )}
      />

      {/* INPUT */}
      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />

        <TouchableOpacity
          onPress={sendMessage}
          style={styles.sendButton}
        >
          <Ionicons
            name="send"
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },

  header: {
    paddingTop: 70,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },

  closeButton: {
    position: 'absolute',
    left: 20,
    top: 65,
    zIndex: 10,
  },

  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },

  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginVertical: 6,
  },

  userMessage: {
    backgroundColor: '#38BDF8',
    alignSelf: 'flex-end',
  },

  botMessage: {
    backgroundColor: '#1E293B',
    alignSelf: 'flex-start',
  },

  messageText: {
    color: 'white',
    fontSize: 14,
  },

  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0B1220',
  },

  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    color: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginRight: 10,
  },

  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
});