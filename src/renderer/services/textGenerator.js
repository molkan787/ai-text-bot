import path from 'path'
import Progress from '../libs/Progress'
import { keywordsReaderService } from './keywordsreader'
import { shortlyAiService } from './shortlyai'
import { conversionAiService } from './conversionai'
import { docxCreatorService } from './docxCreator'

class TextGeneratorService{

    /**
     * 
     * @param {{provider: 'shortlyai' | 'conversionai', keywordsFilename: string, outputFilename: string, interval: number, wordsCount: number}} payload 
     * @returns Progress
     */
    generate(payload){
        const progress = new Progress(0)
        progress.setStatus('starting', 'Starting', 'Starting')
        setTimeout(async () => {
            try {
                const { provider, keywordsFilename, outputFilename, interval, wordsCount } = payload
                const keywords = await keywordsReaderService.read(keywordsFilename)
                const service = provider === 'shortlyai' ? shortlyAiService : conversionAiService
                progress.on('error', err => {
                    const isUnauthorized = (err && err.response && err.response.status) === 401
                    if(isUnauthorized){
                        progress.finish('error', 'Session Expired', 'Your session expired, Please re-login and start the task again')
                    }
                })
                progress.setStatus('working', 'Working', 'Working')
                await progress.do(keywords, async (keyword) => {
                    const text = await service.generateText(keyword, wordsCount)
                    const docFilename = path.join(outputFilename, `${keyword}.docx`)
                    await docxCreatorService.createFromText(docFilename, text)
                    return keyword
                }, {
                    interval: interval,
                    async beforeFinish(){
                        // progress.setStatus('saving', 'Saving', 'Saving generated texts')
                        // const xls = json2xls(progress.data)
                        // await fs.writeFile(outputFilename, xls, 'binary')
                    }
                })
            } catch (error) {
                console.error(error)
                progress.finish('error', 'An error occured', error.message)
            }
        }, 0)
        return progress
    }

}

export const textGeneratorService = new TextGeneratorService()