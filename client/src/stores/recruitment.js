import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRecruitmentStore = defineStore('recruitment', () => {
  const selectedJobId = ref(localStorage.getItem('selectedJobId') || null)

  function setSelectedJobId(jobId) {
    selectedJobId.value = jobId
    if (jobId) {
      localStorage.setItem('selectedJobId', jobId)
    } else {
      localStorage.removeItem('selectedJobId')
    }
  }

  return {
    selectedJobId,
    setSelectedJobId,
  }
})
