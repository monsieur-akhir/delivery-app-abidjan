<template>
  <div class="collaborators-list">
    <div
      v-for="(collaborator, index) in collaborators"
      :key="collaborator.id || index"
      class="collaborator-card"
    >
      {{ collaborator.name }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'CollaboratorsListComponent',
  props: {
    collaborators: {
      type: Array,
      required: true,
    },
  },
}
</script>

<style scoped>
.collaborators-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collaborator-card {
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
}
</style>
