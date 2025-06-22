
<template>
  <div class="calendar-view">
    <div class="header">
      <h1>📅 Calendrier des Livraisons Planifiées</h1>
      <p class="subtitle">Vue d'ensemble des planifications et exécutions</p>
      
      <div class="header-actions">
        <button @click="refreshData" class="btn btn-secondary" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Actualiser
        </button>
        <button @click="exportCalendar" class="btn btn-outline">
          <i class="fas fa-download"></i>
          Exporter
        </button>
      </div>
    </div>

    <!-- Contrôles du calendrier -->
    <div class="calendar-controls">
      <div class="nav-controls">
        <button @click="previousMonth" class="btn btn-outline">
          <i class="fas fa-chevron-left"></i>
          Précédent
        </button>
        <h2 class="current-month">{{ formatMonth(currentDate) }}</h2>
        <button @click="nextMonth" class="btn btn-outline">
          <i class="fas fa-chevron-right"></i>
          Suivant
        </button>
      </div>

      <div class="view-controls">
        <button 
          @click="setView('month')" 
          :class="['btn', currentView === 'month' ? 'btn-primary' : 'btn-outline']"
        >
          Mois
        </button>
        <button 
          @click="setView('week')" 
          :class="['btn', currentView === 'week' ? 'btn-primary' : 'btn-outline']"
        >
          Semaine
        </button>
        <button 
          @click="setView('day')" 
          :class="['btn', currentView === 'day' ? 'btn-primary' : 'btn-outline']"
        >
          Jour
        </button>
      </div>

      <div class="filters">
        <select v-model="statusFilter" @change="loadEvents">
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="paused">En pause</option>
          <option value="completed">Terminé</option>
        </select>
      </div>
    </div>

    <!-- Légende -->
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color scheduled"></div>
        <span>Planifiée</span>
      </div>
      <div class="legend-item">
        <div class="legend-color executed"></div>
        <span>Exécutée</span>
      </div>
      <div class="legend-item">
        <div class="legend-color failed"></div>
        <span>Échouée</span>
      </div>
      <div class="legend-item">
        <div class="legend-color paused"></div>
        <span>En pause</span>
      </div>
    </div>

    <!-- Calendrier -->
    <div class="calendar-container">
      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Chargement du calendrier...
      </div>

      <!-- Vue mois -->
      <div v-else-if="currentView === 'month'" class="calendar-month">
        <div class="calendar-header">
          <div class="day-header" v-for="day in weekDays" :key="day">
            {{ day }}
          </div>
        </div>
        
        <div class="calendar-grid">
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index"
            :class="['calendar-day', {
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'has-events': day.events.length > 0
            }]"
            @click="selectDay(day)"
          >
            <div class="day-number">{{ day.date.getDate() }}</div>
            <div class="events-preview">
              <div 
                v-for="event in day.events.slice(0, 3)" 
                :key="event.id"
                :class="['event-dot', getEventClass(event)]"
                :title="event.title"
                @click.stop="selectEvent(event)"
              ></div>
              <div v-if="day.events.length > 3" class="more-events">
                +{{ day.events.length - 3 }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vue semaine -->
      <div v-else-if="currentView === 'week'" class="calendar-week">
        <div class="week-header">
          <div class="time-column"></div>
          <div 
            v-for="day in weekDays" 
            :key="day.date"
            class="day-column"
          >
            <div class="day-label">{{ formatWeekDay(day.date) }}</div>
            <div class="day-number">{{ day.date.getDate() }}</div>
          </div>
        </div>
        
        <div class="week-body">
          <div class="time-slots">
            <div 
              v-for="hour in 24" 
              :key="hour"
              class="time-slot"
            >
              {{ formatHour(hour - 1) }}
            </div>
          </div>
          
          <div class="days-grid">
            <div 
              v-for="day in weekDays" 
              :key="day.date"
              class="day-column"
            >
              <div 
                v-for="event in day.events" 
                :key="event.id"
                :class="['week-event', getEventClass(event)]"
                :style="getEventStyle(event)"
                @click="selectEvent(event)"
              >
                <div class="event-time">{{ formatEventTime(event.start) }}</div>
                <div class="event-title">{{ event.title }}</div>
                <div class="event-client">{{ event.client_name }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vue jour -->
      <div v-else-if="currentView === 'day'" class="calendar-day-view">
        <div class="day-header">
          <h3>{{ formatDayHeader(currentDate) }}</h3>
        </div>
        
        <div class="day-events">
          <div v-if="dayEvents.length === 0" class="no-events">
            Aucun événement planifié pour cette journée
          </div>
          
          <div 
            v-for="event in dayEvents" 
            :key="event.id"
            :class="['day-event', getEventClass(event)]"
            @click="selectEvent(event)"
          >
            <div class="event-time">{{ formatEventTime(event.start) }}</div>
            <div class="event-content">
              <h4>{{ event.title }}</h4>
              <p class="event-client">Client: {{ event.client_name }}</p>
              <p class="event-route">{{ event.pickup_address }} → {{ event.delivery_address }}</p>
              <div class="event-meta">
                <span class="event-status">{{ getStatusLabel(event.status) }}</span>
                <span class="event-recurrence">{{ getRecurrenceLabel(event.recurrence_type) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal détails événement -->
    <div v-if="selectedEvent" class="modal-overlay" @click="selectedEvent = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedEvent.title }}</h2>
          <button @click="selectedEvent = null" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="event-details">
            <div class="detail-group">
              <h3>Informations générales</h3>
              <div class="detail-item">
                <strong>Client :</strong> {{ selectedEvent.client_name }}
              </div>
              <div class="detail-item">
                <strong>Date/Heure :</strong> {{ formatEventDateTime(selectedEvent.start) }}
              </div>
              <div class="detail-item">
                <strong>Statut :</strong> 
                <span :class="`status ${selectedEvent.status}`">
                  {{ getStatusLabel(selectedEvent.status) }}
                </span>
              </div>
              <div class="detail-item">
                <strong>Récurrence :</strong> {{ getRecurrenceLabel(selectedEvent.recurrence_type) }}
              </div>
            </div>

            <div class="detail-group">
              <h3>Itinéraire</h3>
              <div class="detail-item">
                <strong>Ramassage :</strong> {{ selectedEvent.pickup_address }}
              </div>
              <div class="detail-item">
                <strong>Livraison :</strong> {{ selectedEvent.delivery_address }}
              </div>
            </div>

            <div v-if="selectedEvent.negotiations && selectedEvent.negotiations.length > 0" class="detail-group">
              <h3>Négociations</h3>
              <div class="negotiations-list">
                <div 
                  v-for="negotiation in selectedEvent.negotiations" 
                  :key="negotiation.id"
                  class="negotiation-item"
                >
                  <div class="negotiation-header">
                    <strong>{{ negotiation.courier_name }}</strong>
                    <span class="negotiation-status">{{ negotiation.status }}</span>
                  </div>
                  <div class="negotiation-details">
                    Prix proposé: {{ formatPrice(negotiation.proposed_price) }} FCFA
                    <div v-if="negotiation.message" class="negotiation-message">
                      "{{ negotiation.message }}"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="viewScheduleDetails(selectedEvent.schedule_id)" class="btn btn-primary">
              Voir la planification
            </button>
            <button @click="selectedEvent = null" class="btn btn-secondary">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import scheduledDeliveryService from '../../api/scheduled-deliveries'
import { useToast } from '../../composables/useToast'

export default {
  name: 'ScheduledDeliveriesCalendarView',
  setup() {
    const { toast } = useToast()
    return { toast }
  },
  data() {
    return {
      loading: false,
      currentDate: new Date(),
      currentView: 'month', // month, week, day
      events: [],
      selectedEvent: null,
      statusFilter: '',
      weekDays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    }
  },
  computed: {
    calendarDays() {
      if (this.currentView !== 'month') return []
      
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      
      // Premier jour du mois
      const firstDay = new Date(year, month, 1)
      // Dernier jour du mois
      const lastDay = new Date(year, month + 1, 0)
      
      // Premier lundi de la grille (peut être du mois précédent)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1))
      
      // Dernier dimanche de la grille (peut être du mois suivant)
      const endDate = new Date(lastDay)
      endDate.setDate(endDate.getDate() + (7 - lastDay.getDay()) % 7)
      
      const days = []
      const current = new Date(startDate)
      
      while (current <= endDate) {
        const dayEvents = this.getEventsForDate(current)
        days.push({
          date: new Date(current),
          isCurrentMonth: current.getMonth() === month,
          isToday: this.isToday(current),
          events: dayEvents
        })
        current.setDate(current.getDate() + 1)
      }
      
      return days
    },

    weekDays() {
      if (this.currentView !== 'week') return []
      
      const startOfWeek = new Date(this.currentDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      
      const days = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        days.push({
          date: date,
          events: this.getEventsForDate(date)
        })
      }
      
      return days
    },

    dayEvents() {
      if (this.currentView !== 'day') return []
      return this.getEventsForDate(this.currentDate)
    }
  },
  async mounted() {
    await this.loadEvents()
  },
  methods: {
    async loadEvents() {
      this.loading = true
      try {
        // Calculer la plage de dates à charger
        const { startDate, endDate } = this.getDateRange()
        
        const response = await scheduledDeliveryService.getCalendarEvents(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
        
        if (response.success) {
          this.events = response.events || []
        } else {
          this.events = []
        }
      } catch (error) {
        console.error('Erreur lors du chargement des événements:', error)
        this.toast.error('Erreur lors du chargement du calendrier')
        this.events = []
      } finally {
        this.loading = false
      }
    },

    async refreshData() {
      await this.loadEvents()
    },

    getDateRange() {
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      
      let startDate, endDate
      
      if (this.currentView === 'month') {
        // Premier jour du mois précédent
        startDate = new Date(year, month - 1, 1)
        // Dernier jour du mois suivant
        endDate = new Date(year, month + 2, 0)
      } else if (this.currentView === 'week') {
        // Début de la semaine
        startDate = new Date(this.currentDate)
        const day = startDate.getDay()
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1)
        startDate.setDate(diff)
        
        // Fin de la semaine
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
      } else {
        // Jour courant
        startDate = new Date(this.currentDate)
        endDate = new Date(this.currentDate)
      }
      
      return { startDate, endDate }
    },

    getEventsForDate(date) {
      const dateStr = date.toISOString().split('T')[0]
      return this.events.filter(event => {
        const eventDate = new Date(event.start).toISOString().split('T')[0]
        return eventDate === dateStr
      })
    },

    isToday(date) {
      const today = new Date()
      return date.toDateString() === today.toDateString()
    },

    previousMonth() {
      const newDate = new Date(this.currentDate)
      if (this.currentView === 'month') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else if (this.currentView === 'week') {
        newDate.setDate(newDate.getDate() - 7)
      } else {
        newDate.setDate(newDate.getDate() - 1)
      }
      this.currentDate = newDate
      this.loadEvents()
    },

    nextMonth() {
      const newDate = new Date(this.currentDate)
      if (this.currentView === 'month') {
        newDate.setMonth(newDate.getMonth() + 1)
      } else if (this.currentView === 'week') {
        newDate.setDate(newDate.getDate() + 7)
      } else {
        newDate.setDate(newDate.getDate() + 1)
      }
      this.currentDate = newDate
      this.loadEvents()
    },

    setView(view) {
      this.currentView = view
      this.loadEvents()
    },

    selectDay(day) {
      this.currentDate = day.date
      this.setView('day')
    },

    selectEvent(event) {
      this.selectedEvent = event
    },

    getEventClass(event) {
      const classes = []
      
      if (event.status === 'active') {
        classes.push('scheduled')
      } else if (event.status === 'executed') {
        classes.push('executed')
      } else if (event.status === 'failed') {
        classes.push('failed')
      } else if (event.status === 'paused') {
        classes.push('paused')
      }
      
      return classes
    },

    getEventStyle(event) {
      const startHour = new Date(event.start).getHours()
      const duration = event.duration || 1 // Durée en heures
      
      return {
        top: `${startHour * 60}px`,
        height: `${duration * 60}px`
      }
    },

    formatMonth(date) {
      return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      })
    },

    formatWeekDay(date) {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short' 
      })
    },

    formatDayHeader(date) {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    formatHour(hour) {
      return `${hour.toString().padStart(2, '0')}:00`
    },

    formatEventTime(dateTime) {
      return new Date(dateTime).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatEventDateTime(dateTime) {
      return new Date(dateTime).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getStatusLabel(status) {
      const labels = {
        active: 'Actif',
        paused: 'En pause',
        executed: 'Exécuté',
        failed: 'Échoué',
        completed: 'Terminé'
      }
      return labels[status] || status
    },

    getRecurrenceLabel(recurrence) {
      const labels = {
        none: 'Ponctuel',
        daily: 'Quotidien',
        weekly: 'Hebdomadaire',
        monthly: 'Mensuel'
      }
      return labels[recurrence] || recurrence
    },

    formatPrice(price) {
      return new Intl.NumberFormat('fr-FR').format(price)
    },

    viewScheduleDetails(scheduleId) {
      this.$router.push(`/manager/scheduled-deliveries/${scheduleId}`)
    },

    exportCalendar() {
      // Implémentation de l'export (CSV, PDF, etc.)
      this.toast.info('Fonctionnalité d\'export en cours de développement')
    }
  }
}
</script>

<style scoped>
.calendar-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 28px;
}

.subtitle {
  color: #7f8c8d;
  margin: 5px 0 0 0;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.calendar-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 20px;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.current-month {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  min-width: 200px;
  text-align: center;
}

.view-controls {
  display: flex;
  gap: 5px;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.legend {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.legend-color.scheduled {
  background: #3498db;
}

.legend-color.executed {
  background: #27ae60;
}

.legend-color.failed {
  background: #e74c3c;
}

.legend-color.paused {
  background: #f39c12;
}

.calendar-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  min-height: 600px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #7f8c8d;
  font-size: 16px;
  gap: 10px;
}

/* Vue mois */
.calendar-month {
  height: 100%;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.day-header {
  padding: 15px 10px;
  text-align: center;
  font-weight: 600;
  color: #2c3e50;
  border-right: 1px solid #e9ecef;
}

.day-header:last-child {
  border-right: none;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  height: 500px;
}

.calendar-day {
  border-right: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
}

.calendar-day:hover {
  background: #f8f9fa;
}

.calendar-day.other-month {
  color: #adb5bd;
  background: #f8f9fa;
}

.calendar-day.today {
  background: #e3f2fd;
}

.calendar-day.has-events {
  border-left: 3px solid #3498db;
}

.day-number {
  font-weight: 600;
  margin-bottom: 5px;
}

.events-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: pointer;
}

.event-dot.scheduled {
  background: #3498db;
}

.event-dot.executed {
  background: #27ae60;
}

.event-dot.failed {
  background: #e74c3c;
}

.event-dot.paused {
  background: #f39c12;
}

.more-events {
  font-size: 10px;
  color: #7f8c8d;
  margin-top: 2px;
}

/* Vue semaine */
.calendar-week {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.week-header {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.time-column {
  border-right: 1px solid #e9ecef;
}

.day-column {
  padding: 10px;
  text-align: center;
  border-right: 1px solid #e9ecef;
}

.day-label {
  font-size: 12px;
  color: #7f8c8d;
  text-transform: uppercase;
}

.day-number {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.week-body {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  flex: 1;
  overflow-y: auto;
}

.time-slots {
  border-right: 1px solid #e9ecef;
}

.time-slot {
  height: 60px;
  padding: 5px;
  font-size: 12px;
  color: #7f8c8d;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  align-items: flex-start;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.day-column {
  position: relative;
  border-right: 1px solid #e9ecef;
  min-height: 1440px; /* 24 heures × 60px */
}

.week-event {
  position: absolute;
  left: 2px;
  right: 2px;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  overflow: hidden;
  z-index: 1;
}

.week-event.scheduled {
  background: #3498db;
  color: white;
}

.week-event.executed {
  background: #27ae60;
  color: white;
}

.week-event.failed {
  background: #e74c3c;
  color: white;
}

.week-event.paused {
  background: #f39c12;
  color: white;
}

.event-time {
  font-weight: 600;
  font-size: 10px;
}

.event-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-client {
  font-size: 10px;
  opacity: 0.8;
}

/* Vue jour */
.calendar-day-view {
  padding: 20px;
}

.day-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #3498db;
}

.day-header h3 {
  margin: 0;
  color: #2c3e50;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.no-events {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-style: italic;
}

.day-event {
  display: flex;
  background: white;
  border-left: 4px solid #3498db;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.day-event:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.day-event.scheduled {
  border-left-color: #3498db;
}

.day-event.executed {
  border-left-color: #27ae60;
}

.day-event.failed {
  border-left-color: #e74c3c;
}

.day-event.paused {
  border-left-color: #f39c12;
}

.day-event .event-time {
  background: #f8f9fa;
  padding: 15px;
  font-weight: 600;
  color: #2c3e50;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-content {
  padding: 15px;
  flex: 1;
}

.event-content h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 16px;
}

.event-content p {
  margin: 4px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.event-meta {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.event-status,
.event-recurrence {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.event-status {
  background: #e3f2fd;
  color: #1976d2;
}

.event-recurrence {
  background: #f3e5f5;
  color: #7b1fa2;
}

/* Boutons */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-outline {
  background: transparent;
  color: #3498db;
  border: 1px solid #3498db;
}

.btn-outline:hover:not(:disabled) {
  background: #3498db;
  color: white;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 5px;
}

.modal-close:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 20px;
}

.event-details {
  margin-bottom: 20px;
}

.detail-group {
  margin-bottom: 20px;
}

.detail-group h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 16px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 5px;
}

.detail-item {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.4;
}

.detail-item strong {
  color: #2c3e50;
  font-weight: 500;
}

.status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status.active {
  background: #d4edda;
  color: #155724;
}

.status.paused {
  background: #fff3cd;
  color: #856404;
}

.status.executed {
  background: #d1ecf1;
  color: #0c5460;
}

.status.failed {
  background: #f8d7da;
  color: #721c24;
}

.negotiations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.negotiation-item {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 6px;
  border-left: 3px solid #3498db;
}

.negotiation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.negotiation-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  background: #e9ecef;
  color: #495057;
}

.negotiation-details {
  font-size: 13px;
  color: #6c757d;
}

.negotiation-message {
  font-style: italic;
  margin-top: 5px;
  color: #495057;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

/* Responsive */
@media (max-width: 768px) {
  .calendar-view {
    padding: 15px;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .calendar-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .nav-controls,
  .view-controls {
    justify-content: center;
  }

  .current-month {
    min-width: auto;
  }

  .legend {
    justify-content: center;
  }

  .calendar-grid {
    grid-template-rows: repeat(6, 80px);
    height: 480px;
  }

  .calendar-day {
    padding: 4px;
  }

  .day-number {
    font-size: 12px;
  }

  .events-preview {
    gap: 1px;
  }

  .event-dot {
    width: 6px;
    height: 6px;
  }

  .week-body {
    display: none; /* Masquer la vue semaine sur mobile */
  }

  .day-event {
    flex-direction: column;
  }

  .day-event .event-time {
    min-width: auto;
    padding: 8px 15px;
  }
}

@media (max-width: 480px) {
  .view-controls {
    flex-direction: column;
    gap: 5px;
  }

  .legend {
    flex-direction: column;
    gap: 8px;
  }

  .calendar-grid {
    grid-template-rows: repeat(6, 60px);
    height: 360px;
  }
}
</style>
