import WithEvents from './WithEvents';
import { sleep } from '../utils'

export default class Progress extends WithEvents{

    constructor(total, payload){
        super();
        this.state = {
            isFinished: false,
            promise: null,
            resolve: null,
            reject: null,
        };
        this.stats = {
            total,
            success: 0,
            failure: 0,
        };
        this.status = {
            code: null,
            title: null,
            text: null,
        }
        this.data = [];
        this.payload = payload
    }

    /**
     * 
     * @param {any[]} stepsData 
     * @param {(stepData: any) => Promise<any>} stepRunner 
     * @param {{ interval?: number, beforeFinish?: () => Promise<void> }} options
     */
    async do(stepsData, stepRunner, options){
        const { interval, beforeFinish } = options || {}
        const len = stepsData.length
        this.stats.total = len
        for(let i = 0; i < len; i++){
            if(this.isFinished) return
            if(this.isStoping){
                if(typeof beforeFinish === 'function'){
                    await beforeFinish()
                }
                this.finish('stoped', 'Stoped', 'Stoped manually')
                return
            }
            try {
                const result = await stepRunner(stepsData[i])
                this.addData(result)
                this.report(1, 0)
            } catch (error) {
                console.error(error)
                this.$emit('error', error)
                this.report(0, 1)
            }
            if(interval){
                const isLast = i - 1 === len
                if(!isLast && !this.isStoping){
                    await sleep(interval)
                }
            }
        }
        if(typeof beforeFinish === 'function'){
            await beforeFinish()
        }
        this.finish('completed', 'Completed', 'Tasks Completed!')
    }

    finish(code, title, text){
        if(this.isFinished) return;
        this.setStatus(code, title, text);
        this.close();
        this._finish(status);
    }

    requestStop(statusTitle, statusText){
        this.setStatus('stoping', statusTitle || '', statusText || '')
    }

    setStatusText(text){
        const { code, title } = this.status;
        this.setStatus(code, title, text);
    }

    setStatus(code, title, text){
        this.status.code = code;
        this.status.title = title;
        this.status.text = text;
        this.$emit('statusChanged', {
            code,
            title,
            text
        });
    }

    report(success, failure){
        const c = this.stats;
        c.success += success;
        c.failure += failure;
        const current = c.success + c.failure;
        this.$emit('changed', {
            success: c.success,
            failure: c.failure,
            total: c.total,
            current,
            percent: current / c.total
        });
    }

    addData(data){
        this.data.push(data);
        this.$emit('data', data);
    }

    _finish(){
        const s = this.state;
        s.isFinished = true;
        if(s.resolve) s.resolve();
        this.$emit('finished', {
            stats: this.stats,
            status: this.status
        });
    }

    wait(){
        const s = this.state;
        if(s.isFinished){
            return Promise.resolve();
        }
        if(s.promise === null){
            s.promise = new Promise((resolve, reject) => {
                s.resolve = resolve;
                s.reject = reject;
            })
        }
        return s.promise;
    }

    get isFinished(){
        return this.state.isFinished;
    }

    get isStoping(){
        return this.status.code === 'stoping';
    }

}