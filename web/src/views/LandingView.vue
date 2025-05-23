<template>
  <div class="landing-page">
    <header class="landing-header">
      <div class="container">
        <div class="logo">
          <img src="@/assets/logo.png" alt="Livraison Abidjan" />
          <h1>Livraison Abidjan</h1>
        </div>
        <nav class="nav-menu">
          <ul>
            <li><a href="#features">Fonctionnalités</a></li>
            <li><a href="#how-it-works">Comment ça marche</a></li>
            <li><a href="#pricing">Tarifs</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
        <div class="auth-buttons">
          <router-link to="/login" class="btn btn-outline">Connexion</router-link>
          <router-link to="/register" class="btn btn-primary">Inscription</router-link>
        </div>
        <button class="mobile-menu-toggle" @click="toggleMobileMenu">
          <font-awesome-icon :icon="mobileMenuOpen ? 'times' : 'bars'" />
        </button>
      </div>
      <div class="mobile-menu" :class="{ 'open': mobileMenuOpen }">
        <ul>
          <li><a href="#features" @click="closeMobileMenu">Fonctionnalités</a></li>
          <li><a href="#how-it-works" @click="closeMobileMenu">Comment ça marche</a></li>
          <li><a href="#pricing" @click="closeMobileMenu">Tarifs</a></li>
          <li><a href="#contact" @click="closeMobileMenu">Contact</a></li>
          <li class="mobile-auth">
            <router-link to="/login" class="btn btn-outline" @click="closeMobileMenu">Connexion</router-link>
            <router-link to="/register" class="btn btn-primary" @click="closeMobileMenu">Inscription</router-link>
          </li>
        </ul>
      </div>
    </header>

    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1>Livraison rapide et fiable à Abidjan</h1>
          <p>Faites livrer vos colis, repas et courses en quelques clics. Notre réseau de coursiers est disponible 24/7 pour vous servir.</p>
          <div class="hero-buttons">
            <router-link to="/register" class="btn btn-primary btn-lg">Commencer maintenant</router-link>
            <a href="#how-it-works" class="btn btn-outline btn-lg">En savoir plus</a>
          </div>
        </div>
        <div class="hero-image">
          <img src="@/assets/hero-image.png" alt="Livraison Abidjan" />
        </div>
      </div>
    </section>

    <section id="features" class="features-section">
      <div class="container">
        <div class="section-header">
          <h2>Nos fonctionnalités</h2>
          <p>Découvrez comment notre plateforme facilite vos livraisons</p>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon icon="map-marked-alt" />
            </div>
            <h3>Suivi en temps réel</h3>
            <p>Suivez votre livraison en temps réel sur la carte et recevez des notifications à chaque étape.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon icon="hand-holding-usd" />
            </div>
            <h3>Paiement sécurisé</h3>
            <p>Payez en toute sécurité via Orange Money, MTN Mobile Money ou en espèces à la livraison.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon icon="store" />
            </div>
            <h3>Marketplace intégrée</h3>
            <p>Commandez directement auprès de nos commerçants partenaires et faites-vous livrer.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon icon="users" />
            </div>
            <h3>Coursiers vérifiés</h3>
            <p>Tous nos coursiers sont vérifiés et formés pour assurer un service de qualité.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon icon="clock" />
            </div>
            <h3>Livraison 24/7</h3>
            <p>Notre service est disponible 24h/24 et 7j/7 pour répondre à vos besoins urgents.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon icon="star" />
            </div>
            <h3>Système d'évaluation</h3>
            <p>Évaluez vos livraisons et aidez-nous à maintenir un service de qualité.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="how-it-works" class="how-it-works-section">
      <div class="container">
        <div class="section-header">
          <h2>Comment ça marche</h2>
          <p>Trois étapes simples pour faire livrer vos colis</p>
        </div>
        <div class="steps-container">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Créez votre demande</h3>
              <p>Remplissez le formulaire avec les détails de votre livraison : adresse de ramassage, adresse de livraison et description du colis.</p>
            </div>
            <div class="step-image">
              <img src="@/assets/step1.png" alt="Créez votre demande" />
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Choisissez votre coursier</h3>
              <p>Recevez des offres de nos coursiers et choisissez celui qui vous convient le mieux en fonction du prix et des évaluations.</p>
            </div>
            <div class="step-image">
              <img src="@/assets/step2.png" alt="Choisissez votre coursier" />
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Suivez votre livraison</h3>
              <p>Suivez votre livraison en temps réel sur la carte et recevez des notifications à chaque étape jusqu'à la livraison.</p>
            </div>
            <div class="step-image">
              <img src="@/assets/step3.png" alt="Suivez votre livraison" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="pricing" class="pricing-section">
      <div class="container">
        <div class="section-header">
          <h2>Nos tarifs</h2>
          <p>Des prix compétitifs pour tous vos besoins de livraison</p>
        </div>
        <div class="pricing-grid">
          <div class="pricing-card">
            <div class="pricing-header">
              <h3>Standard</h3>
              <div class="pricing-price">
                <span class="price">1000</span>
                <span class="currency">FCFA</span>
                <span class="period">/ livraison</span>
              </div>
            </div>
            <div class="pricing-features">
              <ul>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Livraison dans la même commune
                </li>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Délai de livraison : 1-2 heures
                </li>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Poids max : 5 kg
                </li>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Suivi en temps réel
                </li>
                <li>
                  <font-awesome-icon icon="times" class="feature-excluded" />
                  Assurance colis
                </li>
              </ul>
            </div>
            <div class="pricing-footer">
              <router-link to="/register" class="btn btn-outline btn-block">Choisir ce plan</router-link>
            </div>
          </div>
          <div class="pricing-card featured">
            <div class="pricing-badge">Populaire</div>
            <div class="pricing-header">
              <h3>Express</h3>
              <div class="pricing-price">
                <span class="price">2000</span>
                <span class="currency">FCFA</span>
                <span class="period">/ livraison</span>
              </div>
            </div>
            <div class="pricing-features">
              <ul>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Livraison inter-communes
                </li>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Délai de livraison : 30-60 minutes
                </li>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Poids max : 10 kg
                </li>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Suivi en temps réel
                </li>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Assurance colis jusqu'à 50 000 FCFA
                </li>
              </ul>
            </div>
            <div class="pricing-footer">
              <router-link to="/register" class="btn btn-primary btn-block">Choisir ce plan</router-link>
            </div>
          </div>
          <div class="pricing-card">
            <div class="pricing-header">
              <h3>Business</h3>
              <div class="pricing-price">
                <span class="price">Sur mesure</span>
                <span class="period">Contactez-nous</span>
              </div>
            </div>
            <div class="pricing-features">
              <ul>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Livraisons illimitées
                </li>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Délai de livraison personnalisé
                </li>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Poids et dimensions sur mesure
                </li>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  API d'intégration
                </li>
                <li>
                  <font-awesome-icon icon="check" class="feature-included" />
                  Assurance colis complète
                </li>
              </ul>
            </div>
            <div class="pricing-footer">
              <a href="#contact" class="btn btn-outline btn-block">Nous contacter</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="app-download-section">
      <div class="container">
        <div class="app-download-content">
          <h2>Téléchargez notre application mobile</h2>
          <p>Profitez de toutes nos fonctionnalités directement depuis votre smartphone. Notre application est disponible sur iOS et Android.</p>
          <div class="app-buttons">
            <a href="#" class="app-button">
              <img src="@/assets/app-store.png" alt="App Store" />
            </a>
            <a href="#" class="app-button">
              <img src="@/assets/play-store.png" alt="Play Store" />
            </a>
          </div>
        </div>
        <div class="app-image">
          <img src="@/assets/app-mockup.png" alt="Application mobile" />
        </div>
      </div>
    </section>

    <section id="contact" class="contact-section">
      <div class="container">
        <div class="section-header">
          <h2>Contactez-nous</h2>
          <p>Nous sommes à votre écoute pour toute question ou suggestion</p>
        </div>
        <div class="contact-container">
          <div class="contact-info">
            <div class="contact-item">
              <div class="contact-icon">
                <font-awesome-icon icon="map-marker-alt" />
              </div>
              <div class="contact-text">
                <h3>Adresse</h3>
                <p>Cocody, Abidjan, Côte d'Ivoire</p>
              </div>
            </div>
            <div class="contact-item">
              <div class="contact-icon">
                <font-awesome-icon icon="phone" />
              </div>
              <div class="contact-text">
                <h3>Téléphone</h3>
                <p>+225 07 XX XX XX XX</p>
              </div>
            </div>
            <div class="contact-item">
              <div class="contact-icon">
                <font-awesome-icon icon="envelope" />
              </div>
              <div class="contact-text">
                <h3>Email</h3>
                <p>contact@livraison-abidjan.com</p>
              </div>
            </div>
            <div class="social-media">
              <a href="#" class="social-icon">
                <font-awesome-icon :icon="['fab', 'facebook']" />
              </a>
              <a href="#" class="social-icon">
                <font-awesome-icon :icon="['fab', 'twitter']" />
              </a>
              <a href="#" class="social-icon">
                <font-awesome-icon :icon="['fab', 'instagram']" />
              </a>
              <a href="#" class="social-icon">
                <font-awesome-icon :icon="['fab', 'linkedin']" />
              </a>
            </div>
          </div>
          <div class="contact-form">
            <form @submit.prevent="submitContactForm">
              <div class="form-group">
                <label for="name">Nom complet</label>
                <input type="text" id="name" v-model="contactForm.name" class="form-control" required />
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" v-model="contactForm.email" class="form-control" required />
              </div>
              <div class="form-group">
                <label for="subject">Sujet</label>
                <input type="text" id="subject" v-model="contactForm.subject" class="form-control" required />
              </div>
              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" v-model="contactForm.message" class="form-control" rows="5" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-block" :disabled="contactLoading">
                <font-awesome-icon icon="spinner" spin v-if="contactLoading" class="mr-1" />
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <footer class="landing-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-logo">
            <img src="@/assets/logo.png" alt="Livraison Abidjan" />
            <h2>Livraison Abidjan</h2>
            <p>La solution de livraison rapide et fiable à Abidjan</p>
          </div>
          <div class="footer-links">
            <div class="footer-column">
              <h3>Liens rapides</h3>
              <ul>
                <li><a href="#features">Fonctionnalités</a></li>
                <li><a href="#how-it-works">Comment ça marche</a></li>
                <li><a href="#pricing">Tarifs</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Légal</h3>
              <ul>
                <li><router-link to="/terms">Conditions d'utilisation</router-link></li>
                <li><router-link to="/privacy">Politique de confidentialité</router-link></li>
                <li><router-link to="/refund">Politique de remboursement</router-link></li>
                <li><router-link to="/faq">FAQ</router-link></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Nous rejoindre</h3>
              <ul>
                <li><router-link to="/register?role=courier">Devenir coursier</router-link></li>
                <li><router-link to="/register?role=business">Devenir partenaire</router-link></li>
                <li><a href="#">Carrières</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} Livraison Abidjan. Tous droits réservés.</p>
          <div class="footer-social">
            <a href="#" class="social-icon">
              <font-awesome-icon :icon="['fab', 'facebook']" />
            </a>
            <a href="#" class="social-icon">
              <font-awesome-icon :icon="['fab', 'twitter']" />
            </a>
            <a href="#" class="social-icon">
              <font-awesome-icon :icon="['fab', 'instagram']" />
            </a>
            <a href="#" class="social-icon">
              <font-awesome-icon :icon="['fab', 'linkedin']" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'

