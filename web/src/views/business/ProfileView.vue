match('image.*')) {
        alert('Veuillez sélectionner une image')
        return
      }
      
      // Vérifier la taille du fichier (max 1MB)
      if (file.size > 1024 * 1024) {
        alert('La taille du fichier ne doit pas dépasser 1MB')
        return
      }
      
      // Lire le fichier
      const reader = new FileReader()
      reader.onload = (e) => {
        profile.logo = e.target.result
      }
      reader.readAsDataURL(file)
    }
    
    // Déclencher l'upload d'un document
    const triggerDocumentUpload = (type) => {
      if (type === 'siret') {
        siretInput.value.click()
      } else if (type === 'kbis') {
        kbisInput.value.click()
      } else if (type === 'id') {
        idInput.value.click()
      }
    }
    
    // Gérer l'upload d'un document
    const handleDocumentUpload = async (type, event) => {
      const file = event.target.files[0]
      if (!file) return
      
      // Vérifier le type de fichier
      if (!file.type.match('image.*') && !file.type.match('application/pdf')) {
        alert('Veuillez sélectionner une image ou un PDF')
        return
      }
      
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille du fichier ne doit pas dépasser 5MB')
        return
      }
      
      try {
        // Uploader le document
        await uploadBusinessDocument(type, file)
        
        // Mettre à jour le statut de vérification
        if (type === 'siret') {
          profile.kyc.siret_verified = true
        } else if (type === 'kbis') {
          profile.kyc.kbis_verified = true
        } else if (type === 'id') {
          profile.kyc.id_verified = true
        }
        
        // Afficher un message de succès
        alert('Document téléchargé avec succès')
      } catch (error) {
        console.error('Error uploading document:', error)
        alert(`Erreur lors du téléchargement du document: ${error.message}`)
      }
    }
    
    // Obtenir le pourcentage pour une note
    const getRatingPercentage = (rating) => {
      if (!profile.ratings_breakdown || !profile.ratings_count) return 0
      
      const count = profile.ratings_breakdown[rating] || 0
      return (count / profile.ratings_count) * 100
    }
    
    // Obtenir le nombre d'évaluations pour une note
    const getRatingCount = (rating) => {
      if (!profile.ratings_breakdown) return 0
      
      return profile.ratings_breakdown[rating] || 0
    }
    
    // Obtenir la classe CSS pour un statut
    const getStatusClass = (status) => {
      const statusClasses = {
        'active': 'status-active',
        'pending_verification': 'status-pending',
        'suspended': 'status-suspended',
        'inactive': 'status-inactive'
      }
      
      return statusClasses[status] || ''
    }
    
    // Obtenir le libellé pour un statut
    const getStatusLabel = (status) => {
      const statusLabels = {
        'active': 'Actif',
        'pending_verification': 'En attente de vérification',
        'suspended': 'Suspendu',
        'inactive': 'Inactif'
      }
      
      return statusLabels[status] || status
    }
    
    onMounted(() => {
      loadProfile()
    })
    
    return {
      loading,
      isSaving,
      profile,
      businessHours,
      logoInput,
      siretInput,
      kbisInput,
      idInput,
      communes: COMMUNES,
      loadProfile,
      saveProfile,
      refreshData,
      triggerLogoUpload,
      handleLogoUpload,
      triggerDocumentUpload,
      handleDocumentUpload,
      getRatingPercentage,
      getRatingCount,
      getStatusClass,
      getStatusLabel,
      formatDate,
      getInitials
    }
  }
}
</script>

<style scoped>
.profile-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  color: var(--text-secondary);
}

.loading-state svg {
  margin-bottom: 1rem;
}

.profile-content {
  display: flex;
  gap: 1.5rem;
}

.profile-sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  overflow: hidden;
}

.profile-header {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
}

.profile-avatar {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 1rem;
  overflow: hidden;
  background-color: var(--background-secondary);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  background-color: var(--primary-color);
}

.change-avatar {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.change-avatar:hover {
  background-color: var(--primary-color-dark);
}

.hidden-input {
  display: none;
}

.profile-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.25rem;
}

.profile-type {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.profile-info {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  color: var(--text-color);
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-icon {
  width: 16px;
  margin-right: 0.75rem;
  color: var(--text-secondary);
}

.profile-status {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-active {
  background-color: #E8F5E9;
  color: #388E3C;
}

.status-pending {
  background-color: #FFF8E1;
  color: #FFA000;
}

.status-suspended {
  background-color: #FFEBEE;
  color: #D32F2F;
}

.status-inactive {
  background-color: #ECEFF1;
  color: #607D8B;
}

.profile-stats {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.verification-card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1.5rem;
}

.verification-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 1rem;
}

.verification-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.verification-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.verification-item:last-child {
  border-bottom: none;
}

.verification-item.verified {
  color: #388E3C;
}

.verification-icon {
  margin-right: 0.75rem;
}

.verification-actions {
  margin-left: auto;
}

.profile-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-form-card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1.5rem;
}

.profile-form-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group-half {
  flex: 1;
  margin-bottom: 0;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-color);
  background-color: var(--background-color);
  background-clip: padding-box;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: var(--primary-color);
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(255, 107, 0, 0.25);
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.social-icon {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.facebook {
  background-color: #1877F2;
}

.instagram {
  background-color: #E1306C;
}

.twitter {
  background-color: #1DA1F2;
}

.business-hours {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.business-day {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.day-name {
  width: 100px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.day-hours {
  flex: 1;
  display: flex;
  align-items: center;
}

.time-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.day-closed {
  color: var(--text-secondary);
  font-style: italic;
}

.ratings-summary {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.rating-overview {
  flex-shrink: 0;
  width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.rating-score {
  font-size: 3rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.rating-stars {
  margin-bottom: 0.5rem;
}

.star-filled {
  color: var(--primary-color);
}

.star-empty {
  color: var(--border-color);
}

.rating-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.rating-breakdown {
  flex: 1;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.rating-bar:last-child {
  margin-bottom: 0;
}

.rating-label {
  width: 80px;
  font-size: 0.875rem;
  color: var(--text-color);
}

.rating-progress {
  flex: 1;
  height: 8px;
  background-color: var(--background-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.rating-progress-bar {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 4px;
}

.rating-count {
  width: 40px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: right;
}

.recent-ratings h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 1rem;
}

.rating-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rating-item {
  padding: 1rem;
  background-color: var(--background-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.rating-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--background-secondary);
}

.author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 500;
  color: var(--text-color);
}

.rating-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.rating-comment {
  margin-bottom: 0.75rem;
  color: var(--text-color);
}

.rating-delivery {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.empty-ratings {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-ratings svg {
  margin-bottom: 1rem;
}

@media (max-width: 992px) {
  .profile-content {
    flex-direction: column;
  }
  
  .profile-sidebar {
    width: 100%;
  }
  
  .form-row {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .ratings-summary {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .rating-overview {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions .btn {
    flex: 1;
  }
  
  .business-day {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .day-name {
    width: 100%;
  }
  
  .time-input {
    width: 100%;
  }
  
  .rating-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
