import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../config/firebase';

/**
 * Default settings structure for new users
 */
const DEFAULT_SETTINGS = {
  profile: {
    displayName: '',
    location: '',
    avatar: null,
    lastUpdated: null
  },
  notifications: {
    email: {
      enabled: true,
      frequency: 'daily',
      types: {
        bettingTips: true,
        usageAlerts: true,
        promotions: false,
        newsletters: true
      }
    },
    push: {
      enabled: false,
      types: {
        bettingTips: false,
        usageAlerts: true,
        results: false,
        promotions: false
      }
    },
    sound: {
      enabled: true
    }
  },
  security: {
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 30, // minutes
    lastPasswordChange: null
  },
  preferences: {
    theme: 'dark',
    language: 'en',
    timezone: 'auto',
    currency: 'USD',
    betSlipPosition: 'right',
    oddsFormat: 'american'
  },
  lastUpdated: new Date().toISOString()
};

/**
 * Settings Service for managing user settings in Firestore
 */
class SettingsService {
  /**
   * Get current user ID from Firebase auth with retry logic
   */
  async getCurrentUserId() {
    return new Promise((resolve, reject) => {
      // If user is already available, return immediately
      if (auth.currentUser) {
        console.log('Current user ID:', auth.currentUser.uid);
        resolve(auth.currentUser.uid);
        return;
      }

      console.log('Waiting for auth state to be ready...');

      // Wait for auth state to be ready
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe(); // Clean up listener

        if (user) {
          console.log('Auth state ready - Current user ID:', user.uid);
          resolve(user.uid);
        } else {
          console.error('User not authenticated in settingsService');
          reject(new Error('User not authenticated'));
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Authentication timeout'));
      }, 10000);
    });
  }

  /**
   * Get user settings from Firestore
   */
  async getUserSettings() {
    try {
      const userId = await this.getCurrentUserId();
      const settingsRef = doc(db, 'users', userId);
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        const userData = settingsSnap.data();
        // Merge with defaults to ensure all settings exist
        return {
          ...DEFAULT_SETTINGS,
          ...userData.settings,
          lastUpdated: userData.settings?.lastUpdated || new Date().toISOString()
        };
      } else {
        // User document doesn't exist, create it with defaults
        await this.saveUserSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw new Error('Failed to load settings');
    }
  }

  /**
   * Save complete user settings to Firestore
   */
  async saveUserSettings(settings) {
    try {
      const userId = await this.getCurrentUserId();
      return await this.saveUserSettingsForUser(settings, userId);
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Save complete user settings to Firestore for specific user
   */
  async saveUserSettingsForUser(settings, userId) {
    try {
      console.log('Saving settings for user ID:', userId);
      const settingsRef = doc(db, 'users', userId);

      const settingsToSave = {
        ...settings,
        lastUpdated: new Date().toISOString()
      };

      // Use setDoc with merge to avoid overwriting other user data
      await setDoc(settingsRef, {
        settings: settingsToSave,
        lastSettingsUpdate: new Date().toISOString()
      }, { merge: true });

      console.log('Settings saved successfully for user:', userId);
      return settingsToSave;
    } catch (error) {
      console.error('Error saving user settings for user:', userId, error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Get user settings from Firestore for specific user
   */
  async getUserSettingsForUser(userId) {
    try {
      console.log('Loading settings for user ID:', userId);
      const settingsRef = doc(db, 'users', userId);
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        const userData = settingsSnap.data();
        // Merge with defaults to ensure all settings exist
        const settings = {
          ...DEFAULT_SETTINGS,
          ...userData.settings,
          lastUpdated: userData.settings?.lastUpdated || new Date().toISOString()
        };
        console.log('Settings loaded successfully for user:', userId);
        return settings;
      } else {
        // User document doesn't exist, create it with defaults
        console.log('No existing settings found, creating defaults for user:', userId);
        await this.saveUserSettingsForUser(DEFAULT_SETTINGS, userId);
        return DEFAULT_SETTINGS;
      }
    } catch (error) {
      console.error('Error getting user settings for user:', userId, error);
      throw new Error('Failed to load settings');
    }
  }

  /**
   * Update specific section of settings
   */
  async updateSettingsSection(section, sectionData, userId = null) {
    try {
      const currentSettings = userId ?
        await this.getUserSettingsForUser(userId) :
        await this.getUserSettings();

      const updatedSettings = {
        ...currentSettings,
        [section]: {
          ...currentSettings[section],
          ...sectionData,
          lastUpdated: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString()
      };

      return userId ?
        await this.saveUserSettingsForUser(updatedSettings, userId) :
        await this.saveUserSettings(updatedSettings);
    } catch (error) {
      console.error(`Error updating ${section} settings:`, error);
      throw new Error(`Failed to update ${section} settings`);
    }
  }

  /**
   * Update profile settings
   */
  async updateProfileSettings(profileData, userId = null) {
    return await this.updateSettingsSection('profile', profileData, userId);
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(notificationData) {
    return await this.updateSettingsSection('notifications', notificationData);
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(securityData) {
    return await this.updateSettingsSection('security', securityData);
  }

  /**
   * Update preferences settings
   */
  async updatePreferencesSettings(preferencesData) {
    return await this.updateSettingsSection('preferences', preferencesData);
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults() {
    try {
      const defaultSettings = {
        ...DEFAULT_SETTINGS,
        lastUpdated: new Date().toISOString()
      };
      return await this.saveUserSettings(defaultSettings);
    } catch (error) {
      console.error('Error resetting settings to defaults:', error);
      throw new Error('Failed to reset settings');
    }
  }

  /**
   * Export settings for backup
   */
  async exportSettings() {
    try {
      const settings = await this.getUserSettings();
      return {
        ...settings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw new Error('Failed to export settings');
    }
  }

  /**
   * Import settings from backup
   */
  async importSettings(importedSettings) {
    try {
      // Validate imported settings structure
      if (!importedSettings || typeof importedSettings !== 'object') {
        throw new Error('Invalid settings format');
      }

      // Merge with defaults to ensure all required fields exist
      const settingsToImport = {
        ...DEFAULT_SETTINGS,
        ...importedSettings,
        lastUpdated: new Date().toISOString(),
        importedAt: new Date().toISOString()
      };

      // Remove export metadata
      delete settingsToImport.exportedAt;
      delete settingsToImport.version;

      return await this.saveUserSettings(settingsToImport);
    } catch (error) {
      console.error('Error importing settings:', error);
      throw new Error('Failed to import settings');
    }
  }

  /**
   * Get settings for a specific section
   */
  async getSettingsSection(section) {
    try {
      const allSettings = await this.getUserSettings();
      return allSettings[section] || DEFAULT_SETTINGS[section];
    } catch (error) {
      console.error(`Error getting ${section} settings:`, error);
      throw new Error(`Failed to load ${section} settings`);
    }
  }

  /**
   * Check if user has customized settings
   */
  async hasCustomSettings() {
    try {
      const userId = await this.getCurrentUserId();
      const settingsRef = doc(db, 'users', userId);
      const settingsSnap = await getDoc(settingsRef);

      return settingsSnap.exists() && settingsSnap.data().settings;
    } catch (error) {
      console.error('Error checking custom settings:', error);
      return false;
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
export default settingsService;