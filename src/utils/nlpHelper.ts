const { containerBootstrap } = require('@nlpjs/core')
const { Nlp } = require('@nlpjs/nlp')
const { LangEn } = require('@nlpjs/lang-en-min')
const { DecisionTreeClassifier } = require('ml-cart')
const searchConditions = require('../components/mouse/search_conditions.json')

interface SearchCondition {
  key: string;
  label: string;
}

interface SearchValue {
  [key: string]: any;
}

interface TrainingData {
  input: string[];
  output: string;
}

class NlpHelper {
  private nlp: any;
  private decisionTree: any;
  private searchConditionsMap: Record<string, any>;
  private trainingData: TrainingData[];
  private synonymMap: Record<string, string>;

  constructor () {
    this.searchConditionsMap = this.buildSearchConditionsMap()
    this.trainingData = this.getTrainingData()
    this.synonymMap = this.buildSynonymMap() // Synonym map for binary and range handling
  }

  async initializeNlp (): Promise<void> {
    const container = await containerBootstrap()
    container.use(Nlp)
    container.use(LangEn)

    this.nlp = container.get('nlp')
    this.nlp.settings.autoSave = false
    this.nlp.addLanguage('en')

    // 尝试加载模型
    try {
      await this.nlp.load('model.nlp') // 加载保存的模型文件
      console.log('model is loaded')
    } catch (error) {
      console.log('start training model')
      this.addIntentsAndEntities(searchConditions)
      await this.nlp.train()
      await this.nlp.save('model.nlp') // 训练完成后保存模型
    }

    this.trainDecisionTree()
  }
  async loadModelFromData (modelData: any) {
    // Initialize the NLP container
    const container = await containerBootstrap()
    container.use(Nlp)
    container.use(LangEn)

    this.nlp = container.get('nlp')
    this.nlp.settings.autoSave = false
    this.nlp.addLanguage('en')

    // Ensure `modelData` is not undefined or null
    if (!modelData) {
      console.error('No model data available to load.')
      return
    }

    // Load the model data
    try {
      await this.nlp.fromJSON(modelData)
      console.log('Model loaded from cached data')
    } catch (error) {
      console.error('Failed to load model from cached data:', error)
    }
  }

  private buildSearchConditionsMap (): Record<string, any> {
    const map: Record<string, any> = {}

    function traverse (node: any): void {
      if (node.querry_name) {
        map[node.querry_name] = {
          type: node.type,
          candidates: node.candidates || [],
          display_name: node.display_name
        }
      }
      if (node.children) {
        node.children.forEach(traverse)
      }
    }

    traverse(searchConditions)
    return map
  }

  private buildSynonymMap (): Record<string, string> {
    return {
      'axon length': 'axon_total_length',
      'dendrite length': 'dendrite_total_length',
      'apical dendrite': 'has_apical',
      'axon': 'has_axon',
      'have recon axon': 'has_recon_axon:true',
      'with recon axon': 'has_recon_axon:true',
      'has recon axon': 'has_recon_axon:true',
      'without recon axon': 'has_recon_axon:false',
      'have recon dendrite': 'has_recon_den:true',
      'with recon dendrite': 'has_recon_den:true',
      'has recon dendrite': 'has_recon_den:true',
      'without recon dendrite': 'has_recon_den:false',
      'have apical dendrite': 'has_apical:true',
      'with apical dendrite': 'has_apical:true',
      'has apical dendrite': 'has_apical:true',
      'without apical dendrite': 'has_apical:false',
      'below': '<',
      'above': '>',
      'less than': '<',
      'more than': '>',
      'greater than': '>'
    }
  }

  private addIntentsAndEntities (json: any): void {
    const addEntities = (node: any): void => {
      if (node.querry_name) {
        if (node.type === 'category' && node.candidates) {
          node.candidates.forEach((candidate: string) => {
            this.nlp.addNerRuleOptionTexts('en', node.querry_name, [candidate], [candidate.toLowerCase()])
          })
        } else if (node.type === 'binary') {
          this.nlp.addNerRuleOptionTexts('en', node.querry_name, ['yes'], ['yes', 'true', '1'])
          this.nlp.addNerRuleOptionTexts('en', node.querry_name, ['no'], ['no', 'false', '0'])
        }
      }

      if (node.children) {
        node.children.forEach(addEntities)
      }
    }

    const addIntents = (node: any): void => {
      if (node.querry_name) {
        const patterns = [
          `search for ${node.display_name}`,
          `show ${node.display_name}`,
          `find ${node.display_name}`
        ]

        patterns.forEach((pattern) => {
          this.nlp.addDocument('en', pattern, node.querry_name)
        })
      }

      if (node.children) {
        node.children.forEach(addIntents)
      }
    }

    addEntities(json)
    addIntents(json)
  }

