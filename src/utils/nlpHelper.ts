const { containerBootstrap } = require('@nlpjs/core')
const { Nlp } = require('@nlpjs/nlp')
const { LangEn } = require('@nlpjs/lang-en-min')
const { DecisionTreeClassifier } = require('ml-cart')
const path = require('path') // 引入 path 模块
const searchConditions = require('../components/mouse/search_conditions.json')
const surfTreeJson = require('../components/mouse/surf_tree.json')
// eslint-disable-next-line camelcase
const surfTreeJson_multi = require('../components/mouse/Allen_Mouse_Brain_CCFv3_multi.json')// 假设 surf_tree.json 在同一目录
const brainRegionFunctionData = require('../components/mouse/brain_regions_functions.json')
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
    private modelFilePath: string;
    // eslint-disable-next-line camelcase
    private surfTreeMap_multi: Record<string, string[]>; // 全称到简称的映射
    private surfTreeMap: Record<string, string>; // 全称到简称的映射
    private brainRegionFunctionMap: Record<string, string[]>; // 脑区与功能映射
    private functionToRegionsMap: Record<string, string[]>; // 功能到脑区反向映射
    public fuzzyMatchEnabled:boolean = false;

    constructor () {
      this.searchConditionsMap = this.buildSearchConditionsMap()
      this.trainingData = this.getTrainingData()
      this.synonymMap = this.buildSynonymMap() // Synonym map for binary and range handling
      this.modelFilePath = path.join(__dirname, 'model.nlp') // 设置模型文件的路径
      this.surfTreeMap_multi = this.buildSurfTreeMap_multi() // 构建全称到简称的映射表
      this.surfTreeMap = this.buildSurfTreeMap()

      // 加载脑区与功能映射
      this.brainRegionFunctionMap = brainRegionFunctionData
      this.functionToRegionsMap = this.buildFunctionToRegionsMap(brainRegionFunctionData)
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
        await this.nlp.load(this.modelFilePath) // 加载保存的模型文件
        console.log('Model is loaded from', this.modelFilePath)
      } catch (error) {
        console.log('Start training model...')
        this.addIntentsAndEntities(searchConditions)
        await this.nlp.train()
      }

      this.trainDecisionTree() // 训练决策树分类器
    }

    private buildFunctionToRegionsMap (brainRegionFunctionFile: Record<string, string[]>): Record<string, string[]> {
      const functionToRegionsMap: Record<string, string[]> = {}

      for (const [region, functions] of Object.entries(brainRegionFunctionFile)) {
        functions.forEach((func) => {
          const normalizedFunc = func.toLowerCase() // 转换为小写键
          if (!functionToRegionsMap[normalizedFunc]) {
            functionToRegionsMap[normalizedFunc] = []
          }
          functionToRegionsMap[normalizedFunc].push(region)
        })
      }

      return functionToRegionsMap
    }
    private buildSearchConditionsMap (): Record<string, any> {
      const map: Record<string, any> = {}

      function traverse (node: any): void {
        if (node.querry_name) {
          const entry: Record<string, any> = {
            type: node.type,
            candidates: node.candidates || [],
            display_name: node.display_name
          }

          // 如果类型是 'range'，则包含范围相关的字段
          if (node.type === 'range') {
            entry['min_value'] = node.min_value
            entry['max_value'] = node.max_value
            entry['default_min'] = node.default_min
            entry['default_max'] = node.default_max
          }

          map[node.querry_name] = entry
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
        'apical dendrite': 'has_apical:true',
        'axon': 'has_recon_axon:true',
        'dendrite': 'has_recon_den:true',
        'with dendrite': 'has_recon_den:true',
        'have axon': 'has_recon_axon:true',
        "don't have axon": 'has_recon_axon:false',
        'do not have axon': 'has_recon_axon:false',
        'with axon': 'has_recon_axon:true',
        'has axon': 'has_recon_axon:true',
        "doesn't have axon": 'has_recon_axon:false',
        'without axon': 'has_recon_axon:false',
        'have dendrite': 'has_recon_den:true',
        "don't have dendrite": 'has_recon_den:false',
        'do not have dendrite': 'has_recon_den:false',
        'has dendrite': 'has_recon_den:true',
        "doesn't have dendrite": 'has_recon_den:false',
        'without dendrite': 'has_recon_den:false',
        'have apical dendrite': 'has_apical:true',
        "don't have apical dendrite": 'has_apical:false',
        'do not have apical dendrite': 'has_apical:false',
        'with apical dendrite': 'has_apical:true',
        'has apical dendrite': 'has_apical:true',
        "doesn't have apical dendrite": 'has_apical:false',
        'without apical dendrite': 'has_apical:false',
        'an apical dendrite': 'has_apical:true',
        'an axon': 'has_recon_axon:true',
        'a dendrite': 'has_recon_den:true',
        'with a dendrite': 'has_recon_den:true',
        'have a axon': 'has_recon_axon:true',
        "don't have an axon": 'has_recon_axon:false',
        'do not have an axon': 'has_recon_axon:false',
        'with an axon': 'has_recon_axon:true',
        'has an axon': 'has_recon_axon:true',
        "doesn't have an axon": 'has_recon_axon:false',
        'without an axon': 'has_recon_axon:false',
        'have a dendrite': 'has_recon_den:true',
        "don't have a dendrite": 'has_recon_den:false',
        'do not have a dendrite': 'has_recon_den:false',
        'has a dendrite': 'has_recon_den:true',
        "doesn't have a dendrite": 'has_recon_den:false',
        'without a dendrite': 'has_recon_den:false',
        'have an apical dendrite': 'has_apical:true',
        "don't have an apical dendrite": 'has_apical:false',
        'do not have an apical dendrite': 'has_apical:false',
        'with an apical dendrite': 'has_apical:true',
        'has an apical dendrite': 'has_apical:true',
        "doesn't have an apical dendrite": 'has_apical:false',
        'without an apical dendrite': 'has_apical:false',
        'apical dendrites': 'has_apical:true',
        'axons': 'has_recon_axon:true',
        'dendrites': 'has_recon_den:true',
        'with dendrites': 'has_recon_den:true',
        'have axons': 'has_recon_axon:true',
        "don't have axons": 'has_recon_axon:false',
        'do not have axons': 'has_recon_axon:false',
        'with axons': 'has_recon_axon:true',
        'has axons': 'has_recon_axon:true',
        "doesn't have axons": 'has_recon_axon:false',
        'without axons': 'has_recon_axon:false',
        'have dendrites': 'has_recon_den:true',
        "don't have dendrites": 'has_recon_den:false',
        'do not have dendrites': 'has_recon_den:false',
        'has dendrites': 'has_recon_den:true',
        "doesn't have dendrites": 'has_recon_den:false',
        'without dendrites': 'has_recon_den:false',
        'have apical dendrites': 'has_apical:true',
        "don't have apical dendrites": 'has_apical:false',
        'do not have apical dendrites': 'has_apical:false',
        'with apical dendrites': 'has_apical:true',
        'has apical dendrites': 'has_apical:true',
        "doesn't have apical dendrites": 'has_apical:false',
        'without apical dendrites': 'has_apical:false'
      }
    }

    private buildSurfTreeMap (): Record<string, string> {
      const map: Record<string, string> = {}

      const traverse = (node: any): void => {
        if (node.name && node.acronym) {
          map[node.name.toLowerCase()] = node.acronym // 全称映射到简称
        }
        if (node.children) {
          node.children.forEach(traverse)
        }
      }

      surfTreeJson.forEach(traverse)
      return map
    }
    // eslint-disable-next-line camelcase
    private buildSurfTreeMap_multi (): Record<string, string[]> {
      const map: Record<string, string[]> = {}

      // 遍历每个节点
      surfTreeJson_multi.forEach((node: { acronym: string; name: any[] }) => {
        const acronym = node.acronym // 将acronym转为小写
        node.name.forEach((name) => {
          const lowerName = name.toLowerCase() // 将name转为小写
          // 如果该acronym已经存在，则添加到现有数组中；否则，初始化一个新的数组
          if (!map[acronym]) {
            map[acronym] = []
          }
          // 避免重复添加相同的name
          if (!map[acronym].includes(lowerName)) {
            map[acronym].push(lowerName)
          }
        })
      })

      return map
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
            `find ${node.display_name}`,
            `neurons with ${node.display_name}`,
            `neurons have ${node.display_name}`,
            `with ${node.display_name}`,
            `have ${node.display_name}`,
            `${node.display_name}`
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

          const commonPhrases = [
            `neurons with ${display_name.toLowerCase()}`,
            `neurons have ${display_name.toLowerCase()}`,
            `find neurons with ${display_name.toLowerCase()}`,
            `find neurons have ${display_name.toLowerCase()}`,
            `show neurons with ${display_name.toLowerCase()}`,
            `show neurons have ${display_name.toLowerCase()}`,
            `do neurons have ${display_name.toLowerCase()}?`,
            `are there neurons with ${display_name.toLowerCase()}?`
          ]

          commonPhrases.forEach((phrase) => {
            trainingData.push({
              input: [phrase],
              output: querry_name
            })
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
      console.log('Decision tree training completed successfully.')
    }

    private normalizeValue (value: string): string {
      if (this.synonymMap[value]) {
        return this.synonymMap[value]
      }

      const tokens = value.toLowerCase().split(/\s+/)
      const normalizedTokens = tokens.map((token) => this.synonymMap[token] || token)
      const normalizedPhrase = normalizedTokens.join(' ')

      return this.synonymMap[normalizedPhrase] || normalizedPhrase
    }

    private mapToAcronymFromFullname (fullName: string): string[] | null {
      console.log('mapToAcronymFromFullname_multi: ' + fullName)
      const lowerFullName = fullName.toLowerCase()

      // 存储匹配到的acronym
      const matchingAcronyms: string[] = []

      // 遍历surfTreeMap，根据全称查找acronym
      for (const [acronym, names] of Object.entries(this.surfTreeMap_multi)) {
        // 如果fullName与某个name匹配，则添加对应的acronym
        if (names.some(name => name.toLowerCase() === lowerFullName)) {
          if (!matchingAcronyms.includes(acronym)) { matchingAcronyms.push(acronym) }
        }
      }

      // 如果找到匹配的acronym，返回它们；否则返回null
      return matchingAcronyms.length > 0 ? matchingAcronyms : null
    }
    // private mapToAcronymFromFullname (fullName: string): string | null {
    //   const lowerFullName = fullName.toLowerCase()
    //   if (this.surfTreeMap[lowerFullName]) {
    //     return this.surfTreeMap[lowerFullName]
    //   }
    //   return null
    // }
    // eslint-disable-next-line camelcase
    private mapToAcronymFromFullname_multi (fullName: string): string[] | null {
      console.log('mapToAcronymFromFullname_multi: ' + fullName)
      const lowerFullName = fullName.toLowerCase()

      // 存储匹配到的acronym
      const matchingAcronyms: string[] = []

      // 遍历surfTreeMap，根据全称查找acronym
      for (const [acronym, names] of Object.entries(this.surfTreeMap_multi)) {
        // 如果fullName与某个name匹配，则添加对应的acronym
        if (names.some(name => name.toLowerCase() === lowerFullName || name.toLowerCase().includes(lowerFullName))) {
          if (!matchingAcronyms.includes(acronym)) { matchingAcronyms.push(acronym) }
        }
      }

      // 如果找到匹配的acronym，返回它们；否则返回null
      return matchingAcronyms.length > 0 ? matchingAcronyms : null
    }

    // private sortAndMatchExactWords (query: string, dictionary: string[]): string[] | null {
    //   console.log(dictionary)
    //   if (query === 'ion' || query === 'seu-allen' || query === 'seu' || query === 'mouselight' || query === 'In') {
    //     return null
    //   }
    //   console.log('sortAndMatchExactWords: ' + query)
    //   const sortedQuery = query
    //     .split(' ') // 将查询拆分成单词
    //     .sort() // 排序
    //     .join(' ') // 重新组合成字符串
    //
    //   const matchedWords: string[] = []
    //
    //   // 遍历字典中的每个词条
    //   for (let word of dictionary) {
    //     const sortedWord = word
    //       .split(' ') // 将字典中的条目拆分成单词
    //       .sort() // 排序
    //       .join(' ') // 重新组合成字符串
    //
    //     // 完全匹配或部分匹配
    //     if (sortedQuery === sortedWord.toLowerCase() || word.toLowerCase().includes(query.toLowerCase())) {
    //       matchedWords.push(word) // 如果匹配成功，加入到结果数组
    //     }
    //   }
    //   console.log('matchedWords: ' + matchedWords)
    //   return matchedWords.length > 0 ? matchedWords : null // 返回匹配的词条数组，如果没有匹配项则返回null
    // }
    // eslint-disable-next-line camelcase
    private sortAndMatchExactWords (query: string, surfTreeMap_multi: Record<string, string[]>): string[] | null {
      if (query === 'ion' || query === 'seu-allen' || query === 'seu' || query === 'mouselight' || query === 'In') {
        return null
      }
      console.log('sortAndMatchExactWords: ' + query)

      const sortedQuery = query
        .split(' ') // 拆分查询词
        .sort() // 排序
        .join(' ') // 重新组合成字符串

      const matchedAcronyms: string[] = []

      // 遍历 surfTreeMap_multi 中的所有 acronym 和 fullNames
      for (const [acronym, names] of Object.entries(surfTreeMap_multi)) {
        // 对每个全称进行匹配
        for (const fullName of names) {
          const sortedFullName = fullName
            .split(' ') // 拆分全称
            .sort() // 排序
            .join(' ') // 重新组合成字符串

          // 完全匹配或部分匹配
          if (sortedQuery === sortedFullName.toLowerCase()) {
            // 如果匹配成功，添加对应的 acronym
            if (!matchedAcronyms.includes(acronym)) {
              matchedAcronyms.push(acronym)
            }
          }
        }
      }

      console.log('Matched Acronyms: ', matchedAcronyms)
      return matchedAcronyms.length > 0 ? matchedAcronyms : null // 返回找到的 acronym
    }
    // eslint-disable-next-line camelcase
    private sortAndMatchExactWords_multi (query: string, surfTreeMap_multi: Record<string, string[]>): string[] | null {
      if (query === 'ion' || query === 'seu-allen' || query === 'seu' || query === 'mouselight' || query === 'In') {
        return null
      }
      console.log('sortAndMatchExactWords: ' + query)

      const sortedQuery = query
        .split(' ') // 拆分查询词
        .sort() // 排序
        .join(' ') // 重新组合成字符串

      const matchedAcronyms: string[] = []

      // 遍历 surfTreeMap_multi 中的所有 acronym 和 fullNames
      for (const [acronym, names] of Object.entries(surfTreeMap_multi)) {
        // 对每个全称进行匹配
        for (const fullName of names) {
          const sortedFullName = fullName
            .split(' ') // 拆分全称
            .sort() // 排序
            .join(' ') // 重新组合成字符串

          // 完全匹配或部分匹配
          if (sortedQuery === sortedFullName.toLowerCase() || fullName.toLowerCase().includes(query.toLowerCase())) {
            // 如果匹配成功，添加对应的 acronym
            if (!matchedAcronyms.includes(acronym)) {
              matchedAcronyms.push(acronym)
            }
          }
        }
      }

      console.log('Matched Acronyms: ', matchedAcronyms)
      return matchedAcronyms.length > 0 ? matchedAcronyms : null // 返回找到的 acronym
    }

    private extractEntitiesFromQuery (query: string): { entity: string; option: any }[] {
      const entities: { entity: string; option: any }[] = []
      const phrases = query
        .toLowerCase()
      // eslint-disable-next-line no-useless-escape
        .split(/[,\s]+(and|or)?\s*|[;,\/]/g) // Enhanced splitting to consider more separators.
        .filter(Boolean) // Remove any empty elements.

      const negationWords = ['without', 'don’t have', 'no', 'not']
      const projectionPhrases = ['project', 'projecting', 'projection', 'arborize', 'arborizing', 'arborization', 'extend', 'extension', 'extending ', 'elongate', 'Elongation', 'Elongated', 'Elongating', 'traverse', 'traversing', 'traversal']
      const targetPrepositions = ['to', 'into', 'toward', 'across ']
      const projectionStartPatterns = projectionPhrases.flatMap((phrase) =>
        targetPrepositions.map((prep) => `${phrase} ${prep}`)
      )

      let isProjectionContext = false // Track if we are in a projection context
      let projectionType = 'axon' // Default to 'axon' if not specified
      let currentNeuronType = '' // Track current neuron type for projections
      if (!this.fuzzyMatchEnabled) {
        for (let i = 0; i < phrases.length; i++) {
          let found = false
          const phrase = phrases[i]
          for (let j = Math.min(phrases.length, i + 5); j > i; j--) {
            const subPhrase = phrases.slice(i, j).join(' ').replace(/[;,]/g, '').trim() // Clean up
            const normalizedPhrase = this.normalizeValue(subPhrase)
            console.log(`Checking phrase: "${subPhrase}" -> "${normalizedPhrase}"`) // Debugging output
            console.log(this.functionToRegionsMap[normalizedPhrase])
            // 新增: 检查是否是功能关键词
            if (this.functionToRegionsMap[normalizedPhrase]) {
              const regions = this.functionToRegionsMap[normalizedPhrase]
              console.log('extract regions: ' + regions)
              entities.push({ entity: 'celltype', option: regions })
              console.log(`Entity extracted for function: { function: '${normalizedPhrase}', regions: ${JSON.stringify(regions)} }`)
              i = j - 1 // Adjust index
              found = true
              break
            }

            // 检查是否是全称并映射到简称
            const acronyms = this.sortAndMatchExactWords(normalizedPhrase, this.surfTreeMap_multi) || []
            if (acronyms.length > 0) {
              entities.push({ entity: 'celltype', option: acronyms })
              console.log(`Entity extracted for acronym mapping: { entity: 'celltype', option: '${acronyms}' }`)

              i = j - 1 // Adjust index
              found = true
              break // 找到匹配项后退出循环
            }
            if (projectionStartPatterns.some((pattern) => subPhrase.toLowerCase().includes(pattern.toLowerCase()))) {
              isProjectionContext = true

              // 判断是axon还是dendrite投射
              projectionType = subPhrase.includes('den') ? 'den' : 'axon' // 判断是axon还是dendrite投射

              // 获取 neuron type（处理 .option 为数组的情况）
              const cellTypeEntity = entities.find((e) => e.entity === 'celltype') // 找到 'celltype' 实体
              let currentNeuronType = cellTypeEntity?.option[0] || 'unknown' // 获取 option[0] 或默认值

              console.log(`Entering projection context with neuron type: ${currentNeuronType} and projection type: ${projectionType}`)

              // 提取目标脑区，去除投射模式部分
              let targetBrainRegionPhrase = subPhrase.replace(/[;,]/g, '').trim() // 去掉标点

              // 遍历投射模式，去除模式及其后面的部分
              projectionStartPatterns.forEach((pattern) => {
                if (targetBrainRegionPhrase.toLowerCase().includes(pattern.toLowerCase())) {
                  // 剔除投射模式及其后面的内容
                  targetBrainRegionPhrase = targetBrainRegionPhrase.split(pattern)[1]?.trim() || ''
                }
              })

              console.log(`Raw target brain region extracted: ${targetBrainRegionPhrase}`) // 打印提取的脑区

              // 如果 targetBrainRegionPhrase 存在，并且不包含投射模式
              if (targetBrainRegionPhrase && !projectionStartPatterns.some((pattern) => targetBrainRegionPhrase.toLowerCase().includes(pattern.toLowerCase()))) {
                // 映射目标脑区到简称（如果是全称）或者维持原样
                const mappedTargetBrainRegion = this.mapToAcronymFromFullname(targetBrainRegionPhrase) || [targetBrainRegionPhrase]
                console.log('mappedTargetBrainRegion: ' + mappedTargetBrainRegion)

                // 处理每个映射到的脑区简称
                mappedTargetBrainRegion.forEach((brainRegion) => {
                  // 映射到 search_conditions 中的正确大小写
                  const correctCasingTargetRegion = this.mapToCorrectCasingDynamically(brainRegion)
                  console.log(`Target brain region identified: ${targetBrainRegionPhrase}, mapped to correct casing: ${correctCasingTargetRegion}`)
                  const projectionData = this.getAnatomicalProjectionStrength_multi(currentNeuronType, correctCasingTargetRegion, projectionType)

                  if (projectionData) {
                    Object.entries(projectionData).forEach(([key, value]) => {
                      entities.push({ entity: key, option: value })
                      i = j // Move to the next relevant phrase
                      found = true
                      console.log(`Entity extracted for projection: { entity: '${key}', option: ${JSON.stringify(value)} }`)
                    })
                  } else {
                    console.warn('Projection context was detected, but no valid projection target was found.')
                  }
                })
              } else {
                console.warn('No valid target brain region found following the projection phrase.')
              }

              isProjectionContext = false // Reset projection context after processing
              if (found) {
                break // Exit to process next phrase
              }
            }

            // 检测是否是投射意图
            // if (projectionStartPatterns.some((pattern) => subPhrase.startsWith(pattern))) {
            //   isProjectionContext = true
            //   projectionType = subPhrase.includes('den') ? 'den' : 'axon' // 判断是axon还是dendrite投射
            //   currentNeuronType = entities.find((e) => e.entity === 'celltype')?.option || 'unknown'
            //   console.log(`Entering projection context with neuron type: ${currentNeuronType} and projection type: ${projectionType}`)
            //
            //   // 提取目标脑区
            //   const targetBrainRegionPhrase = subPhrase.split(' ').slice(-1)[0] // 获取投射意图后的最后一个单词作为目标脑区
            //   console.log(`Raw target brain region extracted: ${targetBrainRegionPhrase}`)
            //
            //   if (targetBrainRegionPhrase && !projectionStartPatterns.some((pattern) => targetBrainRegionPhrase.startsWith(pattern))) {
            //     // 映射目标脑区到简称（如果是全称）或者维持原样
            //     const mappedTargetBrainRegion = this.mapToAcronymFromFullname(targetBrainRegionPhrase) || targetBrainRegionPhrase
            //
            //     // 映射到 search_conditions 中的正确大小写
            //     const correctCasingTargetRegion = this.mapToCorrectCasingDynamically(mappedTargetBrainRegion)
            //     console.log(`Target brain region identified: ${targetBrainRegionPhrase}, mapped to correct casing: ${correctCasingTargetRegion}`)
            //
            //     const projectionData = this.getAnatomicalProjectionStrength(currentNeuronType, correctCasingTargetRegion, projectionType)
            //
            //     if (projectionData) {
            //       Object.entries(projectionData).forEach(([key, value]) => {
            //         entities.push({ entity: key, option: value })
            //         console.log(`Entity extracted for projection: { entity: '${key}', option: ${JSON.stringify(value)} }`)
            //       })
            //     } else {
            //       console.warn('Projection context was detected, but no valid projection target was found.')
            //     }
            //   } else {
            //     console.warn('No valid target brain region found following the projection phrase.')
            //   }
            //
            //   isProjectionContext = false // Reset projection context after processing
            //   i = j // Move to the next relevant phrase
            //   found = true
            //   break // Exit to process next phrase
            // }

            // 检查其他匹配项
            const matchResult = this.mapValueToQuerryName(normalizedPhrase)
            console.log('matchResult', matchResult)
            if (matchResult) {
              const option = matchResult.matchedValue
              entities.push({ entity: matchResult.querry_name, option })
              console.log(`Entity extracted from phrase: ${JSON.stringify({ entity: matchResult.querry_name, option })}`)
              i = j - 1 // Adjust index
              found = true
              break
            }
          }

          if (!found) {
            console.log(`No match found for phrase: "${phrases[i]}"`) // Debug log
          }
        }
      } else {
        for (let i = 0; i < phrases.length; i++) {
          let found = false
          const phrase = phrases[i]
          for (let j = Math.min(phrases.length, i + 5); j > i; j--) {
            const subPhrase = phrases.slice(i, j).join(' ').replace(/[;,]/g, '').trim() // Clean up
            const normalizedPhrase = this.normalizeValue(subPhrase)
            console.log(`Checking phrase: "${subPhrase}" -> "${normalizedPhrase}"`) // Debugging output
            console.log(this.functionToRegionsMap[normalizedPhrase])
            // 新增: 检查是否是功能关键词
            if (this.functionToRegionsMap[normalizedPhrase]) {
              const regions = this.functionToRegionsMap[normalizedPhrase]
              console.log('extract regions: ' + regions)
              entities.push({ entity: 'celltype', option: regions })
              console.log(`Entity extracted for function: { function: '${normalizedPhrase}', regions: ${JSON.stringify(regions)} }`)
              i = j - 1 // Adjust index
              found = true
              break
            }

            const acronyms = this.sortAndMatchExactWords_multi(normalizedPhrase, this.surfTreeMap_multi) || []
            if (acronyms.length > 0) {
              entities.push({ entity: 'celltype', option: acronyms })
              console.log(`Entity extracted for acronym mapping: { entity: 'celltype', option: '${acronyms}' }`)

              i = j - 1 // Adjust index
              found = true
              break // 找到匹配项后退出循环
            }

            // 检测是否是投射意图
            if (projectionStartPatterns.some((pattern) => subPhrase.toLowerCase().includes(pattern.toLowerCase()))) {
              isProjectionContext = true

              // 判断是axon还是dendrite投射
              projectionType = subPhrase.includes('den') ? 'den' : 'axon' // 判断是axon还是dendrite投射
              // 获取 neuron type（处理 .option 为数组的情况）
              const cellTypeEntity = entities.find((e) => e.entity === 'celltype') // 找到 'celltype' 实体
              let currentNeuronType = cellTypeEntity?.option[0] || 'unknown' // 获取 option[0] 或默认值

              console.log(`Entering projection context with neuron type: ${currentNeuronType} and projection type: ${projectionType}`)

              // 提取目标脑区，去除投射模式部分
              let targetBrainRegionPhrase = subPhrase.replace(/[;,]/g, '').trim() // 去掉标点

              // 遍历投射模式，去除模式及其后面的部分
              projectionStartPatterns.forEach((pattern) => {
                if (targetBrainRegionPhrase.toLowerCase().includes(pattern.toLowerCase())) {
                  // 剔除投射模式及其后面的内容
                  targetBrainRegionPhrase = targetBrainRegionPhrase.split(pattern)[1]?.trim() || ''
                  console.log('targetBrainRegionPhrase')
                  console.log(targetBrainRegionPhrase)
                }
              })

              console.log(`Raw target brain region extracted: ${targetBrainRegionPhrase}`) // 打印提取的脑区
              // if (targetBrainRegionPhrase && !projectionStartPatterns.some((pattern) => targetBrainRegionPhrase.toLowerCase().includes(pattern.toLowerCase()))) {
              //   // Step 1: 提取目标脑区中的所有可能的子串
              //   const targetWords = targetBrainRegionPhrase.toLowerCase().split(/\s+/)
              //   const targetWordSet = new Set(targetWords) // 将目标脑区的所有词存储为 Set
              //
              //   let longestMatch = ''
              //   for (const [acronym, names] of Object.entries(this.surfTreeMap_multi)) {
              //     names.forEach((fullName) => {
              //       const fullNameWords = fullName.toLowerCase().split(/\s+/)
              //       const fullNameWordSet = new Set(fullNameWords) // 将每个 fullName 转换为 Set
              //
              //       // 比较 targetWordSet 和 fullNameWordSet 是否相等（忽略顺序）
              //       if (this.setsAreEqual(targetWordSet, fullNameWordSet)) {
              //         if (fullName.length > longestMatch.length) {
              //           longestMatch = fullName
              //         }
              //       }
              //     })
              //   }
              //
              //   if (longestMatch) {
              //     // 映射目标脑区到简称（如果是全称）或者维持原样
              //     const mappedTargetBrainRegion = this.mapToAcronymFromFullname_multi(longestMatch) || [longestMatch]
              //     console.log('mappedTargetBrainRegion: ' + mappedTargetBrainRegion)
              //
              //     mappedTargetBrainRegion.forEach((brainRegion) => {
              //       const correctCasingTargetRegion = this.mapToCorrectCasingDynamically(brainRegion)
              //       console.log(`Target brain region identified: ${longestMatch}, mapped to correct casing: ${correctCasingTargetRegion}`)
              //       const projectionData = this.getAnatomicalProjectionStrength_multi(currentNeuronType, correctCasingTargetRegion, projectionType)
              //
              //       if (projectionData) {
              //         Object.entries(projectionData).forEach(([key, value]) => {
              //           entities.push({ entity: key, option: value })
              //           i = j // Move to the next relevant phrase
              //           found = true
              //           console.log(`Entity extracted for projection: { entity: '${key}', option: ${JSON.stringify(value)} }`)
              //         })
              //       } else {
              //         console.warn('Projection context was detected, but no valid projection target was found.')
              //       }
              //     })
              //   } else {
              //     console.warn('No valid target brain region found following the projection phrase.')
              //   }
              // } else {
              //   console.warn('No valid target brain region found following the projection phrase.')
              // }
              if (targetBrainRegionPhrase && !projectionStartPatterns.some((pattern) => targetBrainRegionPhrase.toLowerCase().includes(pattern.toLowerCase()))) {
                // 映射目标脑区到简称（如果是全称）或者维持原样
                const mappedTargetBrainRegion = this.mapToAcronymFromFullname_multi(targetBrainRegionPhrase) || [targetBrainRegionPhrase]
                console.log('mappedTargetBrainRegion: ' + mappedTargetBrainRegion)

                // 处理每个映射到的脑区简称
                mappedTargetBrainRegion.forEach((brainRegion) => {
                  // 映射到 search_conditions 中的正确大小写
                  const correctCasingTargetRegion = this.mapToCorrectCasingDynamically(brainRegion)
                  console.log(`Target brain region identified: ${targetBrainRegionPhrase}, mapped to correct casing: ${correctCasingTargetRegion}`)
                  const projectionData = this.getAnatomicalProjectionStrength_multi(currentNeuronType, correctCasingTargetRegion, projectionType)

                  if (projectionData) {
                    Object.entries(projectionData).forEach(([key, value]) => {
                      entities.push({ entity: key, option: value })
                      i = j // Move to the next relevant phrase
                      found = true
                      console.log(`Entity extracted for projection: { entity: '${key}', option: ${JSON.stringify(value)} }`)
                    })
                  } else {
                    console.warn('Projection context was detected, but no valid projection target was found.')
                  }
                })
              } else {
                console.warn('No valid target brain region found following the projection phrase.')
              }

              isProjectionContext = false // Reset projection context after processing
              if (found) {
                break // Exit to process next phrase
              }
            }

            // 检查其他匹配项
            const matchResult = this.mapValueToQuerryName(normalizedPhrase)
            console.log('matchResult', matchResult)
            if (matchResult) {
              const option = matchResult.matchedValue
              entities.push({ entity: matchResult.querry_name, option })
              console.log(`Entity extracted from phrase: ${JSON.stringify({ entity: matchResult.querry_name, option })}`)
              i = j - 1 // Adjust index
              found = true
              break
            }
          }

          if (!found) {
            console.log(`No match found for phrase: "${phrases[i]}"`) // Debug log
          }
        }
      }

      console.log(`Extracted Entities after processing phrases: ${JSON.stringify(entities)}`) // Debugging output
      return entities
    }
    private setsAreEqual (set1: Set<string>, set2: Set<string>) {
      if (set1.size !== set2.size) return false
      for (let item of set1) {
        if (!set2.has(item)) return false
      }
      return true
    }
    private getAnatomicalProjectionStrength (neuronType: string, brainRegion: string, projectionType: string): { [key: string]: any } | null {
      console.log('getAnatomicalProjectionStrength')
      console.log(neuronType)
      console.log(brainRegion)

      const projectionTypes = ['axon', 'den'] // Axonal and dendritic types (short form)
      const projectionPatterns = ['axonal', 'dendritic'] // Corresponding full form patterns
      const anatomicalProjectionNodeName = 'anatomical projection strength' // Node to look for projections

      for (let index = 0; index < projectionTypes.length; index++) {
        const currentProjectionType = projectionTypes[index] // 'axon' or 'den'
        const patternName = `${projectionPatterns[index]} patterns` // 'axonal patterns' or 'dendritic patterns'

        const projectionNode = searchConditions.children.find(
          (node: any) => node.name.toLowerCase() === patternName.toLowerCase()
        )

        if (!projectionNode) {
          console.log(`No projection pattern node found for: ${patternName}`)
          continue // Skip if the node doesn't exist
        }

        const anatomicalProjectionNode = projectionNode.children.find(
          (child: any) => child.name.toLowerCase() === anatomicalProjectionNodeName.toLowerCase()
        )

        if (!anatomicalProjectionNode) {
          console.log(`No anatomical projection strength node found under: ${patternName}`)
          continue // Skip if the anatomical projection node is missing
        }

        const matchingChild = anatomicalProjectionNode.children.find((child: any) =>
          child.name.toLowerCase().includes(brainRegion.toLowerCase())
        )

        if (matchingChild) {
          const matchingKey = matchingChild.name // This should be the projection region key
          const projKey = `proj_${currentProjectionType}_${matchingKey}_abs` // Format the key as specified

          // Include default_min and default_max in the projection data
          const projectionCondition = matchingChild.children.find((projChild: any) => projChild.name === 'absolute')

          if (projectionCondition) {
            // eslint-disable-next-line camelcase
            const min_value = 1000
            // eslint-disable-next-line camelcase
            const max_value = projectionCondition.default_max || projectionCondition.max_value || 100000 // Fallback if max is missing

            // eslint-disable-next-line camelcase
            console.log(`Match found for projection: { entity: '${projKey}', value: [${min_value}, ${max_value}] }`)
            // eslint-disable-next-line camelcase
            return { [projKey]: [min_value, max_value] } // Return the correctly formatted key-value pair
          }
        }
      }

      console.warn(`No anatomical projection strength data found for neuron type "${neuronType}" to brain region "${brainRegion}".`)
      return null
    }

    // eslint-disable-next-line camelcase
    private getAnatomicalProjectionStrength_multi (
      neuronType: string,
      brainRegion: string,
      projectionType: string
    ): { [key: string]: any } | null {
      console.log('getAnatomicalProjectionStrength')
      console.log(`Neuron Type: ${neuronType}, Brain Region: ${brainRegion}`)

      const projectionTypes = ['axon', 'den'] // Axonal and dendritic types (short form)
      const projectionPatterns = ['axonal', 'dendritic'] // Corresponding full form patterns
      const anatomicalProjectionNodeName = 'anatomical projection strength' // Node to look for projections

      for (let index = 0; index < projectionTypes.length; index++) {
        const currentProjectionType = projectionTypes[index]
        const patternName = `${projectionPatterns[index]} patterns`

        const projectionNode = searchConditions.children.find(
          (node: any) => node.name.toLowerCase() === patternName.toLowerCase()
        )

        if (!projectionNode) {
          console.log(`No projection pattern node found for: ${patternName}`)
          continue
        }

        const anatomicalProjectionNode = projectionNode.children.find(
          (child: any) => child.name.toLowerCase() === anatomicalProjectionNodeName.toLowerCase()
        )

        if (!anatomicalProjectionNode) {
          console.log(`No anatomical projection strength node found under: ${patternName}`)
          continue
        }

        const matchingChild = anatomicalProjectionNode.children.find((child: any) =>
          child.name.toLowerCase().includes(brainRegion.toLowerCase())
        )

        if (matchingChild) {
          const matchingKey = matchingChild.name
          const projKey = `proj_${currentProjectionType}_${matchingKey}_abs`

          const projectionCondition = matchingChild.children.find((projChild: any) => projChild.name === 'absolute')

          if (projectionCondition) {
            // eslint-disable-next-line camelcase
            const min_value = 1000
            // eslint-disable-next-line camelcase
            const max_value = projectionCondition.default_max || projectionCondition.max_value || 100000

            // eslint-disable-next-line camelcase
            console.log(`Match found for projection: { entity: '${projKey}', value: [${min_value}, ${max_value}] }`)
            // eslint-disable-next-line camelcase
            return { [projKey]: [min_value, max_value] }
          }
        }
      }

      console.warn(`No anatomical projection strength data found for neuron type "${neuronType}" to brain region "${brainRegion}".`)
      return null
    }

    private mapToCorrectCasingDynamically (value: string): string {
      // eslint-disable-next-line camelcase
      for (const querry_name in this.searchConditionsMap) {
        const condition = this.searchConditionsMap[querry_name]
        const normalizedCandidates = condition.candidates.map((candidate: any) => String(candidate).toLowerCase())
        const index = normalizedCandidates.indexOf(value.toLowerCase())

        if (index !== -1) {
          return condition.candidates[index] // Return the correctly cased candidate
        }
      }
      return value // Return the original value if no match is found
    }

    private isValidCellTypeFromJSON (type: string): boolean {
      return Object.values(this.searchConditionsMap).some(
        (condition) =>
          condition.type === 'category' && condition.candidates.map((c: string) => c.toLowerCase()).includes(type.toLowerCase())
      )
    }

    private isValidBrainRegionFromJSON (region: string): boolean {
      return Object.values(this.searchConditionsMap).some(
        (condition) => condition.type === 'range' && condition.display_name.toLowerCase() === region.toLowerCase()
      )
    }
    // eslint-disable-next-line camelcase
    private mapValueToQuerryName (value: string): { querry_name: string; matchedValue: any } | null {
      value = this.normalizeValue(value)

      if (value.includes(':')) {
        const [entityName, entityValue] = value.split(':')
        // eslint-disable-next-line camelcase
        for (const querry_name in this.searchConditionsMap) {
          const condition = this.searchConditionsMap[querry_name]

          if (entityName.toLowerCase() === querry_name.toLowerCase()) {
            if (condition.type === 'binary' && (entityValue === 'true' || entityValue === 'false')) {
              return { querry_name, matchedValue: entityValue }
            }

            const normalizedCandidates = condition.candidates.map((candidate: any) => String(candidate).toLowerCase())
            if (normalizedCandidates.includes(entityValue.toLowerCase())) {
              const exactMatch = condition.candidates.find(
                (candidate: string) => candidate.toLowerCase() === entityValue.toLowerCase()
              )
              return { querry_name, matchedValue: exactMatch }
            }
          }
        }
      } else {
        // eslint-disable-next-line camelcase
        for (const querry_name in this.searchConditionsMap) {
          const condition = this.searchConditionsMap[querry_name]
          const normalizedCandidates = condition.candidates.map((candidate: any) => String(candidate).toLowerCase())
          if (normalizedCandidates.includes(value.toLowerCase()) || value.toLowerCase() === querry_name.toLowerCase()) {
            const exactMatch = condition.candidates.find((candidate: string) => candidate.toLowerCase() === value.toLowerCase())
            return { querry_name, matchedValue: exactMatch }
          }
        }
      }

      return null
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
            const value = entity.option === 'true' || entity.option === 'yes'
            nlpResult.data.push({ key: entity.entity, label: value.toString() })
            nlpResult.value.push({ [entity.entity]: value })
          } else if (condition.type === 'category') {
            nlpResult.data.push({ key: entity.entity, label: entity.option })
            nlpResult.value.push({ [entity.entity]: entity.option })
          } else if (condition.type === 'range') {
            if (Array.isArray(entity.option)) {
              const [min, max] = entity.option // Extract min and max from the array
              nlpResult.data.push({ key: entity.entity, label: `${min} - ${max}` })
              nlpResult.value.push({ [entity.entity]: [min, max] }) // Use the array format [min, max]
            }
          }
        } else {
          // 新增逻辑：检查是否是功能信息
          const isFunctionQuery = this.functionToRegionsMap[entity.option]
          if (isFunctionQuery) {
            const associatedRegions = this.functionToRegionsMap[entity.option]
            associatedRegions.forEach((region) => {
              nlpResult.data.push({ key: 'brain_region', label: region })
              nlpResult.value.push({ brain_region: region })
            })
            console.log(`Mapped function "${entity.option}" to regions:`, associatedRegions)
          } else {
            console.warn(`No matching querry_name or function found for value "${entity.option}".`)
          }
        }
      })

      if (nlpResult.data.length > 0) {
        const intent = this.predictIntent(nlpResult.data.map((item) => item.label))
        if (intent !== 'default_intent') {
          this.processIntent(intent, nlpResult)
        } else {
          console.warn(`No valid intent found for the given query.`)
        }
      } else {
        console.warn(`No valid entities found in the query: "${naturalLanguageQuery}"`)
      }

      nlpResult.data = nlpResult.data.filter((entry) => entry.key !== 'default')
      nlpResult.value = nlpResult.value.filter((entry) => !entry.hasOwnProperty('default'))

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
      const predicted = this.decisionTree.predict(tokens)[0]

      const predictedString = typeof predicted === 'string' ? predicted.toLowerCase() : String(predicted).toLowerCase()
      console.log(`Predicted Intent: ${predictedString}`)

      let matchingCondition = Object.keys(this.searchConditionsMap).find(
        (condition) => condition.toLowerCase() === predictedString
      )

      if (!matchingCondition) {
        matchingCondition = Object.keys(this.searchConditionsMap).find((condition) =>
          predictedString.includes(condition.toLowerCase())
        )
      }

      if (matchingCondition) {
        console.log(`Found matching condition for intent "${predictedString}": "${matchingCondition}"`)
        return matchingCondition
      }

      console.warn(`No matching search condition found for intent "${predictedString}".`)
      return 'default_intent'
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
        switch (condition.type) {
          case 'category':
            if (condition.candidates && condition.candidates.length > 0) {
              const selectedCategory = condition.candidates[0]
              nlpResult.data.push({ key: condition.querry_name, label: selectedCategory })
              nlpResult.value.push({ [condition.querry_name]: selectedCategory })
            }
            break

          case 'binary':
            nlpResult.data.push({ key: condition.querry_name, label: 'true' })
            nlpResult.value.push({ [condition.querry_name]: true })
            break

          case 'range':
            const minValue = condition.default_min || 0
            const maxValue = condition.default_max || 100
            nlpResult.data.push({ key: condition.querry_name, label: `min: ${minValue}, max: ${maxValue}` })
            nlpResult.value.push({ [condition.querry_name]: { min: minValue, max: maxValue } })
            break

          default:
            console.warn(`Unknown condition type "${condition.type}" for intent "${intent}".`)
        }
      } else {
        console.warn(`No matching search condition found for intent "${intent}".`)
        nlpResult.data.push({ key: 'default', label: 'No matching condition' })
        nlpResult.value.push({ default: 'No matching condition' })
      }
    }

    public setfuzzyMatchEnabled (enabled:boolean) {
      this.fuzzyMatchEnabled = enabled
    }
}

