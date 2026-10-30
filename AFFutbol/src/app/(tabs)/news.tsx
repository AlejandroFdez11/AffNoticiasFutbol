import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function NewsScreen() {
  return (
    <PlaceholderScreen
      title="Noticias"
      phase="Fase 2"
      description="La actualidad futbolística centralizada: titulares, análisis y rumores de fichajes."
      icon={{ ios: 'newspaper', android: 'newspaper', web: 'newspaper' }}
    />
  );
}