  private getTrainingData (): TrainingData[] {
    const trainingData: TrainingData[] = []

    Object.values(this.searchConditionsMap).forEach((condition) => {
      // eslint-disable-next-line camelcase
      const { querry_name, type, candidates, display_name } = condition

      if (type === 'category') {
        candidates.forEach((candidate: string) => {
          trainingData.push({
            input: ['show', display_name.toLowerCase(), candidate.toLowerCase()],
            output: querry_name
          })
        })
      } else if (type === 'binary') {
        ['true', 'false'].forEach((binaryValue) => {
          trainingData.push({
            input: ['find', display_name.toLowerCase(), binaryValue],
            output: querry_name
          })
        })
      } else if (type === 'range') {
        trainingData.push({
          input: ['set', display_name.toLowerCase(), 'min', 'value'],
          // eslint-disable-next-line camelcase
          output: `${querry_name}_min`
        })
        trainingData.push({
          input: ['set', display_name.toLowerCase(), 'max', 'value'],
          // eslint-disable-next-line camelcase
          output: `${querry_name}_max`
        })
      }
    })

    return trainingData
  }

  private ensureConsistentDimensions (data: number[][]): number[][] {
    const maxLength = Math.max(...data.map((row) => row.length))
    return data.map((row) => {
      const newRow = [...row]
      while (newRow.length < maxLength) {
        newRow.push(0)
      }
      return newRow
    })
  }

  private trainDecisionTree (): void {
    const inputs = this.trainingData.map((item) => item.input)
    const outputs = this.trainingData.map((item) => item.output)

    let encodedInputs = this.encodeCategoricalData(inputs)
    encodedInputs = this.ensureConsistentDimensions(encodedInputs)
    const uniqueOutputValues = Array.from(new Set(outputs))
    const encodedOutputs = outputs.map((output) => uniqueOutputValues.indexOf(output))

    if (encodedInputs.length !== encodedOutputs.length) {
      throw new Error('Input and output arrays must have the same length.')
    }

    this.decisionTree = new DecisionTreeClassifier()
    this.decisionTree.train(encodedInputs, encodedOutputs)
  }
  // eslint-disable-next-line camelcase
  private mapValueToQuerryName (value: string): { querry_name: string; matchedValue: any } | null {
    value = this.normalizeValue(value)
    // eslint-disable-next-line camelcase
    for (const querry_name in this.searchConditionsMap) {
      const condition = this.searchConditionsMap[querry_name]
      const normalizedCandidates = condition.candidates.map((candidate: any) => String(candidate).toLowerCase())

      if (normalizedCandidates.includes(value.toLowerCase())) {
        // Return the exact match from candidates in original case
        const exactMatch = condition.candidates.find((candidate: string) => candidate.toLowerCase() === value.toLowerCase())
        return { querry_name, matchedValue: exactMatch } // Use the exact match
      }
    }
    return null
  }

  private normalizeValue (value: string): string {
    const tokens = value.toLowerCase().split(/\s+/)
    const normalizedTokens = tokens.map(token => this.synonymMap[token] || token)
    const normalizedPhrase = normalizedTokens.join(' ')

    // Check if the entire normalized phrase matches a key in the synonym map
    return this.synonymMap[normalizedPhrase] || normalizedPhrase
  }

