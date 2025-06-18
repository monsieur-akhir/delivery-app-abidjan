#!/usr/bin/env node

/**
 * Script de migration automatique des Alert.alert vers le nouveau système d'alertes
 * Usage: node scripts/migrate-alerts.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const MOBILE_DIR = './mobile';
const LIVRAISON_DIR = './livraison-abidjan-mobile/src';
const SCREEN_PATTERN = '**/*.tsx';

// Patterns de remplacement
const REPLACEMENTS = [
  // Alert.alert simple
  {
    pattern: /Alert\.alert\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g,
    replacement: (match, title, message) => {
      if (title.toLowerCase().includes('erreur') || title.toLowerCase().includes('error')) {
        return `showErrorAlert('${title}', '${message}')`;
      } else if (title.toLowerCase().includes('succès') || title.toLowerCase().includes('success')) {
        return `showSuccessAlert('${title}', '${message}')`;
      } else if (title.toLowerCase().includes('avertissement') || title.toLowerCase().includes('warning')) {
        return `showWarningAlert('${title}', '${message}')`;
      } else {
        return `showInfoAlert('${title}', '${message}')`;
      }
    }
  },
  
  // Alert.alert avec boutons
  {
    pattern: /Alert\.alert\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*,\s*\[([^\]]+)\]\s*\)/g,
    replacement: (match, title, message, buttons) => {
      // Analyser les boutons pour déterminer le type d'alerte
      const buttonText = buttons.toLowerCase();
      
      if (buttonText.includes('supprimer') || buttonText.includes('delete') || buttonText.includes('remove')) {
        return `showDeleteConfirmationAlert('${title}', '${message}', () => handleDelete())`;
      } else if (buttonText.includes('confirmer') || buttonText.includes('confirm')) {
        return `showConfirmationAlert('${title}', '${message}', () => handleConfirm(), () => handleCancel())`;
      } else {
        return `showInfoAlert('${title}', '${message}')`;
      }
    }
  }
];

// Imports à ajouter
const REQUIRED_IMPORTS = [
  "import CustomAlert from '../components/CustomAlert'",
  "import CustomToast from '../components/CustomToast'",
  "import { useAlert } from '../hooks/useAlert'"
];

// Hook à ajouter
const HOOK_USAGE = `
  const { 
    alertVisible,
    alertConfig,
    toastVisible,
    toastConfig,
    showSuccessAlert, 
    showErrorAlert, 
    showWarningAlert, 
    showInfoAlert, 
    showConfirmationAlert,
    showDeleteConfirmationAlert,
    hideAlert,
    hideToast
  } = useAlert()
`;

// Composants à ajouter
const ALERT_COMPONENTS = `
      {/* Composants d'alerte modernes */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
        icon={alertConfig.icon}
        onDismiss={hideAlert}
        showCloseButton={alertConfig.showCloseButton}
        autoDismiss={alertConfig.autoDismiss}
        dismissAfter={alertConfig.dismissAfter}
      />

      <CustomToast
        visible={toastVisible}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        onDismiss={hideToast}
        action={toastConfig.action}
        icon={toastConfig.icon}
        title={toastConfig.title}
      />
`;

function findFiles(directory) {
  return glob.sync(path.join(directory, SCREEN_PATTERN), { absolute: true });
}

function hasAlertUsage(content) {
  return content.includes('Alert.alert') || content.includes('Alert.') || content.includes('import { Alert }');
}

function migrateFile(filePath) {
  console.log(`\n🔧 Migration de: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Vérifier si le fichier utilise Alert
  if (!hasAlertUsage(content)) {
    console.log('  ⏭️  Aucun usage d\'Alert détecté, ignoré');
    return false;
  }
  
  // Supprimer l'import Alert
  content = content.replace(/import\s*{\s*Alert\s*}\s*from\s*['"]react-native['"];?\s*/g, '');
  content = content.replace(/import\s*{\s*Alert\s*}\s*from\s*['"]@expo\/vector-icons['"];?\s*/g, '');
  
  // Ajouter les nouveaux imports
  const importIndex = content.indexOf('import');
  if (importIndex !== -1) {
    const lastImportIndex = content.lastIndexOf('import');
    const lastImportEnd = content.indexOf('\n', lastImportIndex) + 1;
    
    const newImports = REQUIRED_IMPORTS.join('\n') + '\n';
    content = content.slice(0, lastImportEnd) + newImports + content.slice(lastImportEnd);
    hasChanges = true;
  }
  
  // Remplacer les Alert.alert
  REPLACEMENTS.forEach(({ pattern, replacement }) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      hasChanges = true;
    }
  });
  
  // Ajouter le hook useAlert
  const componentMatch = content.match(/const\s+(\w+)\s*:\s*React\.FC\s*=\s*\(\)\s*=>\s*{/);
  if (componentMatch) {
    const componentName = componentMatch[1];
    const hookIndex = content.indexOf('const { user } = useAuth()') || 
                     content.indexOf('const navigation = useNavigation()') ||
                     content.indexOf('const [');
    
    if (hookIndex !== -1) {
      const insertIndex = content.indexOf('\n', hookIndex) + 1;
      content = content.slice(0, insertIndex) + HOOK_USAGE + content.slice(insertIndex);
      hasChanges = true;
    }
  }
  
  // Ajouter les composants d'alerte
  const safeAreaEnd = content.lastIndexOf('</SafeAreaView>');
  if (safeAreaEnd !== -1) {
    content = content.slice(0, safeAreaEnd) + ALERT_COMPONENTS + content.slice(safeAreaEnd);
    hasChanges = true;
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  ✅ Migration terminée');
    return true;
  } else {
    console.log('  ⚠️  Aucun changement nécessaire');
    return false;
  }
}

function main() {
  console.log('🚀 Début de la migration des alertes...\n');
  
  const mobileFiles = findFiles(MOBILE_DIR);
  const livraisonFiles = findFiles(LIVRAISON_DIR);
  const allFiles = [...mobileFiles, ...livraisonFiles];
  
  let migratedCount = 0;
  let totalFiles = 0;
  
  allFiles.forEach(file => {
    if (migrateFile(file)) {
      migratedCount++;
    }
    totalFiles++;
  });
  
  console.log(`\n📊 Résumé de la migration:`);
  console.log(`  📁 Fichiers traités: ${totalFiles}`);
  console.log(`  ✅ Fichiers migrés: ${migratedCount}`);
  console.log(`  ⏭️  Fichiers ignorés: ${totalFiles - migratedCount}`);
  
  console.log(`\n🎉 Migration terminée !`);
  console.log(`\n📝 Prochaines étapes:`);
  console.log(`  1. Vérifier les fichiers migrés`);
  console.log(`  2. Tester les nouvelles alertes`);
  console.log(`  3. Ajuster les messages si nécessaire`);
  console.log(`  4. Utiliser le composant AlertDemo pour tester`);
}

// Vérifier les dépendances
try {
  require('glob');
} catch (error) {
  console.error('❌ Erreur: Le package "glob" est requis');
  console.log('   Installez-le avec: npm install glob');
  process.exit(1);
}

main(); 