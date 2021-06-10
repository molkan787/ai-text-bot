import axios from 'axios'
import Botter from '../libs/Botter'
import { sleep, countWords } from '../utils'
import store from '../store'

const SHORTLYAI_API_BASE_URL = 'https://api.shortlyai.com'
const SHORTLYAI_BASE_URL = 'https://shortlyai.com/'

class ShortlyAiService{

    accessToken = ''
    bot = null
    set isLoggedIn(value){ store.state.isShortlyAiLoggedIn = value }
    get isLoggedIn(){ return store.state.isShortlyAiLoggedIn }

    async setup(){
        this.bot = new Botter({ sessionId: 'shortlyai' })
        await this.bot.navigate(SHORTLYAI_BASE_URL)
        const accessToken = await this.getAccessToken()
        this.accessToken = accessToken
        this.isLoggedIn = !!accessToken
    }

    async getAccessToken(){
        try {
            return await this.bot.exec(`JSON.parse(JSON.parse(localStorage.getItem('persist:root')).user).jwtToken`)
        } catch (error) {
            console.error(error)
            return null
        }
    }

    async login(){
        this.bot.showWindow()
        while(true){
            await sleep(250)
            const accessToken = await this.getAccessToken()
            if(accessToken){
                this.bot.hideWindow()
                this.accessToken = accessToken
                this.isLoggedIn = true
                return
            }
        }
    }

    async logout(){
        await this.bot.exec(`localStorage.clear()`)
        await this.bot.navigate(SHORTLYAI_BASE_URL)
        this.isLoggedIn = false
        this.accessToken = ''
    }

    async generateText(keywords, wordsCount){
        if(typeof wordsCount !== 'number'){
            throw new Error('`wordsCount` must be of type number')
        }
        let text = ''
        while(countWords(text) < wordsCount){
            await sleep(2000)
            const content = await this.generateContent(keywords, text)
            text += content
        }
        return text
    }
    
    async generateContent(keywords, currentText){
        const data = await this.callApi('stories/write-for-me/',{
            document_type: "article",
            prompt: keywords,
            content: currentText,
            story_background: "",
            ai_instructions: null,
            output_length: 1,
            is_command: false
        })
        return data.text
    }

    async callApi(path, body){
        const { data } = await axios.post(
            `${SHORTLYAI_API_BASE_URL}/${path}`,
            body,
            {
                headers: {
                    Authorization: `JWT ${this.accessToken}`
                }
            }
        )
        return data
    }

}

export const shortlyAiService = new ShortlyAiService()