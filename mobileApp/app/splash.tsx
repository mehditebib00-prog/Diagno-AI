import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

export default function Splash() {
  const router = useRouter();

  // 🔥 animation unique (sync logo + texte)
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1500, // smooth et pas trop rapide
      useNativeDriver: true,
    }).start();

    // ⏱ transition rapide mais propre
    const timer = setTimeout(() => {
      router.replace('/role');
    }, 2300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>

      {/* LOGO */}
      <Animated.Image
        source={require('../assets/images/logo.png')}
        style={[
          styles.logo,
          {
            opacity: anim,
            transform: [
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                }),
              },
            ],
          },
        ]}
        resizeMode="contain"
      />

      {/* TEXTE SYNCHRONISÉ */}
      <Animated.View
        style={{
          flexDirection: 'row',
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        }}
      >
        <Text style={styles.white}>Diagno</Text>
        <Text style={styles.blue}>AI</Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220', // bleu foncé moderne
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 300,   // 🔥 très grand comme tu voulais
    height: 300,
    marginBottom: 5, // proche du texte
  },

  white: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },

  blue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
});