export default {
  name: 'LandingView',
  setup() {
    const mobileMenuOpen = ref(false)
    const contactLoading = ref(false)
    
    const contactForm = reactive({
      name: '',
      email: '',
      subject: '',
      message: ''
    })
    
    const currentYear = computed(() => new Date().getFullYear())
    
    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
      
      // Empêcher le défilement du body quand le menu est ouvert
      if (mobileMenuOpen.value) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }
    
    const closeMobileMenu = () => {
      mobileMenuOpen.value = false
      document.body.style.overflow = ''
    }
    
    const submitContactForm = async () => {
      try {
        contactLoading.value = true
        
        // Simuler l'envoi du formulaire
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Réinitialiser le formulaire
        contactForm.name = ''
        contactForm.email = ''
        contactForm.subject = ''
        contactForm.message = ''
        
        // Afficher un message de succès
        alert('Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.')
      } catch (error) {
        alert('Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.')
      } finally {
        contactLoading.value = false
      }
    }
    
    return {
      mobileMenuOpen,
      contactLoading,
      contactForm,
      currentYear,
      toggleMobileMenu,
      closeMobileMenu,
      submitContactForm
    }
  }
}
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background-color: var(--background-color);
}

.landing-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--card-background);
  box-shadow: 0 2px 8px var(--shadow-color);
  z-index: 100;
}

