import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function RoleScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>

            <ImageBackground
                source={require('../../assets/images/background.jpg')}
                style={styles.background}
                resizeMode="cover"
            >

                {/* overlay léger pour lisibilité */}
                <View style={styles.overlay}>

                    {/* bloc bas */}
                    <View style={styles.bottomContainer}>

                        <Text style={styles.title}>Choose your role</Text>

                        {/* Position inversée : Patient passe en premier */}
                        <TouchableOpacity
                            style={styles.buttonPatient}
                            onPress={() => router.push('/patient')}
                        >
                            <Text style={styles.buttonText}>Login as Patient</Text>
                        </TouchableOpacity>

                        {/* Doctor passe en deuxième */}
                        <TouchableOpacity
                            style={styles.buttonDoctor}
                            onPress={() => router.push('/doctor')}
                        >
                            <Text style={styles.buttonText}>Login as Doctor</Text>
                        </TouchableOpacity>

                    </View>

                </View>

            </ImageBackground>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },

    background: {
        flex: 1,
        width: '100%',
        height: '100%',

        // 🔥 meilleure stabilité web + mobile
        ...(Platform.OS === 'web' && {
            maxWidth: 450,
            alignSelf: 'center',
        }),
    },

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)', // léger → pas effet flou
    },

    bottomContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 20,
        paddingBottom: 40,
    },

    title: {
        fontSize: 26,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
    },

    // Couleur inversée : Doctor prend le style sombre avec bordure bleue
    buttonDoctor: {
        backgroundColor: '#1E293B',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#38BDF8',
        alignItems: 'center',
    },

    // Couleur inversée : Patient prend le style bleu clair (et conserve un margin-bottom pour l'espacement)
    buttonPatient: {
        backgroundColor: '#38BDF8',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
    },

    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});