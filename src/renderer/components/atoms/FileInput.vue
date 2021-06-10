<template>
    <div class="file-input" :class="{'not-selected': !selectedFile}">
        <v-text-field :value="text" :label="label" :errorMessage="errorMessage" :hide-details="!errorMessage" outlined dense readonly>
            <template v-if="selectedFile" #append>
                <v-btn @click="clearClick" icon>
                    <v-icon>clear</v-icon>
                </v-btn>
            </template>
        </v-text-field>
    </div>
</template>

<script>
import { promptFile, promptSaveFile, promptDirectory } from '../../utils'
export default {
    props: {
        label: {
            type: String,
            default: null
        },
        value: {
            type: String,
            default: null
        },
        mode: {
            type: String,
            default: 'open'
        },
        filters: {
            type: Array
        },
        errorMessage: {
            type: Array,
            default: null
        }
    },
    data: () => ({
        selectedFile: null,
        clickHandler: null
    }),
    computed: {
        text(){
            return this.selectedFile || 'Click to select a file'
        }
    },
    methods: {
        clearClick(){
            this.setValue(null)
        },
        setValue(value){
            this.selectedFile = value
            this.$emit('input', value)
        },
        async showFileSelector(){
            const method = this.mode == 'open' ? promptFile : ( this.mode == 'save' ? promptSaveFile : promptDirectory )
            const filename = await method(this.filters)
            if(filename){
                this.setValue(filename)
            }
        }
    },
    watch: {
        value: {
            immediate: true,
            handler(value){
                this.selectedFile = value
            }
        }
    },
    mounted(){
        const vInput = this.$el.querySelector('.v-text-field__slot')
        const clickHandler = () => this.showFileSelector()
        vInput.addEventListener('click', clickHandler)
        this.clickHandler = clickHandler
    },
    beforeDestroy(){
        if(this.clickHandler){
            const vInput = this.$el.querySelector('.v-text-field__slot input')
            vInput.removeEventListener('click', this.clickHandler)
        }
    }
}
</script>

<style lang="scss">
.file-input{
    &.not-selected{
        input{
            user-select: none;
            pointer-events: none;
            opacity: 0.5;
        }
    }
    .v-input__append-inner button{
        position: relative;
        right: -9px;
        margin-bottom: -3px;
        margin-top: -5px;
    }
}
</style>