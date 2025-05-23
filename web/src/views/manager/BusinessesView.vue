.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: #333;
}

.empty-state p {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 1.5rem;
  max-width: 400px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 0.25rem solid rgba(0, 86, 179, 0.1);
  border-radius: 50%;
  border-top-color: #0056b3;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  font-size: 0.875rem;
  color: #6c757d;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content.document-modal {
  max-width: 900px;
  height: 90vh;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.btn-close {
  background-color: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-body.document-viewer {
  padding: 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.business-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section {
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  padding: 1rem;
}

.detail-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #333;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.business-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.business-logo-large {
  width: 5rem;
  height: 5rem;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-right: 1.5rem;
  background-color: #f8f9fa;
}

.business-logo-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.business-avatar-large {
  width: 5rem;
  height: 5rem;
  border-radius: 0.5rem;
  background-color: #0056b3;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.5rem;
  margin-right: 1.5rem;
}

.business-header-info {
  flex: 1;
}

.business-header-info h4 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: #333;
}

.business-header-info p {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-weight: 500;
  color: #333;
}

.address-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.address-details p {
  margin: 0;
  font-size: 0.875rem;
  color: #495057;
}

.address-map {
  margin-top: 1rem;
  height: 200px;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #e9ecef;
}

.map-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.map-placeholder i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.document-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  background-color: #f8f9fa;
}

.document-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.25rem;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.document-icon i {
  font-size: 1.25rem;
  color: #6c757d;
}

.document-info {
  flex: 1;
}

.document-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.document-meta {
  font-size: 0.75rem;
  color: #6c757d;
  display: flex;
  gap: 1rem;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
}

.document-status-actions {
  display: flex;
  gap: 0.25rem;
}

.empty-documents {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6c757d;
  text-align: center;
}

.empty-documents i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.empty-documents p {
  margin: 0;
}

.hours-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.hours-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  background-color: #f8f9fa;
}

.hours-day {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.hours-time {
  font-size: 0.875rem;
  color: #495057;
}

.hours-closed {
  font-size: 0.875rem;
  color: #6c757d;
  font-style: italic;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  background-color: #f8f9fa;
  text-align: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6c757d;
}

.recent-orders {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-item {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  background-color: #f8f9fa;
}

.order-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.order-id {
  font-weight: 600;
  color: #333;
  margin-right: 0.75rem;
}

.order-date {
  font-size: 0.75rem;
  color: #6c757d;
  margin-right: auto;
}

.order-status {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
}

.order-pending {
  background-color: #ffeeba;
  color: #856404;
}

.order-confirmed {
  background-color: #b8daff;
  color: #004085;
}

.order-preparing {
  background-color: #c3e6cb;
  color: #155724;
}

.order-ready {
  background-color: #d1ecf1;
  color: #0c5460;
}

.order-in-delivery {
  background-color: #bee5eb;
  color: #0c5460;
}

.order-delivered {
  background-color: #d4edda;
  color: #155724;
}

.order-cancelled {
  background-color: #f5c6cb;
  color: #721c24;
}

.order-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: #495057;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.review-item {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  background-color: #f8f9fa;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.review-author {
  font-weight: 500;
  color: #333;
  margin-right: 0.75rem;
}

.review-date {
  font-size: 0.75rem;
  color: #6c757d;
  margin-right: auto;
}

.review-rating {
  color: #ffc107;
}

.review-content {
  font-size: 0.875rem;
  color: #495057;
  margin-bottom: 0.5rem;
}

.review-actions {
  display: flex;
  justify-content: flex-end;
}

.verification-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: #495057;
}

.form-group select,
.form-group input,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.document-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.document-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.document-pdf {
  width: 100%;
  height: 100%;
  border: none;
}

.document-unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.document-unsupported i {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.document-unsupported p {
  margin: 0 0 1rem;
  color: #495057;
}

.document-verification-actions {
  display: flex;
  gap: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
  }
  
  .modal-content {
    width: 95%;
  }
  
  .detail-grid,
  .stats-grid,
  .hours-list {
    grid-template-columns: 1fr;
  }
  
  .business-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .business-logo-large,
  .business-avatar-large {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
  
  .actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .filters-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn {
    width: 100%;
  }
  
  .document-verification-actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>
