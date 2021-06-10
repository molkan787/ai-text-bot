import axios from 'axios'
import Botter from '../libs/Botter'
import { sleep, countWords } from '../utils'
import store from '../store'
//ConversionAiService
const CONVERSIONAI_API_BASE_URL = 'https://fun.conversion.ai/api'
const CONVERSIONAI_BASE_URL = 'https://app.conversion.ai'

class ConversionAiService{

    bot = null
    set isLoggedIn(value){ store.state.isConversionAiLoggedIn = value }
    get isLoggedIn(){ return store.state.isConversionAiLoggedIn }

    async setup(){
        this.bot = new Botter({ sessionId: 'conversionai' })
        await this.bot.navigate(CONVERSIONAI_BASE_URL)
        const accessToken = await this.getAccessToken()
        this.isLoggedIn = !!accessToken
    }

    async getAccessToken(){
        try {
            return await this.bot.exec(`JSON.parse(localStorage.getItem('conversionai')).user.idToken`)
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
            await sleep(5000)
            if(accessToken){
                this.bot.hideWindow()
                this.isLoggedIn = true
                return
            }
        }
    }

    async logout(){
        await this.bot.wv.webContents.session.clearStorageData()
        await this.bot.navigate(CONVERSIONAI_BASE_URL)
        this.isLoggedIn = false
    }

    async generateText(keywords, wordsCount){
        if(typeof wordsCount !== 'number'){
            throw new Error('`wordsCount` must be of type number')
        }
        const workspace = await this.bot.exec(`JSON.parse(localStorage.getItem('conversionai')).user.workspace`);
        const { id: workspaceId, project: { id: projectId } } = workspace
        const title = await this.generateTitle(workspaceId, projectId, keywords)
        await sleep(2000)
        const intro = await this.generateIntro(workspaceId, projectId, keywords, title)
        let text = intro
        while(countWords(text) < wordsCount){
            await sleep(2000)
            const content = await this.generateContent(workspaceId, projectId, keywords, title, intro, text.substr(-700))
            text += content
        }
        return text
    }

    async generateContent(workspaceId, projectId, keywords, title, intro, currentContent){
        const data = await this.callApi('getCompletion', {
            workspaceId: workspaceId,
            projectId: projectId,
            skillId: "930a4445-1e1c-4b0e-af60-7d451b0dfb4f",
            input: {
                fromLanguage: "EN",
                toLanguage: "EN-US",
                languageFormality: "default",
                intro: intro,
                title: title,
                topic: keywords,
                keywords: "",
                content: currentContent
            },
            outputLength: "medium",
            filter: true
        })
        return data[0].text
    }

    async generateTitle(workspaceId, projectId, keywords){
        const data = await this.callApi('getCompletion', {
            workspaceId: workspaceId,
            projectId: projectId,
            skillId: "9709b7c2-4318-4875-9b84-c4900989eb0d",
            input: {
                fromLanguage: "EN",
                keywords: "",
                toLanguage: "EN-US",
                topic: keywords
            },
            filter: true,
            n: 1
        })
        return data[0].text
    }

    async generateIntro(workspaceId, projectId, keywords, title){
        const data = await this.callApi('getCompletion', {
            workspaceId: workspaceId,
            projectId: projectId,
            skillId: "4c29bc87-9d33-4f34-9776-7ae54c67af64",
            input: {
                fromLanguage: "EN",
                keywords: "",
                title: title,
                toLanguage: "EN-US",
                topic: keywords
            },
            filter: true,
            n: 1
        })
        return data[0].text
    }

    async callApi(path, body){
        const accessToken = await this.getAccessToken() 
        const { data } = await axios.post(
            `${CONVERSIONAI_API_BASE_URL}/${path}`,
            body,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )
        return data
    }

}

export const conversionAiService = new ConversionAiService()