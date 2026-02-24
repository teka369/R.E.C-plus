# Frontend R.E.C (Registro Estudiantil Centralizado)

Este es el frontend de la plataforma R.E.C, una solución integral para la gestión educativa, desarrollada con React, TypeScript y Vite. Permite a estudiantes, profesores y personal administrativo interactuar con el sistema de manera intuitiva y eficiente.

---

## Tabla de Contenidos

- [Características Principales](#características-principales)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Comandos Útiles](#comandos-útiles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Guía de Uso](#guía-de-uso)
- [Contribución](#contribución)
- [Equipo de Desarrollo](#equipo-de-desarrollo)
- [Licencia](#licencia)

---

## Características Principales

- **Autenticación de usuarios** (estudiantes, profesores, secretaría)
- **Gestión de materiales de estudio** (subida, edición, descarga, filtrado)
- **Gestión de horarios, observaciones, reportes y certificados**
- **Paneles diferenciados por rol**
- **Interfaz moderna y responsiva**
- **Soporte para temas y estilos personalizados**
- **Tutorial interactivo y sección de contacto**

---

## Tecnologías Utilizadas

- **React 18** + **TypeScript**
- **Vite** (entorno de desarrollo ultrarrápido)
- **Bootstrap 5** y **React-Bootstrap** (UI)
- **Chakra UI** (componentes accesibles)
- **Axios** (peticiones HTTP)
- **React Router DOM** (ruteo)
- **Lottie** (animaciones)
- **MySQL** (conexión vía backend)
- **Eslint** (calidad de código)
- **Íconos**: FontAwesome, Bootstrap Icons, React Icons

---

## Requisitos Previos

- Node.js v16 o superior
- npm (v8+) o yarn
- Acceso al backend de R.E.C corriendo en http://localhost:4000 (por defecto)

---

## Instalación

1. Clona el repositorio y entra a la carpeta del frontend:
   ```bash
   git clone <URL_DEL_REPO>
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

---

## Variables de Entorno

Por defecto, el frontend espera que el backend esté en `http://localhost:4000`.  
Si necesitas cambiar la URL, crea un archivo `.env` en la raíz del frontend y agrega:

```
VITE_API_URL=http://localhost:4000
```

---

## Comandos Útiles

- **Desarrollo:**
  ```bash
  npm run dev
  ```
  Inicia el servidor de desarrollo en [http://localhost:5173](http://localhost:5173) (o el puerto que indique Vite).

- **Build de producción:**
  ```bash
  npm run build
  ```

- **Previsualización del build:**
  ```bash
  npm run preview
  ```

- **Linting:**
  ```bash
  npm run lint
  ```

---

## Estructura del Proyecto

```
frontend/
├── public/                # Archivos estáticos
├── src/
│   ├── assets/            # Imágenes, estilos y animaciones
│   ├── views/             # Vistas principales y componentes
│   ├── types/             # Tipos TypeScript
│   ├── hooks/             # Custom hooks
│   ├── main.tsx           # Punto de entrada
│   └── ...                # Otros archivos
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Guía de Uso

1. Inicia el backend siguiendo su README.
2. Ejecuta el frontend con `npm run dev`.
3. Accede a [http://localhost:5173](http://localhost:5173) en tu navegador.
4. Inicia sesión; el registro de usuarios lo realiza exclusivamente Secretaría.
5. Explora las funcionalidades: materiales, horarios, reportes, etc.

---

## Contribución

¿Quieres contribuir?  
1. Haz un fork del repositorio.
2. Crea una rama para tu feature o fix.
3. Haz tus cambios y abre un Pull Request.
4. Sigue las buenas prácticas de código y documentación.

---

## Equipo de Desarrollo

- **Juan David Guarin Romero** - [GitHub](https://github.com/teka369)
- **Valeria Zapata Vargas** - [GitHub](https://github.com/AfterNixe)
- **David Blandon Caro**

---

## Licencia

Este proyecto está bajo la licencia MIT.

---