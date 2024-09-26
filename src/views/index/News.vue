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
        { date: '2023-11-14', description: 'Introduced a sophisticated AI-Powered data open mining engine enabling natural language queries and contextual data retrieval from a vast knowledge base.' },
        { date: '2023-12-23', description: 'Deployed an advanced chatbot module with real-time streaming responses, providing an interactive user experience akin to ChatGPT.' },
        { date: '2024-03-25', description: 'Implemented a cutting-edge Mixture of Experts (MoE) architecture for neuron data summarization, enabling multi-model integration for refined outputs.' },
        { date: '2024-04-23', description: 'Expanded AI capabilities by integrating client-side inference computation, optimizing resource utilization for on-device processing.' },
        { date: '2024-08-31', description: 'Launched NeuroXiv Version 2.0, significantly enhancing performance and data accessibility.' },
        { date: '2024-07-28', description: 'Released Version 2.0 of the neuron dataset, expanding the repository with 175149 unique neurons.' }
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
