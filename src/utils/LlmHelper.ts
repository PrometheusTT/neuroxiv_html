// @ts-ignore
import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai'

class LlmHelper {
  private llmInference: any = null; // LLM 推理实例
  private modelFileName: string = 'gemma-2b-it-gpu-int4.bin';

  constructor (modelFileName: string) {
    this.modelFileName = modelFileName
  }

  /**
   * 初始化 LLM 模型
   */
  async initializeLlm (): Promise<void> {
    try {
      const genaiFileset = await FilesetResolver.forGenAiTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
      )

      this.llmInference = await LlmInference.createFromOptions(genaiFileset, {
        baseOptions: { modelAssetPath: '/assets/gemma-2b-it-gpu-int4.bin' },
        // 可配置参数
        maxTokens: 2048,
        temperature: 1.0
      })

      console.log('LLM model loaded successfully!')
    } catch (error) {
      console.error('Failed to initialize LLM model:', error)
    }
  }

  /**
   * 处理自然语言查询
   */
  async processQuery (query: string): Promise<string> {
    if (!this.llmInference) {
      throw new Error('LLM model is not initialized.')
    }

    return new Promise((resolve, reject) => {
      const output: string[] = []
      const displayPartialResults = (partialResults: string, complete: boolean) => {
        output.push(partialResults)

        if (complete) {
          if (output.length === 0) {
            resolve('Result is empty.')
          } else {
            resolve(output.join(' '))
          }
        }
      }

      try {
        this.llmInference.generateResponse(query, displayPartialResults)
      } catch (error) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(`Error during inference: ${error.message}`)
      }
    })
  }
}

export default LlmHelper
