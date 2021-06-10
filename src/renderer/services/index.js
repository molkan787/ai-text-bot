import { shortlyAiService } from './shortlyai'
import { conversionAiService } from './conversionai'

export async function start(){
    await Promise.all([
        shortlyAiService.setup(),
        conversionAiService.setup()
    ])
}