  private extractEntitiesFromQuery (query: string): { entity: string; option: any }[] {
    const entities: { entity: string; option: any }[] = []
    const words = query.toLowerCase().split(/\s+/)

    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j <= words.length; j++) {
        const phrase = words.slice(i, j).join(' ')
        const normalizedPhrase = this.normalizeValue(phrase) // Use improved normalization

        const matchResult = this.mapValueToQuerryName(normalizedPhrase)
        if (matchResult) {
          entities.push({ entity: matchResult.querry_name, option: matchResult.matchedValue }) // Map to exact format
          i = j - 1
          break
        }
      }
    }

    return entities
  }

  async processQuery (naturalLanguageQuery: string): Promise<{ data: SearchCondition[]; value: SearchValue[] }> {
    const extractedEntities = this.extractEntitiesFromQuery(naturalLanguageQuery)

    const nlpResult: { data: SearchCondition[]; value: SearchValue[] } = {
      data: [],
      value: []
    }

    extractedEntities.forEach((entity) => {
      const condition = this.searchConditionsMap[entity.entity]
      if (condition) {
        if (condition.type === 'binary') {
          const value = (entity.option === 'true' || entity.option === 'yes')
          nlpResult.data.push({ key: entity.entity, label: value.toString() })
          nlpResult.value.push({ [entity.entity]: value })
        } else if (condition.type === 'category') {
          nlpResult.data.push({ key: entity.entity, label: entity.option })
          nlpResult.value.push({ [entity.entity]: entity.option })
        } else if (condition.type === 'range') {
          const [comparison, value] = this.extractComparisonAndValue(entity.option)
          if (comparison && value !== null) {
            nlpResult.data.push({ key: entity.entity, label: `${comparison} ${value}` })
            nlpResult.value.push({ [entity.entity]: { comparison, value } })
          } else {
            const minValue = condition.default_min || 0
            const maxValue = condition.default_max || 100
            nlpResult.data.push({ key: entity.entity, label: `min: ${minValue}, max: ${maxValue}` })
            nlpResult.value.push({ min: minValue, max: maxValue })
          }
        }
      } else {
        console.warn(`No matching querry_name found for value "${entity.option}".`)
      }
    })

    if (nlpResult.data.length > 0) {
      const intent = this.predictIntent(nlpResult.data.map((item) => item.label))
      this.processIntent(intent, nlpResult)
    } else {
      console.warn(`No valid entities found in the query: "${naturalLanguageQuery}"`)
    }

    return nlpResult
  }

  private extractComparisonAndValue (option: string): [string | null, number | null] {
    const comparisonRegex = /(above|below|greater than|less than|more than|lesser than|over|under|>=|<=|>|<)\s*(\d+)/i
    const match = option.match(comparisonRegex)
    if (match) {
      const comparison = this.synonymMap[match[1].toLowerCase()] || match[1]
      const value = parseFloat(match[2])
      return [comparison, value]
    }
    return [null, null]
  }

  private predictIntent (userInput: string[]): string {
    const tokens = this.encodeCategoricalData([userInput])
    return this.decisionTree.predict(tokens)[0] as string
  }

  private encodeCategoricalData (data: string[][]): number[][] {
    const encodedData: number[][] = []
    const uniqueValuesMap: Record<string, number> = {}

    let currentIndex = 0

    data.forEach((row) => {
      const encodedRow: number[] = row.map((value) => {
        if (!(value in uniqueValuesMap)) {
          uniqueValuesMap[value] = currentIndex++
        }
        return uniqueValuesMap[value]
      })
      encodedData.push(encodedRow)
    })

    return encodedData
  }

  private processIntent (intent: string, nlpResult: { data: SearchCondition[]; value: SearchValue[] }): void {
    const condition = this.searchConditionsMap[intent]

    if (condition) {
      if (condition.type === 'category') {
        const selectedCategory = condition.candidates[0]
        nlpResult.data.push({ key: condition.querry_name, label: selectedCategory })
        nlpResult.value.push(selectedCategory)
      } else if (condition.type === 'binary') {
        const binaryValue = !!condition.candidates.includes(true)
        nlpResult.data.push({ key: condition.querry_name, label: binaryValue.toString() })
        // @ts-ignore
        nlpResult.value.push(binaryValue)
      } else if (condition.type === 'range') {
        const minValue = condition.default_min || 0
        const maxValue = condition.default_max || 100
        nlpResult.data.push({ key: condition.querry_name, label: `min: ${minValue}, max: ${maxValue}` })
        nlpResult.value.push({ min: minValue, max: maxValue })
      }
    } else {
      console.warn(`No matching search condition found for intent "${intent}".`)
    }
  }
}

export default NlpHelper
