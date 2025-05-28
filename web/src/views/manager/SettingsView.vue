<!-- eslint-disable prettier/prettier -->
<template>
  <div class="settings-view">
    <div class="page-header">
      <h1>Paramètres du système</h1>
      <div class="actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
        <button class="btn btn-primary" @click="saveAllSettings" :disabled="!hasChanges || saving">
          <font-awesome-icon icon="spinner" spin v-if="saving" class="mr-1" />
          <font-awesome-icon icon="save" v-else />
          Enregistrer les modifications
        </button>
      </div>
    </div>

    <!-- Onglets de paramètres -->
    <div class="settings-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id" 
        class="tab-button" 
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <font-awesome-icon :icon="tab.icon" class="tab-icon" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Contenu des paramètres -->
    <div class="settings-content" v-if="!loading">
      <!-- Paramètres généraux -->
      <div class="settings-section" v-if="activeTab === 'general'">
        <h2>Paramètres généraux</h2>
        
        <div class="settings-group">
          <h3>Informations de la plateforme</h3>
          
          <div class="form-group">
            <label for="platform-name">Nom de la plateforme</label>
            <input 
              type="text" 
              id="platform-name" 
              v-model="settings.general.platformName" 
              @change="markAsChanged('general')"
            />
          </div>
          
          <div class="form-group">
            <label for="platform-description">Description</label>
            <textarea 
              id="platform-description" 
              v-model="settings.general.platformDescription" 
              rows="3"
              @change="markAsChanged('general')"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="contact-email">Email de contact</label>
            <input 
              type="email" 
              id="contact-email" 
              v-model="settings.general.contactEmail" 
              @change="markAsChanged('general')"
            />
          </div>
          
          <div class="form-group">
            <label for="contact-phone">Téléphone de contact</label>
            <input 
              type="tel" 
              id="contact-phone" 
              v-model="settings.general.contactPhone" 
              @change="markAsChanged('general')"
            />
          </div>
          
          <div class="form-group">
            <label for="support-hours">Heures de support</label>
            <input 
              type="text" 
              id="support-hours" 
              v-model="settings.general.supportHours" 
              @change="markAsChanged('general')"
            />
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Localisation</h3>
          
          <div class="form-group">
            <label for="default-language">Langue par défaut</label>
            <select 
              id="default-language" 
              v-model="settings.general.defaultLanguage"
              @change="markAsChanged('general')"
            >
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="default-timezone">Fuseau horaire</label>
            <select 
              id="default-timezone" 
              v-model="settings.general.timezone"
              @change="markAsChanged('general')"
            >
              <option value="Africa/Abidjan">Abidjan (GMT+0)</option>
              <option value="Africa/Accra">Accra (GMT+0)</option>
              <option value="Africa/Dakar">Dakar (GMT+0)</option>
              <option value="Africa/Lagos">Lagos (GMT+1)</option>
              <option value="Africa/Casablanca">Casablanca (GMT+1)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="default-currency">Devise</label>
            <select 
              id="default-currency" 
              v-model="settings.general.currency"
              @change="markAsChanged('general')"
            >
              <option value="XOF">Franc CFA (FCFA)</option>
              <option value="NGN">Naira (₦)</option>
              <option value="GHS">Cedi ghanéen (₵)</option>
              <option value="USD">Dollar américain ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="date-format">Format de date</label>
            <select 
              id="date-format" 
              v-model="settings.general.dateFormat"
              @change="markAsChanged('general')"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="time-format">Format d'heure</label>
            <select 
              id="time-format" 
              v-model="settings.general.timeFormat"
              @change="markAsChanged('general')"
            >
              <option value="24h">24 heures</option>
              <option value="12h">12 heures (AM/PM)</option>
            </select>
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Maintenance</h3>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Mode maintenance</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.general.maintenanceMode"
                  @change="markAsChanged('general')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
            <div class="form-hint">
              Lorsque le mode maintenance est activé, seuls les administrateurs peuvent accéder à la plateforme.
            </div>
          </div>
          
          <div class="form-group" v-if="settings.general.maintenanceMode">
            <label for="maintenance-message">Message de maintenance</label>
            <textarea 
              id="maintenance-message" 
              v-model="settings.general.maintenanceMessage" 
              rows="3"
              @change="markAsChanged('general')"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="version">Version de l'application</label>
            <input 
              type="text" 
              id="version" 
              v-model="settings.general.version" 
              readonly
            />
          </div>
        </div>
      </div>

      <!-- Paramètres de livraison -->
      <div class="settings-section" v-if="activeTab === 'delivery'">
        <h2>Paramètres de livraison</h2>
        
        <div class="settings-group">
          <h3>Tarification</h3>
          
          <div class="form-group">
            <label for="base-delivery-fee">Frais de livraison de base (FCFA)</label>
            <input 
              type="number" 
              id="base-delivery-fee" 
              v-model.number="settings.delivery.baseDeliveryFee" 
              min="0"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="fee-per-km">Frais par kilomètre (FCFA)</label>
            <input 
              type="number" 
              id="fee-per-km" 
              v-model.number="settings.delivery.feePerKm" 
              min="0"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="min-delivery-fee">Frais de livraison minimum (FCFA)</label>
            <input 
              type="number" 
              id="min-delivery-fee" 
              v-model.number="settings.delivery.minDeliveryFee" 
              min="0"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="max-delivery-fee">Frais de livraison maximum (FCFA)</label>
            <input 
              type="number" 
              id="max-delivery-fee" 
              v-model.number="settings.delivery.maxDeliveryFee" 
              min="0"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="night-delivery-surcharge">Supplément pour livraison de nuit (%)</label>
            <input 
              type="number" 
              id="night-delivery-surcharge" 
              v-model.number="settings.delivery.nightDeliverySurcharge" 
              min="0"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="weekend-delivery-surcharge">Supplément pour livraison le weekend (%)</label>
            <input 
              type="number" 
              id="weekend-delivery-surcharge" 
              v-model.number="settings.delivery.weekendDeliverySurcharge" 
              min="0"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="rain-delivery-surcharge">Supplément pour livraison sous la pluie (%)</label>
            <input 
              type="number" 
              id="rain-delivery-surcharge" 
              v-model.number="settings.delivery.rainDeliverySurcharge" 
              min="0"
              @change="markAsChanged('delivery')"
            />
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Limites et restrictions</h3>
          
          <div class="form-group">
            <label for="max-delivery-distance">Distance maximale de livraison (km)</label>
            <input 
              type="number" 
              id="max-delivery-distance" 
              v-model.number="settings.delivery.maxDeliveryDistance" 
              min="0"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="max-delivery-weight">Poids maximum par livraison (kg)</label>
            <input 
              type="number" 
              id="max-delivery-weight" 
              v-model.number="settings.delivery.maxDeliveryWeight" 
              min="0"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="max-delivery-items">Nombre maximum d'articles par livraison</label>
            <input 
              type="number" 
              id="max-delivery-items" 
              v-model.number="settings.delivery.maxDeliveryItems" 
              min="0"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="delivery-hours-start">Heures de livraison - Début</label>
            <input 
              type="time" 
              id="delivery-hours-start" 
              v-model="settings.delivery.deliveryHoursStart"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="delivery-hours-end">Heures de livraison - Fin</label>
            <input 
              type="time" 
              id="delivery-hours-end" 
              v-model="settings.delivery.deliveryHoursEnd"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Livraisons le weekend</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.delivery.weekendDelivery"
                  @change="markAsChanged('delivery')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Livraisons de nuit</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.delivery.nightDelivery"
                  @change="markAsChanged('delivery')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Délais</h3>
          
          <div class="form-group">
            <label for="bid-timeout">Délai d'expiration des offres (minutes)</label>
            <input 
              type="number" 
              id="bid-timeout" 
              v-model.number="settings.delivery.bidTimeout" 
              min="1"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="pickup-timeout">Délai pour récupérer la commande (minutes)</label>
            <input 
              type="number" 
              id="pickup-timeout" 
              v-model.number="settings.delivery.pickupTimeout" 
              min="1"
              @change="markAsChanged('delivery')"
            />
          </div>
          
          <div class="form-group">
            <label for="delivery-timeout">Délai pour livrer la commande (minutes)</label>
            <input 
              type="number" 
              id="delivery-timeout" 
              v-model.number="settings.delivery.deliveryTimeout" 
              min="1"
              @change="markAsChanged('delivery')"
            />
          </div>
        </div>
      </div>

      <!-- Paramètres de paiement -->
      <div class="settings-section" v-if="activeTab === 'payment'">
        <h2>Paramètres de paiement</h2>
        
        <div class="settings-group">
          <h3>Commissions</h3>
          
          <div class="form-group">
            <label for="platform-commission">Commission de la plateforme (%)</label>
            <input 
              type="number" 
              id="platform-commission" 
              v-model.number="settings.payment.platformCommission" 
              min="0" 
              max="100"
              step="0.1"
              @change="markAsChanged('payment')"
            />
          </div>
          
          <div class="form-group">
            <label for="courier-commission">Commission des coursiers (%)</label>
            <input 
              type="number" 
              id="courier-commission" 
              v-model.number="settings.payment.courierCommission" 
              min="0" 
              max="100"
              step="0.1"
              @change="markAsChanged('payment')"
            />
          </div>
          
          <div class="form-group">
            <label for="business-commission">Commission des entreprises (%)</label>
            <input 
              type="number" 
              id="business-commission" 
              v-model.number="settings.payment.businessCommission" 
              min="0" 
              max="100"
              step="0.1"
              @change="markAsChanged('payment')"
            />
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Méthodes de paiement</h3>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Paiement en espèces</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.payment.enableCashPayment"
                  @change="markAsChanged('payment')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Paiement par carte bancaire</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.payment.enableCardPayment"
                  @change="markAsChanged('payment')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Paiement mobile (Orange Money, MTN Money, etc.)</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.payment.enableMobilePayment"
                  @change="markAsChanged('payment')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group" v-if="settings.payment.enableMobilePayment">
            <label>Services de paiement mobile activés</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.payment.enableOrangeMoney"
                  @change="markAsChanged('payment')"
                />
                Orange Money
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.payment.enableMtnMoney"
                  @change="markAsChanged('payment')"
                />
                MTN Money
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.payment.enableMoovMoney"
                  @change="markAsChanged('payment')"
                />
                Moov Money
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.payment.enableWave"
                  @change="markAsChanged('payment')"
                />
                Wave
              </label>
            </div>
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Paiements aux partenaires</h3>
          
          <div class="form-group">
            <label for="min-payout-amount">Montant minimum pour les paiements (FCFA)</label>
            <input 
              type="number" 
              id="min-payout-amount" 
              v-model.number="settings.payment.minPayoutAmount" 
              min="0"
              @change="markAsChanged('payment')"
            />
          </div>
          
          <div class="form-group">
            <label for="payout-schedule">Fréquence des paiements</label>
            <select 
              id="payout-schedule" 
              v-model="settings.payment.payoutSchedule"
              @change="markAsChanged('payment')"
            >
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="biweekly">Bimensuel</option>
              <option value="monthly">Mensuel</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="payout-day">Jour de paiement</label>
            <select 
              id="payout-day" 
              v-model="settings.payment.payoutDay"
              @change="markAsChanged('payment')"
              :disabled="settings.payment.payoutSchedule === 'daily'"
            >
              <option v-if="settings.payment.payoutSchedule === 'weekly' || settings.payment.payoutSchedule === 'biweekly'" value="monday">Lundi</option>
              <option v-if="settings.payment.payoutSchedule === 'weekly' || settings.payment.payoutSchedule === 'biweekly'" value="tuesday">Mardi</option>
              <option v-if="settings.payment.payoutSchedule === 'weekly' || settings.payment.payoutSchedule === 'biweekly'" value="wednesday">Mercredi</option>
              <option v-if="settings.payment.payoutSchedule === 'weekly' || settings.payment.payoutSchedule === 'biweekly'" value="thursday">Jeudi</option>
              <option v-if="settings.payment.payoutSchedule === 'weekly' || settings.payment.payoutSchedule === 'biweekly'" value="friday">Vendredi</option>
              <option v-if="settings.payment.payoutSchedule === 'weekly' || settings.payment.payoutSchedule === 'biweekly'" value="saturday">Samedi</option>
              <option v-if="settings.payment.payoutSchedule === 'weekly' || settings.payment.payoutSchedule === 'biweekly'" value="sunday">Dimanche</option>
              <template v-if="settings.payment.payoutSchedule === 'monthly'">
                <option v-for="day in 31" :key="day" :value="day">{{ day }}</option>
              </template>
            </select>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Paiements automatiques</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.payment.automaticPayouts"
                  @change="markAsChanged('payment')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
            <div class="form-hint">
              Lorsque cette option est activée, les paiements sont effectués automatiquement selon la fréquence définie.
            </div>
          </div>
        </div>
      </div>

      <!-- Paramètres de notification -->
      <div class="settings-section" v-if="activeTab === 'notification'">
        <h2>Paramètres de notification</h2>
        
        <div class="settings-group">
          <h3>Email</h3>
          
          <div class="form-group">
            <label for="email-sender-name">Nom de l'expéditeur</label>
            <input 
              type="text" 
              id="email-sender-name" 
              v-model="settings.notification.emailSenderName" 
              @change="markAsChanged('notification')"
            />
          </div>
          
          <div class="form-group">
            <label for="email-sender-address">Adresse de l'expéditeur</label>
            <input 
              type="email" 
              id="email-sender-address" 
              v-model="settings.notification.emailSenderAddress" 
              @change="markAsChanged('notification')"
            />
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Notifications par email</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.enableEmailNotifications"
                  @change="markAsChanged('notification')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group" v-if="settings.notification.enableEmailNotifications">
            <label>Types de notifications par email</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.emailNewAccount"
                  @change="markAsChanged('notification')"
                />
                Création de compte
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.emailNewDelivery"
                  @change="markAsChanged('notification')"
                />
                Nouvelle livraison
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.emailDeliveryStatus"
                  @change="markAsChanged('notification')"
                />
                Changement de statut de livraison
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.emailPayment"
                  @change="markAsChanged('notification')"
                />
                Paiements
              </label>
            </div>
          </div>
        </div>
        
        <div class="settings-group">
          <h3>SMS</h3>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Notifications par SMS</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.enableSmsNotifications"
                  @change="markAsChanged('notification')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group" v-if="settings.notification.enableSmsNotifications">
            <label>Types de notifications par SMS</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.smsVerification"
                  @change="markAsChanged('notification')"
                />
                Vérification de compte
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.smsDeliveryStatus"
                  @change="markAsChanged('notification')"
                />
                Changement de statut de livraison
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.smsPayment"
                  @change="markAsChanged('notification')"
                />
                Paiements
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="sms-daily-limit">Limite quotidienne de SMS par utilisateur</label>
            <input 
              type="number" 
              id="sms-daily-limit" 
              v-model.number="settings.notification.smsDailyLimit" 
              min="0"
              @change="markAsChanged('notification')"
            />
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Notifications push</h3>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Notifications push</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.enablePushNotifications"
                  @change="markAsChanged('notification')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group" v-if="settings.notification.enablePushNotifications">
            <label>Types de notifications push</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.pushNewDelivery"
                  @change="markAsChanged('notification')"
                />
                Nouvelle livraison
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.pushDeliveryStatus"
                  @change="markAsChanged('notification')"
                />
                Changement de statut de livraison
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.pushChat"
                  @change="markAsChanged('notification')"
                />
                Messages de chat
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="settings.notification.pushPromotion"
                  @change="markAsChanged('notification')"
                />
                Promotions et offres
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Paramètres de sécurité -->
      <div class="settings-section" v-if="activeTab === 'security'">
        <h2>Paramètres de sécurité</h2>
        
        <div class="settings-group">
          <h3>Authentification</h3>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Authentification à deux facteurs (2FA)</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.security.enable2FA"
                  @change="markAsChanged('security')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
            <div class="form-hint">
              Lorsque cette option est activée, les utilisateurs peuvent configurer l'authentification à deux facteurs pour leur compte.
            </div>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>2FA obligatoire pour les administrateurs</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.security.require2FAForAdmins"
                  @change="markAsChanged('security')"
                  :disabled="!settings.security.enable2FA"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label for="session-timeout">Délai d'expiration de session (minutes)</label>
            <input 
              type="number" 
              id="session-timeout" 
              v-model.number="settings.security.sessionTimeout" 
              min="5"
              @change="markAsChanged('security')"
            />
          </div>
          
          <div class="form-group">
            <label for="max-login-attempts">Nombre maximum de tentatives de connexion</label>
            <input 
              type="number" 
              id="max-login-attempts" 
              v-model.number="settings.security.maxLoginAttempts" 
              min="1"
              @change="markAsChanged('security')"
            />
          </div>
          
          <div class="form-group">
            <label for="lockout-duration">Durée de verrouillage après échec (minutes)</label>
            <input 
              type="number" 
              id="lockout-duration" 
              v-model.number="settings.security.lockoutDuration" 
              min="1"
              @change="markAsChanged('security')"
            />
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Politique de mot de passe</h3>
          
          <div class="form-group">
            <label for="min-password-length">Longueur minimale du mot de passe</label>
            <input 
              type="number" 
              id="min-password-length" 
              v-model.number="settings.security.minPasswordLength" 
              min="6"
              @change="markAsChanged('security')"
            />
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Exiger des lettres majuscules</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.security.requireUppercase"
                  @change="markAsChanged('security')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Exiger des lettres minuscules</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.security.requireLowercase"
                  @change="markAsChanged('security')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Exiger des chiffres</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.security.requireNumbers"
                  @change="markAsChanged('security')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Exiger des caractères spéciaux</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.security.requireSpecialChars"
                  @change="markAsChanged('security')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label for="password-expiry-days">Expiration du mot de passe (jours, 0 = jamais)</label>
            <input 
              type="number" 
              id="password-expiry-days" 
              v-model.number="settings.security.passwordExpiryDays" 
              min="0"
              @change="markAsChanged('security')"
            />
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Vérification</h3>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Vérification d'email obligatoire</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.security.requireEmailVerification"
                  @change="markAsChanged('security')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Vérification de téléphone obligatoire</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.security.requirePhoneVerification"
                  @change="markAsChanged('security')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Vérification d'identité pour les coursiers</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.security.requireCourierIdentityVerification"
                  @change="markAsChanged('security')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Vérification d'entreprise pour les commerçants</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.security.requireBusinessVerification"
                  @change="markAsChanged('security')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Paramètres d'intégration -->
      <div class="settings-section" v-if="activeTab === 'integration'">
        <h2>Paramètres d'intégration</h2>
        
        <div class="settings-group">
          <h3>API</h3>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Activer l'API publique</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.integration.enablePublicApi"
                  @change="markAsChanged('integration')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div class="form-group">
            <label for="api-rate-limit">Limite de requêtes API (par minute)</label>
            <input 
              type="number" 
              id="api-rate-limit" 
              v-model.number="settings.integration.apiRateLimit" 
              min="1"
              @change="markAsChanged('integration')"
            />
          </div>
          
          <div class="form-group">
            <label for="api-key-expiry-days">Expiration des clés API (jours, 0 = jamais)</label>
            <input 
              type="number" 
              id="api-key-expiry-days" 
              v-model.number="settings.integration.apiKeyExpiryDays" 
              min="0"
              @change="markAsChanged('integration')"
            />
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Services de cartographie</h3>
          
          <div class="form-group">
            <label for="map-provider">Fournisseur de cartes</label>
            <select 
              id="map-provider" 
              v-model="settings.integration.mapProvider"
              @change="markAsChanged('integration')"
            >
              <option value="google">Google Maps</option>
              <option value="mapbox">Mapbox</option>
              <option value="osm">OpenStreetMap</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="map-api-key">Clé API de cartographie</label>
            <input 
              type="text" 
              id="map-api-key" 
              v-model="settings.integration.mapApiKey" 
              @change="markAsChanged('integration')"
            />
          </div>
          
          <div class="form-group">
            <label for="geocoding-provider">Fournisseur de géocodage</label>
            <select 
              id="geocoding-provider" 
              v-model="settings.integration.geocodingProvider"
              @change="markAsChanged('integration')"
            >
              <option value="google">Google Maps</option>
              <option value="mapbox">Mapbox</option>
              <option value="osm">OpenStreetMap</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="geocoding-api-key">Clé API de géocodage</label>
            <input 
              type="text" 
              id="geocoding-api-key" 
              v-model="settings.integration.geocodingApiKey" 
              @change="markAsChanged('integration')"
            />
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Services de paiement</h3>
          
          <div class="form-group">
            <label for="payment-gateway">Passerelle de paiement principale</label>
            <select 
              id="payment-gateway" 
              v-model="settings.integration.paymentGateway"
              @change="markAsChanged('integration')"
            >
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="cinetpay">CinetPay</option>
              <option value="flutterwave">Flutterwave</option>
              <option value="paystack">Paystack</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="payment-api-key">Clé API de paiement</label>
            <input 
              type="text" 
              id="payment-api-key" 
              v-model="settings.integration.paymentApiKey" 
              @change="markAsChanged('integration')"
            />
          </div>
          
          <div class="form-group">
            <label for="payment-secret-key">Clé secrète de paiement</label>
            <input 
              type="password" 
              id="payment-secret-key" 
              v-model="settings.integration.paymentSecretKey" 
              @change="markAsChanged('integration')"
            />
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              <span>Mode test (sandbox)</span>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="settings.integration.paymentSandboxMode"
                  @change="markAsChanged('integration')"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>
        
        <div class="settings-group">
          <h3>Services de messagerie</h3>
          
          <div class="form-group">
            <label for="sms-provider">Fournisseur de SMS</label>
            <select 
              id="sms-provider" 
              v-model="settings.integration.smsProvider"
              @change="markAsChanged('integration')"
            >
              <option value="twilio">Twilio</option>
              <option value="nexmo">Nexmo (Vonage)</option>
              <option value="africas_talking">Africa's Talking</option>
              <option value="orange_sms">Orange SMS</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="sms-api-key">Clé API SMS</label>
            <input 
              type="text" 
              id="sms-api-key" 
              v-model="settings.integration.smsApiKey" 
              @change="markAsChanged('integration')"
            />
          </div>
          
          <div class="form-group">
            <label for="sms-secret-key">Clé secrète SMS</label>
            <input 
              type="password" 
              id="sms-secret-key" 
              v-model="settings.integration.smsSecretKey" 
              @change="markAsChanged('integration')"
            />
          </div>
          
          <div class="form-group">
            <label for="sms-sender-id">ID d'expéditeur SMS</label>
            <input 
              type="text" 
              id="sms-sender-id" 
              v-model="settings.integration.smsSenderId" 
              @change="markAsChanged('integration')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Chargement -->
    <div class="loading-container" v-if="loading">
      <div class="spinner"></div>
      <p>Chargement des paramètres...</p>
    </div>

    <!-- Bouton de sauvegarde flottant -->
    <div class="floating-save-button" v-if="hasChanges && !loading">
      <button class="btn btn-primary" @click="saveAllSettings" :disabled="saving">
        <font-awesome-icon icon="spinner" spin v-if="saving" class="mr-1" />
        <font-awesome-icon icon="save" v-else />
        Enregistrer les modifications
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { fetchSystemSettingsManager, updateSystemSettingsManager } from '@/api/manager'

