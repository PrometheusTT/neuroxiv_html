<template>
  <div class="news-container">
    <h1>Website Updates</h1>
    <div class="timeline">
      <div
        v-for="group in groupedUpdates"
        :key="group.date"
        class="timeline-group"
      >
        <div class="timeline-date">
          {{ group.date }}
        </div>
        <div class="timeline-items">
          <div
            v-for="(item, index) in group.items"
            :key="index"
            class="timeline-item"
          >
            <div class="timeline-content">
              <p>{{ item.description }}</p> <!-- Displaying only description -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      updates: [
        { date: '2024-04-27', description: 'Release Version 2.0 of NeuroXiv.' },
        { date: '2024-04-27', description: 'Release Version 2.0 of neuron dataset.' }
        // Add more updates here...
      ]
    }
  },
  computed: {
    groupedUpdates () {
      // Group updates by date
      const groups = {}
      this.updates.forEach(update => {
        if (!groups[update.date]) {
          groups[update.date] = { date: update.date, items: [] }
        }
        groups[update.date].items.push(update)
      })
      return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date descending
    }
  }
}
</script>

<style scoped>
.news-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.timeline {
    border-left: 2px solid #007bff;
    padding: 10px;
    margin-top: 20px;
    position: relative;
}

.timeline-group {
    margin-bottom: 30px;
}

.timeline-date {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #007bff;
}

.timeline-items {
    margin-left: 20px;
}

.timeline-item {
    margin-bottom: 20px;
    position: relative;
}

.timeline-content {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #ddd;
    position: relative;
    margin-left: 30px;
}

.timeline-content:before {
    content: '';
    position: absolute;
    left: -18px;
    top: 10px;
    width: 10px;
    height: 10px;
    background-color: #007bff;
    border-radius: 50%;
}
</style>
