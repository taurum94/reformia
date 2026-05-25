# Setup del proyecto

## 1. Crear el proyecto Expo (ejecutar una sola vez)

```bash
npx create-expo-app@latest . --template blank-typescript
```

## 2. Instalar dependencias

```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar react-native-safe-area-context react-native-screens
npm install @supabase/supabase-js groq-sdk
npm install --save-dev prettier eslint @typescript-eslint/eslint-plugin
```

## 3. Variables de entorno

Copia `.env.example` a `.env` y rellena tus claves:
- Supabase: crea proyecto en https://supabase.com (gratis)
- Groq: crea cuenta en https://console.groq.com (gratis)

## 4. Base de datos

Copia el contenido de `db/schema.sql` en el editor SQL de Supabase y ejecútalo.

## 5. Arrancar el proyecto

```bash
npx expo start
```

Escanea el QR con Expo Go en tu móvil.