.landing-header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  padding: 0 1.5rem;
}

.logo {
  display: flex;
  align-items: center;
}

.logo img {
  width: 40px;
  height: 40px;
  margin-right: 0.75rem;
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
}

.nav-menu ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-menu li {
  margin: 0 1rem;
}

.nav-menu a {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-menu a:hover {
  color: var(--primary-color);
}

.auth-buttons {
  display: flex;
  gap: 0.75rem;
}

.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 1.5rem;
  cursor: pointer;
}

.mobile-menu {
  display: none;
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--card-background);
  z-index: 99;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.mobile-menu.open {
  transform: translateX(0);
}

.mobile-menu ul {
  list-style: none;
  margin: 0;
  padding: 2rem;
}

.mobile-menu li {
  margin-bottom: 1.5rem;
}

.mobile-menu a {
  color: var(--text-color);
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: 500;
}

.mobile-auth {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.hero-section {
  padding: 160px 0 80px;
  background-color: var(--background-secondary);
}

.hero-section .container {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.hero-content {
  flex: 1;
}

.hero-content h1 {
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.hero-content p {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
}

.hero-image img {
  max-width: 100%;
  height: auto;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.section-header p {
  font-size: 1.25rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.features-section {
  padding: 80px 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 16px var(--shadow-color);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-10px);
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: rgba(255, 107, 0, 0.1);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.feature-card p {
  color: var(--text-secondary);
}

.how-it-works-section {
  padding: 80px 0;
  background-color: var(--background-secondary);
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.step:nth-child(even) {
  flex-direction: row-reverse;
}

.step-number {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.step-content p {
  color: var(--text-secondary);
}

.step-image {
  flex: 1;
  display: flex;
  justify-content: center;
}

.step-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--shadow-color);
}

.pricing-section {
  padding: 80px 0;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.pricing-card {
  background-color: var(--card-background);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px var(--shadow-color);
  position: relative;
}

.pricing-card.featured {
  border: 2px solid var(--primary-color);
  transform: scale(1.05);
}

.pricing-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: var(--primary-color);
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-bottom-left-radius: 8px;
}

.pricing-header {
  padding: 2rem;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
}

.pricing-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.pricing-price {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.price {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.currency {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

.period {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.pricing-features {
  padding: 2rem;
}

.pricing-features ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.pricing-features li {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.pricing-features li:last-child {
  margin-bottom: 0;
}

.feature-included {
  color: var(--success-color);
  margin-right: 0.75rem;
}

.feature-excluded {
  color: var(--danger-color);
  margin-right: 0.75rem;
}

.pricing-footer {
  padding: 2rem;
  border-top: 1px solid var(--border-color);
}

.app-download-section {
  padding: 80px 0;
  background-color: var(--background-secondary);
}

.app-download-section .container {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.app-download-content {
  flex: 1;
}

.app-download-content h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 1.5rem;
}

.app-download-content p {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.app-buttons {
  display: flex;
  gap: 1rem;
}

.app-button img {
  height: 48px;
}

.app-image {
  flex: 1;
  display: flex;
  justify-content: center;
}

.app-image img {
  max-width: 100%;
  height: auto;
}

.contact-section {
  padding: 80px 0;
}

.contact-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

.contact-info {
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 16px var(--shadow-color);
}

.contact-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.contact-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(255, 107, 0, 0.1);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1rem;
  flex-shrink: 0;
}

.contact-text h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.contact-text p {
  color: var(--text-secondary);
}

.social-media {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.social-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 107, 0, 0.1);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.2s ease;
}

.social-icon:hover {
  background-color: var(--primary-color);
  color: white;
}

.contact-form {
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 16px var(--shadow-color);
}

.landing-footer {
  background-color: var(--background-secondary);
  padding: 80px 0 20px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3rem;
}

.footer-logo {
  max-width: 300px;
}

.footer-logo img {
  width: 60px;
  height: 60px;
  margin-bottom: 1rem;
}

.footer-logo h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.footer-logo p {
  color: var(--text-secondary);
}

.footer-links {
  display: flex;
  gap: 3rem;
}

.footer-column h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1.5rem;
}

.footer-column ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.footer-column li {
  margin-bottom: 0.75rem;
}

.footer-column a {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-column a:hover {
  color: var(--primary-color);
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.footer-bottom p {
  color: var(--text-secondary);
}

.footer-social {
  display: flex;
  gap: 1rem;
}

@media (max-width: 992px) {
  .hero-section .container,
  .app-download-section .container {
    flex-direction: column;
  }
  
  .hero-content,
  .app-download-content {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .hero-buttons,
  .app-buttons {
    justify-content: center;
  }
  
  .step,
  .step:nth-child(even) {
    flex-direction: column;
  }
  
  .step-content {
    text-align: center;
  }
  
  .contact-container {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 2rem;
  }
  
  .footer-logo {
    text-align: center;
    margin: 0 auto;
  }
  
  .footer-links {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .nav-menu,
  .auth-buttons {
    display: none;
  }
  
  .mobile-menu-toggle {
    display: block;
  }
  
  .mobile-menu {
    display: block;
  }
  
  .hero-content h1 {
    font-size: 2rem;
  }
  
  .hero-content p,
  .app-download-content p {
    font-size: 1rem;
  }
  
  .section-header h2 {
    font-size: 2rem;
  }
  
  .section-header p {
    font-size: 1rem;
  }
  
  .pricing-grid {
    grid-template-columns: 1fr;
  }
  
  .pricing-card.featured {
    transform: none;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
