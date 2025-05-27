# 🚀 Deploy Script for OmniRoll Extension

Este script automatiza el proceso de creación de distribuciones de la extensión OmniRoll para diferentes navegadores.

## 📦 ¿Qué hace el script?

El script `deploy.ts` genera automáticamente:

1. **Versión para Chrome** (`OmniRoll-Chrome.zip`)
   - Target: `chrome`
   - Manifest v3
   - Optimizado para Chrome Web Store

2. **Versión para Firefox** (`OmniRoll-Firefox.zip`)
   - Target: `firefox`
   - Manifest v2
   - Optimizado para Firefox Add-ons

3. **Versión para Opera** (`OmniRoll-Opera.zip`)
   - Target: `chrome` (Opera usa el formato de Chrome)
   - Incluye archivo `persona.ini` automáticamente generado
   - Optimizado para Opera Add-ons

## 🛠️ Cómo usar

### Ejecutar el script completo:
```bash
npm run deploy
```

### Construir para un navegador específico:
```bash
# Solo Chrome
npm run deploy:chrome

# Solo Firefox
npm run deploy:firefox

# Solo Opera
npm run deploy:opera
```

## 📁 Archivos generados

Después de ejecutar el script, se crearán:

- `dist-chrome/` - Carpeta con archivos para Chrome
- `dist-firefox/` - Carpeta con archivos para Firefox  
- `dist-opera/` - Carpeta con archivos para Opera (incluye `persona.ini`)
- `OmniRoll-Chrome.zip` - Listo para subir a Chrome Web Store
- `OmniRoll-Firefox.zip` - Listo para subir a Firefox Add-ons
- `OmniRoll-Opera.zip` - Listo para subir a Opera Add-ons

## ✨ Características del script

- **🧹 Limpieza automática**: Elimina builds anteriores antes de empezar
- **🔨 Build diferenciado**: Genera manifests específicos para cada navegador
- **📄 persona.ini automático**: Para Opera, genera el archivo basado en el manifest
- **✅ Validación**: Verifica que los archivos necesarios estén presentes
- **📦 Compresión**: Crea ZIPs optimizados listos para subir
- **📊 Información detallada**: Muestra el progreso y tamaño de archivos

## 🔧 Configuración

El script utiliza la configuración existente de:
- `vite.config.ts` - Configuración de build
- `src/manifest.json` - Template del manifest con placeholders
- `package.json` - Información del proyecto

## 📋 Proceso de subida a tiendas

Una vez ejecutado el script:

1. **Chrome Web Store**: Sube `OmniRoll-Chrome.zip`
2. **Firefox Add-ons**: Sube `OmniRoll-Firefox.zip`  
3. **Opera Add-ons**: Sube `OmniRoll-Opera.zip`

## ⚠️ Notas importantes

- El script sincroniza automáticamente la versión del `persona.ini` con la del `manifest.json`
- Los archivos de distribución están excluidos del control de versiones (`.gitignore`)
- Requiere Node.js y npm instalados
- Todas las dependencias se instalan automáticamente

## 🐛 Solución de problemas

Si hay errores durante el build:
1. Verifica que todas las dependencias estén instaladas: `npm install`
2. Asegúrate de que los archivos fuente estén en la carpeta `src/`
3. Revisa que el `manifest.json` tenga el formato correcto
4. Ejecuta `npm run build` individualmente para debugging

## 📝 Logs

El script muestra logs detallados incluyendo:
- ✅ Éxito de operaciones
- ❌ Errores específicos
- 📊 Tamaño de archivos generados
- 🎯 Siguientes pasos a realizar