// module.exports = NlpHelper

export default NlpHelper

// Fuzz version 1.0
// const { containerBootstrap } = require('@nlpjs/core')
// const { Nlp } = require('@nlpjs/nlp')
// const { LangEn } = require('@nlpjs/lang-en-min')
// const { DecisionTreeClassifier } = require('ml-cart')
// const path = require('path') // 引入 path 模块
// const searchConditions = require('../components/mouse/search_conditions.json')
// const surfTreeJson = require('../components/mouse/surf_tree.json')
// // eslint-disable-next-line camelcase
// const surfTreeJson_multi = require('../components/mouse/Allen_Mouse_Brain_CCFv3_multi.json')// 假设 surf_tree.json 在同一目录
// const brainRegionFunctionData = require('../components/mouse/brain_regions_functions.json')
// interface SearchCondition {
//   key: string;
//   label: string;
// }
//
// interface SearchValue {
//   [key: string]: any;
// }
//
// interface TrainingData {
//   input: string[];
//   output: string;
// }
//
// class NlpHelper {
//   private nlp: any;
//   private decisionTree: any;
//   private searchConditionsMap: Record<string, any>;
//   private trainingData: TrainingData[];
//   private synonymMap: Record<string, string>;
//   private modelFilePath: string;
//   // eslint-disable-next-line camelcase
//   private surfTreeMap_multi: Record<string, string[]>; // 全称到简称的映射
//   private surfTreeMap: Record<string, string>; // 全称到简称的映射
//   private brainRegionFunctionMap: Record<string, string[]>; // 脑区与功能映射
//   private functionToRegionsMap: Record<string, string[]>; // 功能到脑区反向映射
//   public fuzzyMatchEnabled:boolean = true;
//
//   constructor () {
//     this.searchConditionsMap = this.buildSearchConditionsMap()
//     this.trainingData = this.getTrainingData()
//     this.synonymMap = this.buildSynonymMap() // Synonym map for binary and range handling
//     this.modelFilePath = path.join(__dirname, 'model.nlp') // 设置模型文件的路径
//     this.surfTreeMap_multi = this.buildSurfTreeMap_multi() // 构建全称到简称的映射表
//     this.surfTreeMap = this.buildSurfTreeMap()
//
//     // 加载脑区与功能映射
//     this.brainRegionFunctionMap = brainRegionFunctionData
//     this.functionToRegionsMap = this.buildFunctionToRegionsMap(brainRegionFunctionData)
//   }
//
//   async initializeNlp (): Promise<void> {
//     const container = await containerBootstrap()
//     container.use(Nlp)
//     container.use(LangEn)
//
//     this.nlp = container.get('nlp')
//     this.nlp.settings.autoSave = false
//     this.nlp.addLanguage('en')
//
//     // 尝试加载模型
//     try {
//       await this.nlp.load(this.modelFilePath) // 加载保存的模型文件
//       console.log('Model is loaded from', this.modelFilePath)
//     } catch (error) {
//       console.log('Start training model...')
//       this.addIntentsAndEntities(searchConditions)
//       await this.nlp.train()
//     }
//
//     this.trainDecisionTree() // 训练决策树分类器
//   }
//
//   private buildFunctionToRegionsMap (brainRegionFunctionFile: Record<string, string[]>): Record<string, string[]> {
//     const functionToRegionsMap: Record<string, string[]> = {}
//
//     for (const [region, functions] of Object.entries(brainRegionFunctionFile)) {
//       functions.forEach((func) => {
//         const normalizedFunc = func.toLowerCase() // 转换为小写键
//         if (!functionToRegionsMap[normalizedFunc]) {
//           functionToRegionsMap[normalizedFunc] = []
//         }
//         functionToRegionsMap[normalizedFunc].push(region)
//       })
//     }
//
//     return functionToRegionsMap
//   }
//   private buildSearchConditionsMap (): Record<string, any> {
//     const map: Record<string, any> = {}
//
//     function traverse (node: any): void {
//       if (node.querry_name) {
//         const entry: Record<string, any> = {
//           type: node.type,
//           candidates: node.candidates || [],
//           display_name: node.display_name
//         }
//
//         // 如果类型是 'range'，则包含范围相关的字段
//         if (node.type === 'range') {
//           entry['min_value'] = node.min_value
//           entry['max_value'] = node.max_value
//           entry['default_min'] = node.default_min
//           entry['default_max'] = node.default_max
//         }
//
//         map[node.querry_name] = entry
//       }
//
//       if (node.children) {
//         node.children.forEach(traverse)
//       }
//     }
//
//     traverse(searchConditions)
//     return map
//   }
//
//   private buildSynonymMap (): Record<string, string> {
//     return {
//       'apical dendrite': 'has_apical:true',
//       'axon': 'has_recon_axon:true',
//       'dendrite': 'has_recon_den:true',
//       'with dendrite': 'has_recon_den:true',
//       'have axon': 'has_recon_axon:true',
//       "don't have axon": 'has_recon_axon:false',
//       'do not have axon': 'has_recon_axon:false',
//       'with axon': 'has_recon_axon:true',
//       'has axon': 'has_recon_axon:true',
//       "doesn't have axon": 'has_recon_axon:false',
//       'without axon': 'has_recon_axon:false',
//       'have dendrite': 'has_recon_den:true',
//       "don't have dendrite": 'has_recon_den:false',
//       'do not have dendrite': 'has_recon_den:false',
//       'has dendrite': 'has_recon_den:true',
//       "doesn't have dendrite": 'has_recon_den:false',
//       'without dendrite': 'has_recon_den:false',
//       'have apical dendrite': 'has_apical:true',
//       "don't have apical dendrite": 'has_apical:false',
//       'do not have apical dendrite': 'has_apical:false',
//       'with apical dendrite': 'has_apical:true',
//       'has apical dendrite': 'has_apical:true',
//       "doesn't have apical dendrite": 'has_apical:false',
//       'without apical dendrite': 'has_apical:false',
//       'an apical dendrite': 'has_apical:true',
//       'an axon': 'has_recon_axon:true',
//       'a dendrite': 'has_recon_den:true',
//       'with a dendrite': 'has_recon_den:true',
//       'have a axon': 'has_recon_axon:true',
//       "don't have an axon": 'has_recon_axon:false',
//       'do not have an axon': 'has_recon_axon:false',
//       'with an axon': 'has_recon_axon:true',
//       'has an axon': 'has_recon_axon:true',
//       "doesn't have an axon": 'has_recon_axon:false',
//       'without an axon': 'has_recon_axon:false',
//       'have a dendrite': 'has_recon_den:true',
//       "don't have a dendrite": 'has_recon_den:false',
//       'do not have a dendrite': 'has_recon_den:false',
//       'has a dendrite': 'has_recon_den:true',
//       "doesn't have a dendrite": 'has_recon_den:false',
//       'without a dendrite': 'has_recon_den:false',
//       'have an apical dendrite': 'has_apical:true',
//       "don't have an apical dendrite": 'has_apical:false',
//       'do not have an apical dendrite': 'has_apical:false',
//       'with an apical dendrite': 'has_apical:true',
//       'has an apical dendrite': 'has_apical:true',
//       "doesn't have an apical dendrite": 'has_apical:false',
//       'without an apical dendrite': 'has_apical:false',
//       'apical dendrites': 'has_apical:true',
//       'axons': 'has_recon_axon:true',
//       'dendrites': 'has_recon_den:true',
//       'with dendrites': 'has_recon_den:true',
//       'have axons': 'has_recon_axon:true',
//       "don't have axons": 'has_recon_axon:false',
//       'do not have axons': 'has_recon_axon:false',
//       'with axons': 'has_recon_axon:true',
//       'has axons': 'has_recon_axon:true',
//       "doesn't have axons": 'has_recon_axon:false',
//       'without axons': 'has_recon_axon:false',
//       'have dendrites': 'has_recon_den:true',
//       "don't have dendrites": 'has_recon_den:false',
//       'do not have dendrites': 'has_recon_den:false',
//       'has dendrites': 'has_recon_den:true',
//       "doesn't have dendrites": 'has_recon_den:false',
//       'without dendrites': 'has_recon_den:false',
//       'have apical dendrites': 'has_apical:true',
//       "don't have apical dendrites": 'has_apical:false',
//       'do not have apical dendrites': 'has_apical:false',
//       'with apical dendrites': 'has_apical:true',
//       'has apical dendrites': 'has_apical:true',
//       "doesn't have apical dendrites": 'has_apical:false',
//       'without apical dendrites': 'has_apical:false'
//     }
//   }
//
//   private buildSurfTreeMap (): Record<string, string> {
//     const map: Record<string, string> = {}
//
//     const traverse = (node: any): void => {
//       if (node.name && node.acronym) {
//         map[node.name.toLowerCase()] = node.acronym // 全称映射到简称
//       }
//       if (node.children) {
//         node.children.forEach(traverse)
//       }
//     }
//
//     surfTreeJson.forEach(traverse)
//     return map
//   }
//   // eslint-disable-next-line camelcase
//   private buildSurfTreeMap_multi (): Record<string, string[]> {
//     const map: Record<string, string[]> = {}
//
//     // 遍历每个节点
//     surfTreeJson_multi.forEach((node: { acronym: string; name: any[] }) => {
//       const acronym = node.acronym // 将acronym转为小写
//       node.name.forEach((name) => {
//         const lowerName = name.toLowerCase() // 将name转为小写
//         // 如果该acronym已经存在，则添加到现有数组中；否则，初始化一个新的数组
//         if (!map[acronym]) {
//           map[acronym] = []
//         }
//         // 避免重复添加相同的name
//         if (!map[acronym].includes(lowerName)) {
//           map[acronym].push(lowerName)
//         }
//       })
//     })
//
//     return map
//   }
//
//   private addIntentsAndEntities (json: any): void {
//     const addEntities = (node: any): void => {
//       if (node.querry_name) {
//         if (node.type === 'category' && node.candidates) {
//           node.candidates.forEach((candidate: string) => {
//             this.nlp.addNerRuleOptionTexts('en', node.querry_name, [candidate], [candidate.toLowerCase()])
//           })
//         } else if (node.type === 'binary') {
//           this.nlp.addNerRuleOptionTexts('en', node.querry_name, ['yes'], ['yes', 'true', '1'])
//           this.nlp.addNerRuleOptionTexts('en', node.querry_name, ['no'], ['no', 'false', '0'])
//         }
//       }
//
//       if (node.children) {
//         node.children.forEach(addEntities)
//       }
//     }
//
//     const addIntents = (node: any): void => {
//       if (node.querry_name) {
//         const patterns = [
//           `search for ${node.display_name}`,
//           `show ${node.display_name}`,
//           `find ${node.display_name}`,
//           `neurons with ${node.display_name}`,
//           `neurons have ${node.display_name}`,
//           `with ${node.display_name}`,
//           `have ${node.display_name}`,
//           `${node.display_name}`
//         ]
//
//         patterns.forEach((pattern) => {
//           this.nlp.addDocument('en', pattern, node.querry_name)
//         })
//       }
//
//       if (node.children) {
//         node.children.forEach(addIntents)
//       }
//     }
//
//     addEntities(json)
//     addIntents(json)
//   }
//
//   private getTrainingData (): TrainingData[] {
//     const trainingData: TrainingData[] = []
//
//     Object.values(this.searchConditionsMap).forEach((condition) => {
//       // eslint-disable-next-line camelcase
//       const { querry_name, type, candidates, display_name } = condition
//
//       if (type === 'category') {
//         candidates.forEach((candidate: string) => {
//           trainingData.push({
//             input: ['show', display_name.toLowerCase(), candidate.toLowerCase()],
//             output: querry_name
//           })
//         })
//       } else if (type === 'binary') {
//         ['true', 'false'].forEach((binaryValue) => {
//           trainingData.push({
//             input: ['find', display_name.toLowerCase(), binaryValue],
//             output: querry_name
//           })
//         })
//
//         const commonPhrases = [
//           `neurons with ${display_name.toLowerCase()}`,
//           `neurons have ${display_name.toLowerCase()}`,
//           `find neurons with ${display_name.toLowerCase()}`,
//           `find neurons have ${display_name.toLowerCase()}`,
//           `show neurons with ${display_name.toLowerCase()}`,
//           `show neurons have ${display_name.toLowerCase()}`,
//           `do neurons have ${display_name.toLowerCase()}?`,
//           `are there neurons with ${display_name.toLowerCase()}?`
//         ]
//
//         commonPhrases.forEach((phrase) => {
//           trainingData.push({
//             input: [phrase],
//             output: querry_name
//           })
//         })
//       }
//     })
//
//     return trainingData
//   }
//
//   private ensureConsistentDimensions (data: number[][]): number[][] {
//     const maxLength = Math.max(...data.map((row) => row.length))
//     return data.map((row) => {
//       const newRow = [...row]
//       while (newRow.length < maxLength) {
//         newRow.push(0)
//       }
//       return newRow
//     })
//   }
//
//   private trainDecisionTree (): void {
//     const inputs = this.trainingData.map((item) => item.input)
//     const outputs = this.trainingData.map((item) => item.output)
//
//     let encodedInputs = this.encodeCategoricalData(inputs)
//     encodedInputs = this.ensureConsistentDimensions(encodedInputs)
//     const uniqueOutputValues = Array.from(new Set(outputs))
//     const encodedOutputs = outputs.map((output) => uniqueOutputValues.indexOf(output))
//
//     if (encodedInputs.length !== encodedOutputs.length) {
//       throw new Error('Input and output arrays must have the same length.')
//     }
//
//     this.decisionTree = new DecisionTreeClassifier()
//     this.decisionTree.train(encodedInputs, encodedOutputs)
//     console.log('Decision tree training completed successfully.')
//   }
//
//   private normalizeValue (value: string): string {
//     if (this.synonymMap[value]) {
//       return this.synonymMap[value]
//     }
//
//     const tokens = value.toLowerCase().split(/\s+/)
//     const normalizedTokens = tokens.map((token) => this.synonymMap[token] || token)
//     const normalizedPhrase = normalizedTokens.join(' ')
//
//     return this.synonymMap[normalizedPhrase] || normalizedPhrase
//   }
//
//   private mapToAcronymFromFullname (fullName: string): string | null {
//     const lowerFullName = fullName.toLowerCase()
//     if (this.surfTreeMap[lowerFullName]) {
//       return this.surfTreeMap[lowerFullName]
//     }
//     return null
//   }
//   // eslint-disable-next-line camelcase
//   private mapToAcronymFromFullname_multi (fullName: string): string[] | null {
//     console.log('mapToAcronymFromFullname_multi: ' + fullName)
//     const lowerFullName = fullName.toLowerCase()
//
//     // 存储匹配到的acronym
//     const matchingAcronyms: string[] = []
//
//     // 遍历surfTreeMap，根据全称查找acronym
//     for (const [acronym, names] of Object.entries(this.surfTreeMap_multi)) {
//       // 如果fullName与某个name匹配，则添加对应的acronym
//       // if (names.some(name => name.toLowerCase() === lowerFullName || name.toLowerCase().includes(lowerFullName))) {
//       //   if (!matchingAcronyms.includes(acronym)) { matchingAcronyms.push(acronym) }
//       // }
//       if (names.some(name => name.toLowerCase() === lowerFullName || name.toLowerCase().includes(lowerFullName))) {
//         if (!matchingAcronyms.includes(acronym)) { matchingAcronyms.push(acronym) }
//       }
//     }
//
//     // 如果找到匹配的acronym，返回它们；否则返回null
//     return matchingAcronyms.length > 0 ? matchingAcronyms : null
//   }
//
//   private sortAndMatchExactWords (query: string, dictionary: string[]): string[] | null {
//     if (query === 'ion' || query === 'seu-allen' || query === 'seu' || query === 'mouselight' || query === 'In') {
//       return null
//     }
//     console.log('sortAndMatchExactWords: ' + query)
//     const sortedQuery = query
//       .split(' ') // 将查询拆分成单词
//       .sort() // 排序
//       .join(' ') // 重新组合成字符串
//
//     const matchedWords: string[] = []
//
//     // 遍历字典中的每个词条
//     for (let word of dictionary) {
//       const sortedWord = word
//         .split(' ') // 将字典中的条目拆分成单词
//         .sort() // 排序
//         .join(' ') // 重新组合成字符串
//
//       // 完全匹配或部分匹配
//       if (sortedQuery === sortedWord.toLowerCase() || word.toLowerCase().includes(query.toLowerCase())) {
//         matchedWords.push(word) // 如果匹配成功，加入到结果数组
//       }
//     }
//     console.log('matchedWords: ' + matchedWords)
//     return matchedWords.length > 0 ? matchedWords : null // 返回匹配的词条数组，如果没有匹配项则返回null
//   }
//
//   private extractEntitiesFromQuery (query: string): { entity: string; option: any }[] {
//     const entities: { entity: string; option: any }[] = []
//     const phrases = query
//       .toLowerCase()
//       // eslint-disable-next-line no-useless-escape
//       .split(/[,\s]+(and|or)?\s*|[;,\/]/g) // Enhanced splitting to consider more separators.
//       .filter(Boolean) // Remove any empty elements.
//
//     const negationWords = ['without', 'don’t have', 'no', 'not']
//     const projectionPhrases = ['project', 'projecting', 'projection', 'arborize', 'arborizing', 'arborization', 'extend', 'extension', 'extending ', 'elongate', 'Elongation', 'Elongated', 'Elongating', 'traverse', 'traversing', 'traversal']
//     const targetPrepositions = ['to', 'into', 'toward', 'across ']
//     const projectionStartPatterns = projectionPhrases.flatMap((phrase) =>
//       targetPrepositions.map((prep) => `${phrase} ${prep}`)
//     )
//
//     let isProjectionContext = false // Track if we are in a projection context
//     let projectionType = 'axon' // Default to 'axon' if not specified
//     let currentNeuronType = '' // Track current neuron type for projections
//     if (!this.fuzzyMatchEnabled) {
//       for (let i = 0; i < phrases.length; i++) {
//         let found = false
//         const phrase = phrases[i]
//         for (let j = Math.min(phrases.length, i + 5); j > i; j--) {
//           const subPhrase = phrases.slice(i, j).join(' ').replace(/[;,]/g, '').trim() // Clean up
//           const normalizedPhrase = this.normalizeValue(subPhrase)
//           console.log(`Checking phrase: "${subPhrase}" -> "${normalizedPhrase}"`) // Debugging output
//           console.log(this.functionToRegionsMap[normalizedPhrase])
//           // 新增: 检查是否是功能关键词
//           if (this.functionToRegionsMap[normalizedPhrase]) {
//             const regions = this.functionToRegionsMap[normalizedPhrase]
//             console.log('extract regions: ' + regions)
//             entities.push({ entity: 'celltype', option: regions })
//             console.log(`Entity extracted for function: { function: '${normalizedPhrase}', regions: ${JSON.stringify(regions)} }`)
//             i = j - 1 // Adjust index
//             found = true
//             break
//           }
//
//           // 检查是否是全称并映射到简称
//           const acronym = this.mapToAcronymFromFullname(normalizedPhrase)
//           if (acronym) {
//             entities.push({ entity: 'celltype', option: acronym })
//             console.log(`Entity extracted for acronym mapping: { entity: 'celltype', option: '${acronym}' }`)
//             i = j - 1 // Adjust index
//             found = true
//             break
//           }
//
//           // 检测是否是投射意图
//           if (projectionStartPatterns.some((pattern) => subPhrase.startsWith(pattern))) {
//             isProjectionContext = true
//             projectionType = subPhrase.includes('den') ? 'den' : 'axon' // 判断是axon还是dendrite投射
//             currentNeuronType = entities.find((e) => e.entity === 'celltype')?.option || 'unknown'
//             console.log(`Entering projection context with neuron type: ${currentNeuronType} and projection type: ${projectionType}`)
//
//             // 提取目标脑区
//             const targetBrainRegionPhrase = subPhrase.split(' ').slice(-1)[0] // 获取投射意图后的最后一个单词作为目标脑区
//             console.log(`Raw target brain region extracted: ${targetBrainRegionPhrase}`)
//
//             if (targetBrainRegionPhrase && !projectionStartPatterns.some((pattern) => targetBrainRegionPhrase.startsWith(pattern))) {
//               // 映射目标脑区到简称（如果是全称）或者维持原样
//               const mappedTargetBrainRegion = this.mapToAcronymFromFullname(targetBrainRegionPhrase) || targetBrainRegionPhrase
//
//               // 映射到 search_conditions 中的正确大小写
//               const correctCasingTargetRegion = this.mapToCorrectCasingDynamically(mappedTargetBrainRegion)
//               console.log(`Target brain region identified: ${targetBrainRegionPhrase}, mapped to correct casing: ${correctCasingTargetRegion}`)
//
//               const projectionData = this.getAnatomicalProjectionStrength(currentNeuronType, correctCasingTargetRegion, projectionType)
//
//               if (projectionData) {
//                 Object.entries(projectionData).forEach(([key, value]) => {
//                   entities.push({ entity: key, option: value })
//                   console.log(`Entity extracted for projection: { entity: '${key}', option: ${JSON.stringify(value)} }`)
//                 })
//               } else {
//                 console.warn('Projection context was detected, but no valid projection target was found.')
//               }
//             } else {
//               console.warn('No valid target brain region found following the projection phrase.')
//             }
//
//             isProjectionContext = false // Reset projection context after processing
//             i = j // Move to the next relevant phrase
//             found = true
//             break // Exit to process next phrase
//           }
//
//           // 检查其他匹配项
//           const matchResult = this.mapValueToQuerryName(normalizedPhrase)
//           console.log('matchResult', matchResult)
//           if (matchResult) {
//             const option = matchResult.matchedValue
//             entities.push({ entity: matchResult.querry_name, option })
//             console.log(`Entity extracted from phrase: ${JSON.stringify({ entity: matchResult.querry_name, option })}`)
//             i = j - 1 // Adjust index
//             found = true
//             break
//           }
//         }
//
//         if (!found) {
//           console.log(`No match found for phrase: "${phrases[i]}"`) // Debug log
//         }
//       }
//     } else {
//       for (let i = 0; i < phrases.length; i++) {
//         let found = false
//         const phrase = phrases[i]
//         for (let j = Math.min(phrases.length, i + 10); j > i; j--) {
//           const subPhrase = phrases.slice(i, j).join(' ').replace(/[;,]/g, '').trim() // Clean up
//           const normalizedPhrase = this.normalizeValue(subPhrase)
//           console.log(`Checking phrase: "${subPhrase}" -> "${normalizedPhrase}"`) // Debugging output
//           console.log(this.functionToRegionsMap[normalizedPhrase])
//           // 新增: 检查是否是功能关键词
//           if (this.functionToRegionsMap[normalizedPhrase]) {
//             const regions = this.functionToRegionsMap[normalizedPhrase]
//             console.log('extract regions: ' + regions)
//             entities.push({ entity: 'celltype', option: regions })
//             console.log(`Entity extracted for function: { function: '${normalizedPhrase}', regions: ${JSON.stringify(regions)} }`)
//             i = j - 1 // Adjust index
//             found = true
//             break
//           }
//
//           const dictionary = Object.keys(this.surfTreeMap)
//           const fullNames = this.sortAndMatchExactWords(normalizedPhrase, dictionary) || []
//           console.log('fullNames: ')
//           console.log(fullNames)
//           let acronymOption: string[] = []
//           // eslint-disable-next-line camelcase
//           let acronym_Option = []
//           // 遍历所有匹配到的全称
//           // @ts-ignore
//           fullNames.forEach((fullName) => {
//             // 确保找到的全称对应一个有效的acronym
//             if (this.surfTreeMap[fullName]) {
//               const acronyms = this.mapToAcronymFromFullname_multi(fullName) // 获取全称对应的多个acronym
//               console.log('acronyms: ' + acronyms)
//               acronym_Option.push(acronyms)
//               // 处理每个acronym
//               if (acronyms) {
//                 acronyms.forEach((acronym) => {
//                   acronymOption.push(acronym)
//                   // entities.push({ entity: 'celltype', option: acronym })
//                   console.log(`Entity extracted for acronym mapping: { entity: 'celltype', option: '${acronym}' }`)
//                 })
//                 i = j - 1 // Adjust index
//                 found = true
//               }
//             }
//           })
//           if (acronymOption.length > 0) {
//             entities.push({ entity: 'celltype', option: acronymOption })
//           }
//
//           if (!found) {
//             console.warn('No valid target brain region found.')
//           }
//
//           // 检测是否是投射意图
//           if (projectionStartPatterns.some((pattern) => subPhrase.toLowerCase().includes(pattern.toLowerCase()))) {
//             isProjectionContext = true
//
//             // 判断是axon还是dendrite投射
//             projectionType = subPhrase.includes('den') ? 'den' : 'axon' // 判断是axon还是dendrite投射
//
//             // 获取 neuron type（处理 .option 为数组的情况）
//             const cellTypeEntity = entities.find((e) => e.entity === 'celltype') // 找到 'celltype' 实体
//             let currentNeuronType = cellTypeEntity?.option[0] || 'unknown' // 获取 option[0] 或默认值
//
//             console.log(`Entering projection context with neuron type: ${currentNeuronType} and projection type: ${projectionType}`)
//
//             // 提取目标脑区，去除投射模式部分
//             let targetBrainRegionPhrase = subPhrase.replace(/[;,]/g, '').trim() // 去掉标点
//
//             // 遍历投射模式，去除模式及其后面的部分
//             projectionStartPatterns.forEach((pattern) => {
//               if (targetBrainRegionPhrase.toLowerCase().includes(pattern.toLowerCase())) {
//                 // 剔除投射模式及其后面的内容
//                 targetBrainRegionPhrase = targetBrainRegionPhrase.split(pattern)[1]?.trim() || ''
//               }
//             })
//
//             console.log(`Raw target brain region extracted: ${targetBrainRegionPhrase}`) // 打印提取的脑区
//
//             // 如果 targetBrainRegionPhrase 存在，并且不包含投射模式
//             if (targetBrainRegionPhrase && !projectionStartPatterns.some((pattern) => targetBrainRegionPhrase.toLowerCase().includes(pattern.toLowerCase()))) {
//               // 映射目标脑区到简称（如果是全称）或者维持原样
//               const mappedTargetBrainRegion = this.mapToAcronymFromFullname_multi(targetBrainRegionPhrase) || [targetBrainRegionPhrase]
//               console.log('mappedTargetBrainRegion: ' + mappedTargetBrainRegion)
//
//               // 处理每个映射到的脑区简称
//               mappedTargetBrainRegion.forEach((brainRegion) => {
//                 // 映射到 search_conditions 中的正确大小写
//                 const correctCasingTargetRegion = this.mapToCorrectCasingDynamically(brainRegion)
//                 console.log(`Target brain region identified: ${targetBrainRegionPhrase}, mapped to correct casing: ${correctCasingTargetRegion}`)
//                 const projectionData = this.getAnatomicalProjectionStrength_multi(currentNeuronType, correctCasingTargetRegion, projectionType)
//
//                 if (projectionData) {
//                   Object.entries(projectionData).forEach(([key, value]) => {
//                     entities.push({ entity: key, option: value })
//                     console.log(`Entity extracted for projection: { entity: '${key}', option: ${JSON.stringify(value)} }`)
//                   })
//                 } else {
//                   console.warn('Projection context was detected, but no valid projection target was found.')
//                 }
//               })
//             } else {
//               console.warn('No valid target brain region found following the projection phrase.')
//             }
//
//             isProjectionContext = false // Reset projection context after processing
//             i = j // Move to the next relevant phrase
//             found = true
//             break // Exit to process next phrase
//           }
//
//           // 检查其他匹配项
//           const matchResult = this.mapValueToQuerryName(normalizedPhrase)
//           console.log('matchResult', matchResult)
//           if (matchResult) {
//             const option = matchResult.matchedValue
//             entities.push({ entity: matchResult.querry_name, option })
//             console.log(`Entity extracted from phrase: ${JSON.stringify({ entity: matchResult.querry_name, option })}`)
//             i = j - 1 // Adjust index
//             found = true
//             break
//           }
//         }
//
//         if (!found) {
//           console.log(`No match found for phrase: "${phrases[i]}"`) // Debug log
//         }
//       }
//     }
//
//     console.log(`Extracted Entities after processing phrases: ${JSON.stringify(entities)}`) // Debugging output
//     return entities
//   }
//
//   // private extractEntitiesFromQuery (query: string): { entity: string; option: any }[] {
//   //   const entities: { entity: string; option: any }[] = []
//   //   const phrases = query
//   //     .toLowerCase()
//   //     // eslint-disable-next-line no-useless-escape
//   //     .split(/[,\s]+(and|or)?\s*|[;,\/]/g) // Enhanced splitting to consider more separators.
//   //     .filter(Boolean) // Remove any empty elements.
//   //
//   //   const negationWords = ['without', 'don’t have', "don't have", 'no', 'not']
//   //   const projectionPhrases = ['project', 'arborize', 'extend', 'elongate', 'traversal']
//   //   const targetPrepositions = ['to']
//   //   const projectionStartPatterns = projectionPhrases.flatMap((phrase) =>
//   //     targetPrepositions.map((prep) => `${phrase} ${prep}`)
//   //   )
//   //
//   //   let isProjectionContext = false // Track if we are in a projection context
//   //   let projectionType = 'axon' // Default to 'axon' if not specified
//   //   let currentNeuronType = '' // Track current neuron type for projections
//   //
//   //   for (let i = 0; i < phrases.length; i++) {
//   //     let found = false
//   //
//   //     for (let j = Math.min(phrases.length, i + 5); j > i; j--) {
//   //       const subPhrase = phrases.slice(i, j).join(' ').replace(/[;,]/g, '').trim() // Clean up
//   //       const normalizedPhrase = this.normalizeValue(subPhrase)
//   //       console.log(`Checking phrase: "${subPhrase}" -> "${normalizedPhrase}"`) // Debugging output
//   //
//   //       // 检查是否是全称并映射到简称
//   //       const acronym = this.mapToAcronymFromFullname(normalizedPhrase)
//   //       if (acronym) {
//   //         entities.push({ entity: 'celltype', option: acronym })
//   //         console.log(`Entity extracted for acronym mapping: { entity: 'celltype', option: '${acronym}' }`)
//   //         i = j - 1 // Adjust index
//   //         found = true
//   //         break
//   //       }
//   //
//   //       // 检测是否是投射意图
//   //       if (projectionStartPatterns.some((pattern) => subPhrase.startsWith(pattern))) {
//   //         isProjectionContext = true
//   //         projectionType = subPhrase.includes('den') ? 'den' : 'axon' // 判断是axon还是dendrite投射
//   //         currentNeuronType = entities.find((e) => e.entity === 'celltype')?.option || 'unknown'
//   //         console.log(`Entering projection context with neuron type: ${currentNeuronType} and projection type: ${projectionType}`)
//   //
//   //         // 提取目标脑区
//   //         const targetBrainRegionPhrase = subPhrase.split(' ').slice(-1)[0] // 获取投射意图后的最后一个单词作为目标脑区
//   //         console.log(`Raw target brain region extracted: ${targetBrainRegionPhrase}`)
//   //
//   //         if (targetBrainRegionPhrase && !projectionStartPatterns.some((pattern) => targetBrainRegionPhrase.startsWith(pattern))) {
//   //           // 映射目标脑区到简称（如果是全称）或者维持原样
//   //           const mappedTargetBrainRegion = this.mapToAcronymFromFullname(targetBrainRegionPhrase) || targetBrainRegionPhrase
//   //
//   //           // 映射到 search_conditions 中的正确大小写
//   //           const correctCasingTargetRegion = this.mapToCorrectCasingDynamically(mappedTargetBrainRegion)
//   //           console.log(`Target brain region identified: ${targetBrainRegionPhrase}, mapped to correct casing: ${correctCasingTargetRegion}`)
//   //
//   //           const projectionData = this.getAnatomicalProjectionStrength(currentNeuronType, correctCasingTargetRegion, projectionType)
//   //
//   //           if (projectionData) {
//   //             Object.entries(projectionData).forEach(([key, value]) => {
//   //               entities.push({ entity: key, option: value })
//   //               console.log(`Entity extracted for projection: { entity: '${key}', option: ${JSON.stringify(value)} }`)
//   //             })
//   //           } else {
//   //             console.warn('Projection context was detected, but no valid projection target was found.')
//   //           }
//   //         } else {
//   //           console.warn('No valid target brain region found following the projection phrase.')
//   //         }
//   //
//   //         isProjectionContext = false // Reset projection context after processing
//   //         i = j // Move to the next relevant phrase
//   //         found = true
//   //         break // Exit to process next phrase
//   //       }
//   //
//   //       const matchResult = this.mapValueToQuerryName(normalizedPhrase)
//   //       console.log('matchResult', matchResult)
//   //       if (matchResult) {
//   //         const option = matchResult.matchedValue
//   //         entities.push({ entity: matchResult.querry_name, option })
//   //         console.log(`Entity extracted from phrase: ${JSON.stringify({ entity: matchResult.querry_name, option })}`)
//   //         i = j - 1 // Adjust index
//   //         found = true
//   //         break
//   //       }
//   //     }
//   //
//   //     if (!found) {
//   //       console.log(`No match found for phrase: "${phrases[i]}"`) // Debug log
//   //     }
//   //   }
//   //
//   //   console.log(`Extracted Entities after processing phrases: ${JSON.stringify(entities)}`) // Debugging output
//   //   return entities
//   // }
//
//   private getAnatomicalProjectionStrength (neuronType: string, brainRegion: string, projectionType: string): { [key: string]: any } | null {
//     console.log('getAnatomicalProjectionStrength')
//     console.log(neuronType)
//     console.log(brainRegion)
//
//     const projectionTypes = ['axon', 'den'] // Axonal and dendritic types (short form)
//     const projectionPatterns = ['axonal', 'dendritic'] // Corresponding full form patterns
//     const anatomicalProjectionNodeName = 'anatomical projection strength' // Node to look for projections
//
//     for (let index = 0; index < projectionTypes.length; index++) {
//       const currentProjectionType = projectionTypes[index] // 'axon' or 'den'
//       const patternName = `${projectionPatterns[index]} patterns` // 'axonal patterns' or 'dendritic patterns'
//
//       const projectionNode = searchConditions.children.find(
//         (node: any) => node.name.toLowerCase() === patternName.toLowerCase()
//       )
//
//       if (!projectionNode) {
//         console.log(`No projection pattern node found for: ${patternName}`)
//         continue // Skip if the node doesn't exist
//       }
//
//       const anatomicalProjectionNode = projectionNode.children.find(
//         (child: any) => child.name.toLowerCase() === anatomicalProjectionNodeName.toLowerCase()
//       )
//
//       if (!anatomicalProjectionNode) {
//         console.log(`No anatomical projection strength node found under: ${patternName}`)
//         continue // Skip if the anatomical projection node is missing
//       }
//
//       const matchingChild = anatomicalProjectionNode.children.find((child: any) =>
//         child.name.toLowerCase().includes(brainRegion.toLowerCase())
//       )
//
//       if (matchingChild) {
//         const matchingKey = matchingChild.name // This should be the projection region key
//         const projKey = `proj_${currentProjectionType}_${matchingKey}_abs` // Format the key as specified
//
//         // Include default_min and default_max in the projection data
//         const projectionCondition = matchingChild.children.find((projChild: any) => projChild.name === 'absolute')
//
//         if (projectionCondition) {
//           // eslint-disable-next-line camelcase
//           const min_value = 1000
//           // eslint-disable-next-line camelcase
//           const max_value = projectionCondition.default_max || projectionCondition.max_value || 100000 // Fallback if max is missing
//
//           // eslint-disable-next-line camelcase
//           console.log(`Match found for projection: { entity: '${projKey}', value: [${min_value}, ${max_value}] }`)
//           // eslint-disable-next-line camelcase
//           return { [projKey]: [min_value, max_value] } // Return the correctly formatted key-value pair
//         }
//       }
//     }
//
//     console.warn(`No anatomical projection strength data found for neuron type "${neuronType}" to brain region "${brainRegion}".`)
//     return null
//   }
//
//   // eslint-disable-next-line camelcase
//   private getAnatomicalProjectionStrength_multi (
//     neuronType: string,
//     brainRegion: string,
//     projectionType: string
//   ): { [key: string]: any } | null {
//     console.log('getAnatomicalProjectionStrength')
//     console.log(`Neuron Type: ${neuronType}, Brain Region: ${brainRegion}`)
//
//     const projectionTypes = ['axon', 'den'] // Axonal and dendritic types (short form)
//     const projectionPatterns = ['axonal', 'dendritic'] // Corresponding full form patterns
//     const anatomicalProjectionNodeName = 'anatomical projection strength' // Node to look for projections
//
//     for (let index = 0; index < projectionTypes.length; index++) {
//       const currentProjectionType = projectionTypes[index]
//       const patternName = `${projectionPatterns[index]} patterns`
//
//       const projectionNode = searchConditions.children.find(
//         (node: any) => node.name.toLowerCase() === patternName.toLowerCase()
//       )
//
//       if (!projectionNode) {
//         console.log(`No projection pattern node found for: ${patternName}`)
//         continue
//       }
//
//       const anatomicalProjectionNode = projectionNode.children.find(
//         (child: any) => child.name.toLowerCase() === anatomicalProjectionNodeName.toLowerCase()
//       )
//
//       if (!anatomicalProjectionNode) {
//         console.log(`No anatomical projection strength node found under: ${patternName}`)
//         continue
//       }
//
//       const matchingChild = anatomicalProjectionNode.children.find((child: any) =>
//         child.name.toLowerCase().includes(brainRegion.toLowerCase())
//       )
//
//       if (matchingChild) {
//         const matchingKey = matchingChild.name
//         const projKey = `proj_${currentProjectionType}_${matchingKey}_abs`
//
//         const projectionCondition = matchingChild.children.find((projChild: any) => projChild.name === 'absolute')
//
//         if (projectionCondition) {
//           // eslint-disable-next-line camelcase
//           const min_value = 1000
//           // eslint-disable-next-line camelcase
//           const max_value = projectionCondition.default_max || projectionCondition.max_value || 100000
//
//           // eslint-disable-next-line camelcase
//           console.log(`Match found for projection: { entity: '${projKey}', value: [${min_value}, ${max_value}] }`)
//           // eslint-disable-next-line camelcase
//           return { [projKey]: [min_value, max_value] }
//         }
//       }
//     }
//
//     console.warn(`No anatomical projection strength data found for neuron type "${neuronType}" to brain region "${brainRegion}".`)
//     return null
//   }
//
//   private mapToCorrectCasingDynamically (value: string): string {
//     // eslint-disable-next-line camelcase
//     for (const querry_name in this.searchConditionsMap) {
//       const condition = this.searchConditionsMap[querry_name]
//       const normalizedCandidates = condition.candidates.map((candidate: any) => String(candidate).toLowerCase())
//       const index = normalizedCandidates.indexOf(value.toLowerCase())
//
//       if (index !== -1) {
//         return condition.candidates[index] // Return the correctly cased candidate
//       }
//     }
//     return value // Return the original value if no match is found
//   }
//
//   private isValidCellTypeFromJSON (type: string): boolean {
//     return Object.values(this.searchConditionsMap).some(
//       (condition) =>
//         condition.type === 'category' && condition.candidates.map((c: string) => c.toLowerCase()).includes(type.toLowerCase())
//     )
//   }
//
//   private isValidBrainRegionFromJSON (region: string): boolean {
//     return Object.values(this.searchConditionsMap).some(
//       (condition) => condition.type === 'range' && condition.display_name.toLowerCase() === region.toLowerCase()
//     )
//   }
//   // eslint-disable-next-line camelcase
//   private mapValueToQuerryName (value: string): { querry_name: string; matchedValue: any } | null {
//     value = this.normalizeValue(value)
//
//     if (value.includes(':')) {
//       const [entityName, entityValue] = value.split(':')
//       // eslint-disable-next-line camelcase
//       for (const querry_name in this.searchConditionsMap) {
//         const condition = this.searchConditionsMap[querry_name]
//
//         if (entityName.toLowerCase() === querry_name.toLowerCase()) {
//           if (condition.type === 'binary' && (entityValue === 'true' || entityValue === 'false')) {
//             return { querry_name, matchedValue: entityValue }
//           }
//
//           const normalizedCandidates = condition.candidates.map((candidate: any) => String(candidate).toLowerCase())
//           if (normalizedCandidates.includes(entityValue.toLowerCase())) {
//             const exactMatch = condition.candidates.find(
//               (candidate: string) => candidate.toLowerCase() === entityValue.toLowerCase()
//             )
//             return { querry_name, matchedValue: exactMatch }
//           }
//         }
//       }
//     } else {
//       // eslint-disable-next-line camelcase
//       for (const querry_name in this.searchConditionsMap) {
//         const condition = this.searchConditionsMap[querry_name]
//         const normalizedCandidates = condition.candidates.map((candidate: any) => String(candidate).toLowerCase())
//         if (normalizedCandidates.includes(value.toLowerCase()) || value.toLowerCase() === querry_name.toLowerCase()) {
//           const exactMatch = condition.candidates.find((candidate: string) => candidate.toLowerCase() === value.toLowerCase())
//           return { querry_name, matchedValue: exactMatch }
//         }
//       }
//     }
//
//     return null
//   }
//
//   // async processQuery (naturalLanguageQuery: string): Promise<{ data: SearchCondition[]; value: SearchValue[] }> {
//   //   const extractedEntities = this.extractEntitiesFromQuery(naturalLanguageQuery)
//   //
//   //   const nlpResult: { data: SearchCondition[]; value: SearchValue[] } = {
//   //     data: [],
//   //     value: []
//   //   }
//   //
//   //   extractedEntities.forEach((entity) => {
//   //     const condition = this.searchConditionsMap[entity.entity]
//   //     console.log('condition:')
//   //     console.log(condition)
//   //     if (condition) {
//   //       if (condition.type === 'binary') {
//   //         const value = entity.option === 'true' || entity.option === 'yes'
//   //         nlpResult.data.push({ key: entity.entity, label: value.toString() })
//   //         nlpResult.value.push({ [entity.entity]: value })
//   //       } else if (condition.type === 'category') {
//   //         nlpResult.data.push({ key: entity.entity, label: entity.option })
//   //         nlpResult.value.push({ [entity.entity]: entity.option })
//   //       } else if (condition.type === 'range') {
//   //         if (Array.isArray(entity.option)) {
//   //           const [min, max] = entity.option // Extract min and max from the array
//   //           nlpResult.data.push({ key: entity.entity, label: `${min} - ${max}` })
//   //           nlpResult.value.push({ [entity.entity]: [min, max] }) // Use the array format [min, max]
//   //         }
//   //       }
//   //     } else {
//   //       console.warn(`No matching querry_name found for value "${entity.option}".`)
//   //     }
//   //   })
//   //
//   //   if (nlpResult.data.length > 0) {
//   //     const intent = this.predictIntent(nlpResult.data.map((item) => item.label))
//   //     if (intent !== 'default_intent') {
//   //       this.processIntent(intent, nlpResult)
//   //     } else {
//   //       console.warn(`No valid intent found for the given query.`)
//   //     }
//   //   } else {
//   //     console.warn(`No valid entities found in the query: "${naturalLanguageQuery}"`)
//   //   }
//   //
//   //   nlpResult.data = nlpResult.data.filter((entry) => entry.key !== 'default')
//   //   nlpResult.value = nlpResult.value.filter((entry) => !entry.hasOwnProperty('default'))
//   //
//   //   return nlpResult
//   // }
//
//   async processQuery (naturalLanguageQuery: string): Promise<{ data: SearchCondition[]; value: SearchValue[] }> {
//     const extractedEntities = this.extractEntitiesFromQuery(naturalLanguageQuery)
//
//     const nlpResult: { data: SearchCondition[]; value: SearchValue[] } = {
//       data: [],
//       value: []
//     }
//
//     extractedEntities.forEach((entity) => {
//       const condition = this.searchConditionsMap[entity.entity]
//       if (condition) {
//         if (condition.type === 'binary') {
//           const value = entity.option === 'true' || entity.option === 'yes'
//           nlpResult.data.push({ key: entity.entity, label: value.toString() })
//           nlpResult.value.push({ [entity.entity]: value })
//         } else if (condition.type === 'category') {
//           nlpResult.data.push({ key: entity.entity, label: entity.option })
//           nlpResult.value.push({ [entity.entity]: entity.option })
//         } else if (condition.type === 'range') {
//           if (Array.isArray(entity.option)) {
//             const [min, max] = entity.option // Extract min and max from the array
//             nlpResult.data.push({ key: entity.entity, label: `${min} - ${max}` })
//             nlpResult.value.push({ [entity.entity]: [min, max] }) // Use the array format [min, max]
//           }
//         }
//       } else {
//         // 新增逻辑：检查是否是功能信息
//         const isFunctionQuery = this.functionToRegionsMap[entity.option]
//         if (isFunctionQuery) {
//           const associatedRegions = this.functionToRegionsMap[entity.option]
//           associatedRegions.forEach((region) => {
//             nlpResult.data.push({ key: 'brain_region', label: region })
//             nlpResult.value.push({ brain_region: region })
//           })
//           console.log(`Mapped function "${entity.option}" to regions:`, associatedRegions)
//         } else {
//           console.warn(`No matching querry_name or function found for value "${entity.option}".`)
//         }
//       }
//     })
//
//     if (nlpResult.data.length > 0) {
//       const intent = this.predictIntent(nlpResult.data.map((item) => item.label))
//       if (intent !== 'default_intent') {
//         this.processIntent(intent, nlpResult)
//       } else {
//         console.warn(`No valid intent found for the given query.`)
//       }
//     } else {
//       console.warn(`No valid entities found in the query: "${naturalLanguageQuery}"`)
//     }
//
//     nlpResult.data = nlpResult.data.filter((entry) => entry.key !== 'default')
//     nlpResult.value = nlpResult.value.filter((entry) => !entry.hasOwnProperty('default'))
//
//     return nlpResult
//   }
//
//   private extractComparisonAndValue (option: string): [string | null, number | null] {
//     const comparisonRegex = /(above|below|greater than|less than|more than|lesser than|over|under|>=|<=|>|<)\s*(\d+)/i
//     const match = option.match(comparisonRegex)
//     if (match) {
//       const comparison = this.synonymMap[match[1].toLowerCase()] || match[1]
//       const value = parseFloat(match[2])
//       return [comparison, value]
//     }
//     return [null, null]
//   }
//
//   private predictIntent (userInput: string[]): string {
//     const tokens = this.encodeCategoricalData([userInput])
//     const predicted = this.decisionTree.predict(tokens)[0]
//
//     const predictedString = typeof predicted === 'string' ? predicted.toLowerCase() : String(predicted).toLowerCase()
//     console.log(`Predicted Intent: ${predictedString}`)
//
//     let matchingCondition = Object.keys(this.searchConditionsMap).find(
//       (condition) => condition.toLowerCase() === predictedString
//     )
//
//     if (!matchingCondition) {
//       matchingCondition = Object.keys(this.searchConditionsMap).find((condition) =>
//         predictedString.includes(condition.toLowerCase())
//       )
//     }
//
//     if (matchingCondition) {
//       console.log(`Found matching condition for intent "${predictedString}": "${matchingCondition}"`)
//       return matchingCondition
//     }
//
//     console.warn(`No matching search condition found for intent "${predictedString}".`)
//     return 'default_intent'
//   }
//
//   private encodeCategoricalData (data: string[][]): number[][] {
//     const encodedData: number[][] = []
//     const uniqueValuesMap: Record<string, number> = {}
//
//     let currentIndex = 0
//
//     data.forEach((row) => {
//       const encodedRow: number[] = row.map((value) => {
//         if (!(value in uniqueValuesMap)) {
//           uniqueValuesMap[value] = currentIndex++
//         }
//         return uniqueValuesMap[value]
//       })
//       encodedData.push(encodedRow)
//     })
//
//     return encodedData
//   }
//
//   private processIntent (intent: string, nlpResult: { data: SearchCondition[]; value: SearchValue[] }): void {
//     const condition = this.searchConditionsMap[intent]
//
//     if (condition) {
//       switch (condition.type) {
//         case 'category':
//           if (condition.candidates && condition.candidates.length > 0) {
//             const selectedCategory = condition.candidates[0]
//             nlpResult.data.push({ key: condition.querry_name, label: selectedCategory })
//             nlpResult.value.push({ [condition.querry_name]: selectedCategory })
//           }
//           break
//
//         case 'binary':
//           nlpResult.data.push({ key: condition.querry_name, label: 'true' })
//           nlpResult.value.push({ [condition.querry_name]: true })
//           break
//
//         case 'range':
//           const minValue = condition.default_min || 0
//           const maxValue = condition.default_max || 100
//           nlpResult.data.push({ key: condition.querry_name, label: `min: ${minValue}, max: ${maxValue}` })
//           nlpResult.value.push({ [condition.querry_name]: { min: minValue, max: maxValue } })
//           break
//
//         default:
//           console.warn(`Unknown condition type "${condition.type}" for intent "${intent}".`)
//       }
//     } else {
//       console.warn(`No matching search condition found for intent "${intent}".`)
//       nlpResult.data.push({ key: 'default', label: 'No matching condition' })
//       nlpResult.value.push({ default: 'No matching condition' })
//     }
//   }
//
//   public setfuzzyMatchEnabled (enabled:boolean) {
//     this.fuzzyMatchEnabled = enabled
//   }
// }
//
// module.exports = NlpHelper
//
// // export default NlpHelper

