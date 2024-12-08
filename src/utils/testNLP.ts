import { concat } from 'lodash'

const ImportNlpHelper = require('./nlpHelper')

async function testNlpHelper () {
  const nlpHelper = new ImportNlpHelper()
  await nlpHelper.initializeNlp()

  // const query = 'search Primary somatosensory area, nose, layer 2/3 neurons from ION with dendrite that project to mop'
  const query = 'search motor area primary  neurons project to primary motor area'
  const result = await nlpHelper.processQuery(query)
  console.log('FINAL-------------------')
  console.log('Query:', query)
  console.log('Value:', result.value)
}

testNlpHelper().catch((error) => {
  console.error('Error during testing:', error)
})
