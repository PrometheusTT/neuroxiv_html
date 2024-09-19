import { concat } from 'lodash'

const ImportNlpHelper = require('./nlpHelper')

async function testNlpHelper () {
  const nlpHelper = new ImportNlpHelper()
  await nlpHelper.initializeNlp()

  const query = 'search Primary somatosensory area, nose, layer 2/3 neurons from ION with dendrite that project to mop'
  const result = await nlpHelper.processQuery(query)
  console.log('FINAL-------------------')
  console.log('search mos  neurons from ION that project to mop:')
  console.log('Data:', result.data)
  console.log('Value:', result.value)
}

testNlpHelper().catch((error) => {
  console.error('Error during testing:', error)
})