// Initial version
// const { containerBootstrap } = require('@nlpjs/core')
// const { Nlp } = require('@nlpjs/nlp')
// const { LangEn } = require('@nlpjs/lang-en-min')
// const { DecisionTreeClassifier } = require('ml-cart')
// const path = require('path') // 引入 path 模块
// const searchConditions = require('../components/mouse/search_conditions.json')
//
// interface SearchCondition {
//   key: string;
//   label: string;
// }
//
// interface SearchValue {
//   [key: string]: any;
// }
//
// interface TrainingData {
//   input: string[];
//   output: string;
// }
//
// class NlpHelper {
//   private nlp: any;
//   private decisionTree: any;
//   private searchConditionsMap: Record<string, any>;
//   private trainingData: TrainingData[];
//   private synonymMap: Record<string, string>;
//   private modelFilePath: string;
//
//   constructor () {
//     this.searchConditionsMap = this.buildSearchConditionsMap()
//     this.trainingData = this.getTrainingData()
//     this.synonymMap = this.buildSynonymMap() // Synonym map for binary and range handling
//     this.modelFilePath = path.join(__dirname, 'model.nlp') // 设置模型文件的路径
//   }
//
// /
//
//   private buildSearchConditionsMap (): Record<string, any> {
//     const map: Record<string, any> = {}
//
//     function traverse (node: any): void {
//       if (node.querry_name) {
//         map[node.querry_name] = {
//           type: node.type,
//           candidates: node.candidates || [],
//           display_name: node.display_name
//         }
//       }
//       if (node.children) {
//         node.children.forEach(traverse)
//       }
//     }
//
//     traverse(searchConditions)
//     return map
//   }
//
//   private buildSynonymMap (): Record<string, string> {
//     return {
//       'apical dendrite': 'has_apical:true',
//       'axon': 'has_recon_axon:true',
//       'dendrite': 'has_recon_den:true',
//       'with dendrite': 'has_recon_den:true',
//       'have axon': 'has_recon_axon:true',
//       'with axon': 'has_recon_axon:true',
//       'has axon': 'has_recon_axon:true',
//       'without axon': 'has_recon_axon:false',
//       'have dendrite': 'has_recon_den:true',
//       'has dendrite': 'has_recon_den:true',
//       'without dendrite': 'has_recon_den:false',
//       'have apical dendrite': 'has_apical:true',
//       'with apical dendrite': 'has_apical:true',
//       'has apical dendrite': 'has_apical:true',
//       'without apical dendrite': 'has_apical:false'
//     }
//   }
//
//   private addIntentsAndEntities (json: any): void {
//     const addEntities = (node: any): void => {
//       if (node.querry_name) {
//         if (node.type === 'category' && node.candidates) {
//           node.candidates.forEach((candidate: string) => {
//             this.nlp.addNerRuleOptionTexts('en', node.querry_name, [candidate], [candidate.toLowerCase()])
//           })
//         } else if (node.type === 'binary') {
//           this.nlp.addNerRuleOptionTexts('en', node.querry_name, ['yes'], ['yes', 'true', '1'])
//           this.nlp.addNerRuleOptionTexts('en', node.querry_name, ['no'], ['no', 'false', '0'])
//         }
//       }
//
//       if (node.children) {
//         node.children.forEach(addEntities)
//       }
//     }
//
//     const addIntents = (node: any): void => {
//       if (node.querry_name) {
//         const patterns = [
//           `search for ${node.display_name}`,
//           `show ${node.display_name}`,
//           `find ${node.display_name}`,
//           `neurons with ${node.display_name}`,
//           `neurons have ${node.display_name}`,
//           `with ${node.display_name}`,
//           `have ${node.display_name}`,
//           `${node.display_name}`
//         ]
//
//         patterns.forEach((pattern) => {
//           this.nlp.addDocument('en', pattern, node.querry_name)
//         })
//       }
//
//       if (node.children) {
//         node.children.forEach(addIntents)
//       }
//     }
//
//     addEntities(json)
//     addIntents(json)
//   }
//
//   private getTrainingData (): TrainingData[] {
//     const trainingData: TrainingData[] = []
//
//     Object.values(this.searchConditionsMap).forEach((condition) => {
//       // eslint-disable-next-line camelcase
//       const { querry_name, type, candidates, display_name } = condition
//
//       if (type === 'category') {
//         candidates.forEach((candidate: string) => {
//           trainingData.push({
//             input: ['show', display_name.toLowerCase(), candidate.toLowerCase()],
//             output: querry_name
//           })
//         })
//       } else if (type === 'binary') {
//         ['true', 'false'].forEach((binaryValue) => {
//           trainingData.push({
//             input: ['find', display_name.toLowerCase(), binaryValue],
//             output: querry_name
//           })
//         })
//
//         const commonPhrases = [
//           `neurons with ${display_name.toLowerCase()}`,
//           `neurons have ${display_name.toLowerCase()}`,
//           `find neurons with ${display_name.toLowerCase()}`,
//           `find neurons have ${display_name.toLowerCase()}`,
//           `show neurons with ${display_name.toLowerCase()}`,
//           `show neurons have ${display_name.toLowerCase()}`,
//           `do neurons have ${display_name.toLowerCase()}?`,
//           `are there neurons with ${display_name.toLowerCase()}?`
//         ]
//
//         commonPhrases.forEach((phrase) => {
//           trainingData.push({
//             input: [phrase],
//             output: querry_name
//           })
//         })
//       }
//     })
//
//     return trainingData
//   }
//
//   private ensureConsistentDimensions (data: number[][]): number[][] {
//     const maxLength = Math.max(...data.map((row) => row.length))
//     return data.map((row) => {
//       const newRow = [...row]
//       while (newRow.length < maxLength) {
//         newRow.push(0)
//       }
//       return newRow
//     })
//   }
//
//   private trainDecisionTree (): void {
//     const inputs = this.trainingData.map((item) => item.input)
//     const outputs = this.trainingData.map((item) => item.output)
//
//     let encodedInputs = this.encodeCategoricalData(inputs)
//     encodedInputs = this.ensureConsistentDimensions(encodedInputs)
//     const uniqueOutputValues = Array.from(new Set(outputs))
//     const encodedOutputs = outputs.map((output) => uniqueOutputValues.indexOf(output))
//
//     if (encodedInputs.length !== encodedOutputs.length) {
//       throw new Error('Input and output arrays must have the same length.')
//     }
//
//     this.decisionTree = new DecisionTreeClassifier()
//     this.decisionTree.train(encodedInputs, encodedOutputs)
//     console.log('Decision tree training completed successfully.')
//   }
//
//   private normalizeValue (value: string): string {
//     // 直接检查完整短语的匹配情况
//     if (this.synonymMap[value]) {
//       return this.synonymMap[value]
//     }
//
//     const tokens = value.toLowerCase().split(/\s+/)
//     const normalizedTokens = tokens.map(token => this.synonymMap[token] || token)
//     const normalizedPhrase = normalizedTokens.join(' ')
//
//     // Check if the entire normalized phrase matches a key in the synonym map
//     return this.synonymMap[normalizedPhrase] || normalizedPhrase
//   }
//
//   private extractEntitiesFromQuery (query: string): { entity: string; option: any }[] {
//     const entities: { entity: string; option: any }[] = []
//     const phrases = query
//       .toLowerCase()
//     // eslint-disable-next-line no-useless-escape
//       .split(/[,\s]+(and|or)?\s*|[;,\/]/g) // Enhanced splitting to consider more separators.
//       .filter(Boolean) // Remove any empty elements.
//
//     const negationWords = ['without', 'don’t have', "don't have", 'no', 'not']
//     const projectionPhrases = ['project', 'arborize', 'extend', 'elongate', 'traversal']
//     const targetPrepositions = ['to']
//     const projectionStartPatterns = projectionPhrases.flatMap(phrase => targetPrepositions.map(prep => `${phrase} ${prep}`)) // Combine phrases like "project to"
//
//     let isProjectionContext = false // Track if we are in a projection context
//     let currentNeuronType = '' // Track current neuron type for projections
//
//     for (let i = 0; i < phrases.length; i++) {
//       let found = false
//
//       for (let j = Math.min(phrases.length, i + 5); j > i; j--) {
//         const subPhrase = phrases.slice(i, j).join(' ').replace(/[;,]/g, '').trim() // Clean up
//         const normalizedPhrase = this.normalizeValue(subPhrase)
//         console.log(`Checking phrase: "${subPhrase}" -> "${normalizedPhrase}"`) // Debugging output
//
//         // Detect projection context based on known phrases and target prepositions
//         if (projectionStartPatterns.some(pattern => subPhrase.startsWith(pattern))) {
//           isProjectionContext = true
//           currentNeuronType = entities.find(e => e.entity === 'celltype')?.option || 'unknown'
//           console.log(`Entering projection context with neuron type: ${currentNeuronType}`)
//           i = j - 1 // Move to the next relevant phrase
//           found = true
//           break // Exit to process next phrase
//         }
//
//         // Handle projection target brain regions if in projection context
//         if (isProjectionContext) {
//           const projectionData = this.getAnatomicalProjectionStrength(currentNeuronType, normalizedPhrase)
//
//           if (projectionData) {
//             Object.entries(projectionData).forEach(([key, value]) => {
//               entities.push({ entity: key, option: value })
//               console.log(`Entity extracted for projection: { entity: '${key}', option: ${JSON.stringify(value)} }`)
//             })
//             isProjectionContext = false // Reset projection context after processing
//             i = j - 1 // Move to the next relevant phrase
//             found = true
//             break
//           }
//         }
//
//         // Handle data source and other general entities
//         const matchResult = this.mapValueToQuerryName(normalizedPhrase)
//         console.log('matchResult', matchResult)
//         if (matchResult) {
//           const option = matchResult.matchedValue
//           entities.push({ entity: matchResult.querry_name, option })
//           console.log(`Entity extracted from phrase: ${JSON.stringify({ entity: matchResult.querry_name, option })}`)
//           i = j - 1 // Adjust index
//           found = true
//           break
//         }
//       }
//
//       if (!found) {
//         console.log(`No match found for phrase: "${phrases[i]}"`) // Debug log
//       }
//     }
//
//     if (isProjectionContext) {
//       console.warn('Projection context was detected, but no valid projection target was found.')
//     }
//
//     console.log(`Extracted Entities after processing phrases: ${JSON.stringify(entities)}`) // Debugging output
//     return entities
//   }
//
//   private getAnatomicalProjectionStrength (neuronType: string, brainRegion: string): { [key: string]: any } | null {
//     console.log('getAnatomicalProjectionStrength')
//     console.log(neuronType)
//     console.log(brainRegion)
//     const projectionTypes = ['axon', 'den'] // Axonal and dendritic types (short form)
//     const projectionPatterns = ['axonal', 'dendritic'] // Corresponding full form patterns
//     const anatomicalProjectionNodeName = 'anatomical projection strength' // Node to look for projections
//
//     for (let index = 0; index < projectionTypes.length; index++) {
//       const projectionType = projectionTypes[index] // 'axon' or 'den'
//       const patternName = `${projectionPatterns[index]} patterns` // 'axonal patterns' or 'dendritic patterns'
//
//       // Find the pattern node in searchConditions
//       const projectionNode = searchConditions.children.find((node: any) => node.name.toLowerCase() === patternName.toLowerCase())
//       if (!projectionNode) {
//         console.log(`No projection pattern node found for: ${patternName}`)
//         continue // Skip if the node doesn't exist
//       }
//
//       // Find the anatomical projection strength node under the pattern node
//       const anatomicalProjectionNode = projectionNode.children.find((child: any) => child.name.toLowerCase() === anatomicalProjectionNodeName.toLowerCase())
//       if (!anatomicalProjectionNode) {
//         console.log(`No anatomical projection strength node found under: ${patternName}`)
//         continue // Skip if the anatomical projection node is missing
//       }
//
//       // Search within the anatomical projection children for the matching region key
//       const matchingChild = anatomicalProjectionNode.children.find((child: any) => child.name.toLowerCase().includes(brainRegion.toLowerCase()))
//       console.log('matchingChild')
//       console.log(matchingChild)
//       if (matchingChild) {
//         const matchingKey = matchingChild.name // This should be the projection region key
//         const projKey = `proj_${projectionType}_${matchingKey}_abs` // Format the key as specified
//         const value = matchingChild.value || 0 // Assuming the value is directly stored in the matchingChild, default to 0 if not available
//
//         console.log(`Match found for projection: { entity: '${projKey}', value: ${value} }`)
//         return { [projKey]: value } // Return the correctly formatted key-value pair
//       }
//     }
//
//     console.warn(`No anatomical projection strength data found for neuron type "${neuronType}" to brain region "${brainRegion}".`)
//     return null
//   }
//
//   private mapToCorrectCasingDynamically (value: string): string {
//     // eslint-disable-next-line camelcase
//     for (const querry_name in this.searchConditionsMap) {
//       const condition = this.searchConditionsMap[querry_name]
//       const normalizedCandidates = condition.candidates.map((candidate: any) => String(candidate).toLowerCase())
//       const index = normalizedCandidates.indexOf(value.toLowerCase())
//
//       if (index !== -1) {
//         return condition.candidates[index] // Return the correctly cased candidate
//       }
//     }
//     return value // Return the original value if no match is found
//   }
//   // Dynamically check if a type is a valid cell type from JSON
//   private isValidCellTypeFromJSON (type: string): boolean {
//     return Object.values(this.searchConditionsMap).some(condition =>
//       condition.type === 'category' && condition.candidates.map((c: string) => c.toLowerCase()).includes(type.toLowerCase())
//     )
//   }
//
//   // Dynamically check if a type is a valid brain region from JSON
//   private isValidBrainRegionFromJSON (region: string): boolean {
//     return Object.values(this.searchConditionsMap).some(condition =>
//       condition.type === 'range' && condition.display_name.toLowerCase() === region.toLowerCase()
//     )
//   }
//
//   // eslint-disable-next-line camelcase
//   private mapValueToQuerryName (value: string): { querry_name: string; matchedValue: any } | null {
//     value = this.normalizeValue(value)
//
//     // 检查是否是复合情况（带有冒号的格式）
//     if (value.includes(':')) {
//       const [entityName, entityValue] = value.split(':')
//       // eslint-disable-next-line camelcase
//       for (const querry_name in this.searchConditionsMap) {
//         const condition = this.searchConditionsMap[querry_name]
//
//         // 匹配实体名称
//         if (entityName.toLowerCase() === querry_name.toLowerCase()) {
//           // 处理二元类型匹配
//           if (condition.type === 'binary' && (entityValue === 'true' || entityValue === 'false')) {
//             return { querry_name, matchedValue: entityValue }
//           }
//
//           // 处理其他类型的匹配
//           const normalizedCandidates = condition.candidates.map((candidate: any) => String(candidate).toLowerCase())
//           if (normalizedCandidates.includes(entityValue.toLowerCase())) {
//             const exactMatch = condition.candidates.find((candidate: string) => candidate.toLowerCase() === entityValue.toLowerCase())
//             return { querry_name, matchedValue: exactMatch }
//           }
//         }
//       }
//     } else {
//       // 单词情况的原始处理逻辑
//       // eslint-disable-next-line camelcase
//       for (const querry_name in this.searchConditionsMap) {
//         const condition = this.searchConditionsMap[querry_name]
//         const normalizedCandidates = condition.candidates.map((candidate: any) => String(candidate).toLowerCase())
//
//         // 如果单词与候选项匹配或者与查询名称匹配
//         if (normalizedCandidates.includes(value.toLowerCase()) || value.toLowerCase() === querry_name.toLowerCase()) {
//           const exactMatch = condition.candidates.find((candidate: string) => candidate.toLowerCase() === value.toLowerCase())
//           return { querry_name, matchedValue: exactMatch }
//         }
//       }
//     }
//
//     return null // 如果没有找到匹配项，返回 null
//   }
//
//   async processQuery (naturalLanguageQuery: string): Promise<{ data: SearchCondition[]; value: SearchValue[] }> {
//     const extractedEntities = this.extractEntitiesFromQuery(naturalLanguageQuery)
//
//     const nlpResult: { data: SearchCondition[]; value: SearchValue[] } = {
//       data: [],
//       value: []
//     }
//
//     extractedEntities.forEach((entity) => {
//       const condition = this.searchConditionsMap[entity.entity]
//       if (condition) {
//         if (condition.type === 'binary') {
//           const value = (entity.option === 'true' || entity.option === 'yes')
//           nlpResult.data.push({ key: entity.entity, label: value.toString() })
//           nlpResult.value.push({ [entity.entity]: value })
//         } else if (condition.type === 'category') {
//           nlpResult.data.push({ key: entity.entity, label: entity.option })
//           nlpResult.value.push({ [entity.entity]: entity.option })
//         } else if (condition.type === 'range') {
//           const [comparison, value] = this.extractComparisonAndValue(entity.option)
//           if (comparison && value !== null) {
//             nlpResult.data.push({ key: entity.entity, label: `${comparison} ${value}` })
//             nlpResult.value.push({ [entity.entity]: { comparison, value } })
//           } else {
//             const minValue = condition.default_min || 0
//             const maxValue = condition.default_max || 100
//             nlpResult.data.push({ key: entity.entity, label: `min: ${minValue}, max: ${maxValue}` })
//             nlpResult.value.push({ min: minValue, max: maxValue })
//           }
//         }
//       } else {
//         console.warn(`No matching querry_name found for value "${entity.option}".`)
//       }
//     })
//
//     if (nlpResult.data.length > 0) {
//       const intent = this.predictIntent(nlpResult.data.map((item) => item.label))
//       if (intent !== 'default_intent') { // 只在找到有效意图时处理
//         this.processIntent(intent, nlpResult)
//       } else {
//         console.warn(`No valid intent found for the given query.`)
//       }
//     } else {
//       console.warn(`No valid entities found in the query: "${naturalLanguageQuery}"`)
//     }
//
//     // 去掉默认值 'default'
//     nlpResult.data = nlpResult.data.filter(entry => entry.key !== 'default')
//     nlpResult.value = nlpResult.value.filter(entry => !entry.hasOwnProperty('default'))
//
//     return nlpResult
//   }
//   private extractComparisonAndValue (option: string): [string | null, number | null] {
//     const comparisonRegex = /(above|below|greater than|less than|more than|lesser than|over|under|>=|<=|>|<)\s*(\d+)/i
//     const match = option.match(comparisonRegex)
//     if (match) {
//       const comparison = this.synonymMap[match[1].toLowerCase()] || match[1]
//       const value = parseFloat(match[2])
//       return [comparison, value]
//     }
//     return [null, null]
//   }
//
//   private predictIntent (userInput: string[]): string {
//     const tokens = this.encodeCategoricalData([userInput])
//     const predicted = this.decisionTree.predict(tokens)[0]
//
//     const predictedString = typeof predicted === 'string' ? predicted.toLowerCase() : String(predicted).toLowerCase()
//     console.log(`Predicted Intent: ${predictedString}`)
//
//     let matchingCondition = Object.keys(this.searchConditionsMap).find(
//       (condition) => condition.toLowerCase() === predictedString
//     )
//
//     if (!matchingCondition) {
//       matchingCondition = Object.keys(this.searchConditionsMap).find((condition) =>
//         predictedString.includes(condition.toLowerCase())
//       )
//     }
//
//     if (matchingCondition) {
//       console.log(`Found matching condition for intent "${predictedString}": "${matchingCondition}"`)
//       return matchingCondition
//     }
//
//     console.warn(`No matching search condition found for intent "${predictedString}".`)
//     return 'default_intent'
//   }
//
//   private encodeCategoricalData (data: string[][]): number[][] {
//     const encodedData: number[][] = []
//     const uniqueValuesMap: Record<string, number> = {}
//
//     let currentIndex = 0
//
//     data.forEach((row) => {
//       const encodedRow: number[] = row.map((value) => {
//         if (!(value in uniqueValuesMap)) {
//           uniqueValuesMap[value] = currentIndex++
//         }
//         return uniqueValuesMap[value]
//       })
//       encodedData.push(encodedRow)
//     })
//
//     return encodedData
//   }
//
//   private processIntent (intent: string, nlpResult: { data: SearchCondition[]; value: SearchValue[] }): void {
//     const condition = this.searchConditionsMap[intent]
//
//     if (condition) {
//       switch (condition.type) {
//         case 'category':
//           if (condition.candidates && condition.candidates.length > 0) {
//             const selectedCategory = condition.candidates[0]
//             nlpResult.data.push({ key: condition.querry_name, label: selectedCategory })
//             nlpResult.value.push({ [condition.querry_name]: selectedCategory })
//           }
//           break
//
//         case 'binary':
//           nlpResult.data.push({ key: condition.querry_name, label: 'true' })
//           nlpResult.value.push({ [condition.querry_name]: true })
//           break
//
//         case 'range':
//           const minValue = condition.default_min || 0
//           const maxValue = condition.default_max || 100
//           nlpResult.data.push({ key: condition.querry_name, label: `min: ${minValue}, max: ${maxValue}` })
//           nlpResult.value.push({ [condition.querry_name]: { min: minValue, max: maxValue } })
//           break
//
//         default:
//           console.warn(`Unknown condition type "${condition.type}" for intent "${intent}".`)
//       }
//     } else {
//       console.warn(`No matching search condition found for intent "${intent}".`)
//       nlpResult.data.push({ key: 'default', label: 'No matching condition' })
//       nlpResult.value.push({ default: 'No matching condition' })
//     }
//   }
// }
//
// // module.exports = NlpHelper
//
// export default NlpHelper
