import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ProfileScreen() {
  return (
    <PlaceholderScreen
      title="Perfil"
      phase="Fase 3"
      description="Inicia sesión, elige tu equipo favorito y consulta tu historial de puntos."
      icon={{
        ios: 'person.crop.circle',
        android: 'person',
        web: 'person',
      }}
    />
  );
}
