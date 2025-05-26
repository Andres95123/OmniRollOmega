# 🔐 Instrucciones para limpiar información sensible del repositorio

## ⚠️ IMPORTANTE: Haz un backup antes de proceder

### Opción 1: Reescribir historial completo (RECOMENDADO)

```powershell
# 1. Hacer backup del proyecto
Copy-Item -Path "." -Destination "../OmniRollOmega-backup" -Recurse

# 2. Verificar el estado actual del repositorio
git status
git log --oneline

# 3. Crear un nuevo repositorio limpio
git checkout --orphan temp-branch
git add -A
git commit -m "feat: initial commit with environment variables protection"

# 4. Eliminar la rama principal y renombrar la nueva
git branch -D main  # o master, dependiendo de tu rama principal
git branch -m main  # o master

# 5. Forzar push para reescribir el historial remoto
git push --force origin main
```

### Opción 2: Usar BFG Repo-Cleaner (ALTERNATIVA)

```powershell
# 1. Instalar BFG (requiere Java)
# Descargar desde: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Crear archivo con URLs sensibles
echo "jealous-camel-darkdev-367363e8.koyeb.app" > sensitive-data.txt

# 3. Limpiar el historial
java -jar bfg.jar --replace-text sensitive-data.txt

# 4. Limpiar y forzar push
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

### Opción 3: Solo para commits recientes

```powershell
# Si solo hay pocos commits con la información sensible
git rebase -i HEAD~n  # donde n es el número de commits a revisar
# En el editor, marca los commits con 'edit' y modifica el contenido
```

## 📋 Verificación post-limpieza

1. **Verificar que la información sensible se eliminó**:
   ```powershell
   git log --all --full-history -- "*server*" | grep -i "jealous-camel"
   ```

2. **Verificar que las variables de entorno funcionan**:
   ```powershell
   npm run build
   ```

3. **Confirmar que .env está en .gitignore**:
   ```powershell
   git status  # .env NO debe aparecer en los archivos a commitear
   ```

## 🔄 Instrucciones para colaboradores

Después de la limpieza, todos los colaboradores deben:

```powershell
# 1. Hacer backup de cambios locales
git stash

# 2. Forzar actualización del repositorio
git fetch origin
git reset --hard origin/main  # o master

# 3. Crear su archivo .env local
Copy-Item .env.example .env
# Editar .env con sus configuraciones
```

## 📝 Notas importantes

- ✅ `.env` está en `.gitignore` y no se commitea
- ✅ `.env.example` se commitea como plantilla
- ✅ `ENV_SETUP.md` tiene instrucciones para nuevos desarrolladores
- ✅ El código usa `import.meta.env.VITE_SERVER_URL`
- ⚠️ Todos los colaboradores necesitan actualizar sus repositorios locales
- ⚠️ La URL sensible ya no está hardcodeada en el código