export default {
  name: 'SettingsView',
  setup() {
    // État
    const loading = ref(true)
    const saving = ref(false)
    const activeTab = ref('general')
    const changedSections = ref([])
    
    const tabs = [
      { id: 'general', label: 'Général', icon: 'cog' },
      { id: 'delivery', label: 'Livraison', icon: 'truck' },
      { id: 'payment', label: 'Paiement', icon: 'money-bill-wave' },
      { id: 'notification', label: 'Notifications', icon: 'bell' },
      { id: 'security', label: 'Sécurité', icon: 'shield-alt' },
      { id: 'integration', label: 'Intégrations', icon: 'plug' }
    ]
    
    const settings = reactive({
      general: {
        platformName: '',
        platformDescription: '',
        contactEmail: '',
        contactPhone: '',
        supportHours: '',
        defaultLanguage: 'fr',
        timezone: 'Africa/Abidjan',
        currency: 'XOF',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        maintenanceMode: false,
        maintenanceMessage: '',
        version: '1.0.0'
      },
      delivery: {
        baseDeliveryFee: 500,
        feePerKm: 100,
        minDeliveryFee: 500,
        maxDeliveryFee: 5000,
        nightDeliverySurcharge: 20,
        weekendDeliverySurcharge: 10,
        rainDeliverySurcharge: 15,
        maxDeliveryDistance: 30,
        maxDeliveryWeight: 20,
        maxDeliveryItems: 50,
        deliveryHoursStart: '08:00',
        deliveryHoursEnd: '22:00',
        weekendDelivery: true,
        nightDelivery: true,
        bidTimeout: 15,
        pickupTimeout: 30,
        deliveryTimeout: 60
      },
      payment: {
        platformCommission: 10,
        courierCommission: 80,
        businessCommission: 5,
        enableCashPayment: true,
        enableCardPayment: true,
        enableMobilePayment: true,
        enableOrangeMoney: true,
        enableMtnMoney: true,
        enableMoovMoney: true,
        enableWave: true,
        minPayoutAmount: 5000,
        payoutSchedule: 'weekly',
        payoutDay: 'monday',
        automaticPayouts: true
      },
      notification: {
        emailSenderName: 'Service de livraison',
        emailSenderAddress: 'noreply@example.com',
        enableEmailNotifications: true,
        emailNewAccount: true,
        emailNewDelivery: true,
        emailDeliveryStatus: true,
        emailPayment: true,
        enableSmsNotifications: true,
        smsVerification: true,
        smsDeliveryStatus: true,
        smsPayment: true,
        smsDailyLimit: 10,
        enablePushNotifications: true,
        pushNewDelivery: true,
        pushDeliveryStatus: true,
        pushChat: true,
        pushPromotion: false
      },
      security: {
        enable2FA: true,
        require2FAForAdmins: true,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        minPasswordLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        passwordExpiryDays: 90,
        requireEmailVerification: true,
        requirePhoneVerification: true,
        requireCourierIdentityVerification: true,
        requireBusinessVerification: true
      },
      integration: {
        enablePublicApi: false,
        apiRateLimit: 100,
        apiKeyExpiryDays: 365,
        mapProvider: 'google',
        mapApiKey: '',
        geocodingProvider: 'google',
        geocodingApiKey: '',
        paymentGateway: 'cinetpay',
        paymentApiKey: '',
        paymentSecretKey: '',
        paymentSandboxMode: true,
        smsProvider: 'africas_talking',
        smsApiKey: '',
        smsSecretKey: '',
        smsSenderId: 'DeliveryApp'
      }
    })

    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        const response = await fetchSystemSettingsManager()
        
        // Mettre à jour les paramètres avec les données récupérées
        Object.keys(response).forEach(section => {
          if (settings[section]) {
            Object.keys(response[section]).forEach(key => {
              if (settings[section][key] !== undefined) {
                settings[section][key] = response[section][key]
              }
            })
          }
        })
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
      } finally {
        loading.value = false
      }
    }

    const markAsChanged = (section) => {
      if (!changedSections.value.includes(section)) {
        changedSections.value.push(section)
      }
    }

    const saveAllSettings = async () => {
      if (!hasChanges.value) return

      saving.value = true
      try {
        const settingsToSave = {}
        changedSections.value.forEach(section => {
          settingsToSave[section] = settings[section]
        })
        
        await updateSystemSettingsManager(settingsToSave)
        changedSections.value = []
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des paramètres:', error)
      } finally {
        saving.value = false
      }
    }

    const refreshData = () => {
      if (changedSections.value.length > 0) {
        if (confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment actualiser?')) {
          fetchData()
          changedSections.value = []
        }
      } else {
        fetchData()
      }
    }

    // Propriétés calculées
    const hasChanges = computed(() => changedSections.value.length > 0)

    // Cycle de vie
    onMounted(() => {
      fetchData()
    })

    return {
      loading,
      saving,
      settings,
      activeTab,
      tabs,
      hasChanges,
      markAsChanged,
      saveAllSettings,
      refreshData
    }
  }
}
</script>
