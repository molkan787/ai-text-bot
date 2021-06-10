<template>
    <div>
        <v-card class="pa-4" elevation="1">
            <h4>Providers</h4>
            <table style="width:100%">
                <tbody>
                    <colgroup>
                        <col span="1" style="width:40%">
                        <col span="1" style="width:30%">
                        <col span="1" style="width:auto">
                    </colgroup>
                    <tr>
                        <td>Shortly AI</td>
                        <td>{{ isShortlyAiLoggedIn ? 'Logged In' : '---' }}</td>
                        <td>
                            <v-btn @click="logoutClick('shortlyai')" :loading="loadingStates.shortlyai" v-if="isShortlyAiLoggedIn" small>Logout</v-btn>
                            <v-btn @click="loginClick('shortlyai')" v-else small>Login</v-btn>
                        </td>
                    </tr>
                    <tr>
                        <td>Conversion AI</td>
                        <td>{{ isConversionAiLoggedIn ? 'Logged In' : '---' }}</td>
                        <td>
                            <v-btn @click="logoutClick('conversionai')" :loading="loadingStates.conversionai" v-if="isConversionAiLoggedIn" small>Logout</v-btn>
                            <v-btn @click="loginClick('conversionai')" v-else small>Login</v-btn>
                        </td>
                    </tr>
                </tbody>
            </table>
        </v-card>
        <br>
        <v-card class="pa-4" elevation="1">
            <h4>
                Generate text
            </h4>
            <v-select v-model="provider" :items="providerOptions" label="Provider" outlined dense hide-details />
            <v-select v-model="selectedWordsCount" :items="wordsCountOptions" label="Words count" outlined dense hide-details />
            <v-text-field v-if="selectedWordsCount == -1" v-model.number="customWordsCount" label="Custom words count" outlined dense hide-details />
            <v-select v-model="interval" :items="intervals" label="Interval" outlined dense hide-details />
            <FileInput v-model="keywordsFile" :filters="excelFilters" label="Keywords file" />
            <FileInput v-model="outputFilename" :filters="excelFilters" mode="dir" label="Output file" />
            <v-btn @click="startBtnClick" :color="working ? '#d96a62' : 'green'" :disabled="!!errorMessage" class="mt-2 white--text" block elevation="1">
                <v-icon v-if="working">block</v-icon>
                <v-icon v-else>play_arrow</v-icon>
                &nbsp;
                {{ working ? 'Stop' : 'Start' }}
            </v-btn>
            <div v-if="working" class="progress-text">
                Status: <strong>{{ progressText }}</strong>
            </div>
        </v-card>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import { textGeneratorService } from '../services/textGenerator'
import { shortlyAiService } from '../services/shortlyai'
import { conversionAiService } from '../services/conversionai'
import FileInput from './atoms/FileInput.vue'

export default{
    components: {
        FileInput
    },
    data:() => ({
        keywordsFile: null,
        outputFilename: null,
        errorMessage: '',
        interval: 5000,
        provider: 'shortlyai',
        working: false,
        progress: 0,
        statusCode: '',
        progressController: null,
        intervals: [
            {value: 1000, text: '1 Seconds'},
            {value: 2000, text: '2 Seconds'},
            {value: 3000, text: '3 Seconds'},
            {value: 4000, text: '4 Seconds'},
            {value: 5000, text: '5 Seconds'},
            {value: 10000, text: '10 Seconds'},
            {value: 15000, text: '15 Seconds'},
            {value: 20000, text: '20 Seconds'},
            {value: 30000, text: '30 Seconds'},
            {value: 60000, text: '1 minute'},
            {value: 2 * 60000, text: '2 minute'},
            {value: 3 * 60000, text: '3 minute'},
            {value: 4 * 60000, text: '4 minute'},
            {value: 5 * 60000, text: '5 minute'},
            {value: 10 * 60000, text: '10 minute'},
            {value: 15 * 60000, text: '15 minute'},
        ],
        providerOptions: [
            { value: 'shortlyai', text: 'Shortly AI' },
            { value: 'conversionai', text: 'Conversion AI' }
        ],
        wordsCountOptions: [
            { value: 50, text: '50' },
            { value: 100, text: '100' },
            { value: 500, text: '500' },
            { value: 1000, text: '1000' },
            { value: 2000, text: '2000' },
            { value: 5000, text: '5000' },
            { value: -1, text: 'Custom' },
        ],
        selectedWordsCount: 100,
        customWordsCount: 150,
        excelFilters: [{
            name: 'Excel file',
            extensions: ['xlsx']
        }],
        loadingStates: {
            shortlyai: false,
            conversionai: false,
        }
    }),
    computed: {
        ...mapState(['isShortlyAiLoggedIn', 'isConversionAiLoggedIn']),
        wordsCount(){
            return this.selectedWordsCount > 0 ? this.selectedWordsCount : this.customWordsCount
        },
        progressText(){
            switch (this.statusCode) {
                case 'starting':
                    return 'Starting...'
                case 'working':
                    return `Working... processed ${this.progress} keywords`
                case 'stoping':
                    return 'Stoping...'
                case 'saving':
                    return 'Saving generated texts...'
                default:
                    return ''
            }
        },
        disableButton(){
            return this.statusCode === 'stoping' || this.statusCode === 'saving'
        }
    },
    methods: {
        async loginClick(provider){
            if(provider == 'shortlyai'){
                await shortlyAiService.login()
            }else if(provider == 'conversionai'){
                await conversionAiService.login()
            }
        },
        async logoutClick(provider){
            this.loadingStates[provider] = true
            try {
                if(provider == 'shortlyai'){
                    await shortlyAiService.logout()
                }else if(provider == 'conversionai'){
                    await conversionAiService.logout()
                }
            } catch (error) {
                console.error(error)
            }
            this.loadingStates[provider] = false
        },

        async startBtnClick(){
            if(this.working){
                if(await confirm('Are you sure you want to stop the current process?')){
                    this.progressController.requestStop()
                }
            }else{
                this.start();
            }
        },

        async start(){
            const keywordsFilename = this.keywordsFile
            const outputFilename = this.outputFilename
            if(!keywordsFilename){
                alert('Please select the file containing keywords');
                return;
            }
            if(!outputFilename){
                alert('Please select the output filename');
                return;
            }
            if(this.provider == 'shortlyai' && !this.isShortlyAiLoggedIn){
                alert('Please login to Shortly AI')
                return
            }
            if(this.provider == 'conversionai' && !this.isConversionAiLoggedIn){
                alert('Please login to Conversion AI')
                return
            }

            this.clear();
            this.working = true;
            this.progressController = textGeneratorService.generate({
                provider: this.provider,
                keywordsFilename: keywordsFilename,
                outputFilename: outputFilename,
                interval: this.interval,
                wordsCount: this.wordsCount
            })
            this.progressController.on('changed', stats => this.progress = stats.current);
            this.progressController.on('statusChanged', ({ code }) => this.statusCode = code);
            this.progressController.on('data', data => console.log('data', data));
            await this.progressController.wait();
            if(this.progressController.status.code === 'error'){
                const { title, text } = this.progressController.status
                alert(`${text}\n- ${this.progressController.stats.success} texts generated`, title);
            }else{
                alert(`Process completed, ${this.progressController.stats.success} texts generated`);
            }
            this.working = false;
        },

        clear(){
            this.progress = 0;
            this.statusCode = '';
        }
    }
}
</script>

<style scoped>
.device-status{
    float: right;
}
.progress-text{
    margin-top: 16px;
    font-size: 14px;
}
</style>
<style>
.v-select, .v-text-field{
    margin-top: 15px !important;
}
</style>